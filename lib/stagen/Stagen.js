"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stagen = void 0;
const FileSystem = require("fs");
const Path = require("path");
const OS = require("os");
const WorkerThreads = require("worker_threads");
const WorkerState_1 = require("./WorkerState");
var ProcessingState;
(function (ProcessingState) {
    ProcessingState[ProcessingState["METADATA"] = 0] = "METADATA";
    ProcessingState[ProcessingState["MARKDOWN"] = 1] = "MARKDOWN";
})(ProcessingState || (ProcessingState = {}));
class Stagen {
    constructor(templateFile, rootDir, outputDir) {
        this._templateFile = templateFile;
        this._rootDir = rootDir;
        this._outputDir = outputDir;
        this._workerExitPromises = [];
        this._metadataQueue = null;
        this._processingQueue = null;
        this._metadata = {};
        this._contents = {};
        this._state = ProcessingState.METADATA;
        this._workerStates = {};
    }
    async execute() {
        this._metadataQueue = this._scanForPages(this._rootDir);
        this._processingQueue = [];
        this._workers = this._initWorkers();
        await Promise.all(this._workerExitPromises);
    }
    _getWorkerCount() {
        return Infinity;
    }
    _initWorkers() {
        let cpus = Math.min(this._metadataQueue.length, OS.cpus().length, this._getWorkerCount());
        let workers = [];
        for (let i = 0; i < cpus; i++) {
            let worker = this._createWorker();
            this._workerStates[worker.threadId] = WorkerState_1.WorkerState.INITIALIZING;
            this._workerExitPromises.push(this._createExitPromise(worker));
            workers.push(worker);
        }
        return workers;
    }
    _createExitPromise(worker) {
        return new Promise((resolve, reject) => {
            worker.once('exit', (exitCode) => {
                if (exitCode !== 0) {
                    reject(exitCode);
                }
                else {
                    resolve();
                }
            });
        });
    }
    _createWorker() {
        let worker = new WorkerThreads.Worker(Path.resolve(__dirname, './MarkdownProcessor.js'), {
            workerData: {
                rootDir: this._rootDir,
                templateFile: this._templateFile,
                outputDir: this._outputDir
            }
        });
        worker.on('message', (packet) => {
            switch (packet.code) {
                case 'state-update':
                    this._workerStates[worker.threadId] = packet.data;
                    if (packet.data === WorkerState_1.WorkerState.IDLE) {
                        this._onWorkerIdle(worker);
                    }
                    break;
                case 'metadata-response':
                    this._onMetadataResponse(packet.data);
                    break;
            }
        });
        return worker;
    }
    _onMetadataResponse(data) {
        let page = data.page;
        let contents = data.contents;
        let metadata = data.metadata;
        let parsedPath = this._parsePath(page);
        let metadataObj = this._getMetadataObj(parsedPath);
        for (let i in metadata) {
            metadataObj[i] = metadata[i];
        }
        this._contents[page] = contents;
        this._processingQueue.push(page);
    }
    _getMetadataObj(path) {
        let parts = path.split('.');
        let visitor = this._metadata;
        for (let i = 0; i < parts.length; i++) {
            let p = parts[i];
            if (!visitor[p]) {
                visitor[p] = {};
            }
            visitor = visitor[p];
        }
        return visitor;
    }
    _normalizePath(path) {
        return path.replace(this._rootDir, '');
    }
    _parsePath(path) {
        let parts = Path.parse(this._normalizePath(path));
        let dir = '';
        let obj = parts.name;
        if (parts.dir !== '/') {
            dir = parts.dir.slice(1).replace('/', '.');
        }
        let parsedPath = dir;
        if (parsedPath) {
            parsedPath += '.' + obj;
        }
        else {
            parsedPath = obj;
        }
        return parsedPath;
    }
    _startMarkdownProcessing() {
        let isAllIdling = true;
        for (let i in this._workerStates) {
            if (this._workerStates[i] !== WorkerState_1.WorkerState.IDLE) {
                isAllIdling = false;
                break;
            }
        }
        if (!isAllIdling) {
            setTimeout(() => {
                this._startMarkdownProcessing();
            }, 1000);
            return;
        }
        for (let i = 0; i < this._workers.length; i++) {
            this._onWorkerIdle(this._workers[i]);
        }
    }
    _processPage(worker, page) {
        let parsed = this._parsePath(page);
        let context = this._getMetadataObj(parsed);
        worker.postMessage({
            code: 'process-markdown',
            data: {
                page: page,
                context: context,
                metadata: this._metadata,
                markdown: this._contents[page]
            }
        });
    }
    _onWorkerIdle(worker) {
        switch (this._state) {
            case ProcessingState.METADATA:
                if (this._metadataQueue.length > 0) {
                    let page = this._metadataQueue.pop();
                    worker.postMessage({
                        code: 'process-metadata',
                        data: page
                    });
                }
                else {
                    this._state = ProcessingState.MARKDOWN;
                    process.nextTick(() => {
                        this._startMarkdownProcessing();
                    });
                }
                break;
            case ProcessingState.MARKDOWN:
                if (this._processingQueue.length > 0) {
                    this._processPage(worker, this._processingQueue.pop());
                }
                else {
                    worker.postMessage({
                        code: 'exit'
                    });
                }
                break;
        }
    }
    _scanForPages(dir) {
        let fstat = FileSystem.statSync(dir);
        let output = [];
        if (fstat.isDirectory()) {
            let dirs = FileSystem.readdirSync(dir);
            for (let i = 0; i < dirs.length; i++) {
                output = output.concat(this._scanForPages(Path.resolve(dir, dirs[i])));
            }
        }
        else if (fstat.isFile() && Path.parse(dir).ext === '.md') {
            output.push(dir);
        }
        return output;
    }
}
exports.Stagen = Stagen;
//# sourceMappingURL=Stagen.js.map