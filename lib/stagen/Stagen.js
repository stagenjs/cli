"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stagen = void 0;
const FileSystem = require("fs");
const Path = require("path");
const OS = require("os");
const WorkerTheads = require("worker_threads");
class Stagen {
    constructor(templateFile, rootDir, outputDir) {
        this._templateFile = templateFile;
        this._rootDir = rootDir;
        this._outputDir = outputDir;
        console.log(this._rootDir, this._outputDir);
        this._pages = null;
    }
    async execute() {
        this._pages = this._scanForPages(this._rootDir);
        await this._processPages();
    }
    _getWorkerCount() {
        return Infinity;
    }
    async _processPages() {
        let cpus = Math.min(this._pages.length, OS.cpus().length, this._getWorkerCount());
        let workerThreads = {};
        let promises = [];
        for (let i = 0; i < cpus; i++) {
            workerThreads[i] = this._createWorker();
            promises.push(this._createExitPromise(workerThreads[i]));
        }
        await Promise.all(promises);
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
        let worker = new WorkerTheads.Worker(Path.resolve(__dirname, './MarkdownProcessor.js'), {
            workerData: {
                rootDir: this._rootDir,
                templateFile: this._templateFile,
                outputDir: this._outputDir
            }
        });
        worker.on('message', (packet) => {
            switch (packet.code) {
                case 'state':
                    if (packet.data === 'idle') {
                        this._onWorkerIdle(worker);
                    }
                    break;
            }
        });
        return worker;
    }
    _onWorkerIdle(worker) {
        console.log('ON IDLE');
        if (this._pages.length > 0) {
            let page = this._pages.pop();
            worker.postMessage({
                code: 'process',
                data: page
            });
        }
        else {
            worker.postMessage({
                code: 'exit'
            });
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