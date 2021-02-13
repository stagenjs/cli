"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stagen = void 0;
const FileSystem = require("fs-extra");
const Path = require("path");
const OS = require("os");
const WorkerThreads = require("worker_threads");
const WorkerState_1 = require("./WorkerState");
const cli_progress_1 = require("cli-progress");
const YAML = require("yaml");
const Sass = require("sass");
const Archiver = require("archiver");
var ProcessingState;
(function (ProcessingState) {
    ProcessingState[ProcessingState["METADATA"] = 0] = "METADATA";
    ProcessingState[ProcessingState["MARKDOWN"] = 1] = "MARKDOWN";
})(ProcessingState || (ProcessingState = {}));
class Stagen {
    constructor(rootDir, outputDir) {
        this._rootDir = rootDir;
        this._srcDir = Path.resolve(this._rootDir, 'src');
        this._configFile = Path.resolve(this._rootDir, 'stagen.yml');
        this._assetsDir = Path.resolve(this._rootDir, 'assets');
        this._outputDir = outputDir;
        this._workerExitPromises = [];
        this._metadataQueue = null;
        this._processingQueue = null;
        this._metadata = {
            mapping: {},
            files: [],
            articles: []
        };
        this._contents = {};
        this._state = ProcessingState.METADATA;
        this._workerStates = {};
        this._progressValue = 0;
        this._progress = new cli_progress_1.Bar({
            format: '[{bar}] {percentage}%    {text}',
        }, cli_progress_1.Presets.shades_classic);
        this._config = YAML.parse(FileSystem.readFileSync(Path.resolve(this._configFile), {
            encoding: 'utf8'
        }));
        if (this._config.template) {
            let templatePath = Path.resolve(this._rootDir, this._config.template);
            if (FileSystem.existsSync(templatePath)) {
                this._templateRoot = templatePath;
            }
            else {
                try {
                    let templateModulePath = require.resolve(this._config.template, {
                        paths: [Path.resolve(this._rootDir)]
                    });
                    if (templateModulePath) {
                        let templateModule = require(templateModulePath);
                        this._templateRoot = templateModule();
                    }
                }
                catch (ex) {
                    console.error(ex);
                }
            }
        }
        else {
            this._templateRoot = Path.resolve(this._rootDir, 'template');
        }
        if (!this._templateRoot) {
            throw new Error('Missing template.');
        }
        this._templateFile = Path.resolve(this._templateRoot, 'index.ejs');
        this._templateAssets = Path.resolve(this._templateRoot, 'assets');
        this._styleEntry = Path.resolve(this._templateRoot, 'style/index.scss');
    }
    _setProgressTotal(value) {
        this._progress.setTotal(value);
    }
    _updateProgress(value, text, newTotal) {
        if (newTotal !== undefined) {
            this._setProgressTotal(newTotal);
        }
        this._progressValue = value;
        this._progress.update(value, {
            text: text
        });
    }
    _incrementProgress(text) {
        this._progress.update(++this._progressValue, {
            text: text
        });
    }
    _endStream(stream) {
        return new Promise((resolve, reject) => {
            stream.end(() => {
                resolve();
            });
        });
    }
    async execute() {
        this._progress.start(1, 0, {
            text: 'Scanning...'
        });
        this._metadataQueue = this._scanForPages(this._srcDir);
        this._processingQueue = [];
        FileSystem.mkdirSync(this._outputDir, {
            recursive: true
        });
        this._updateProgress(0, 'Initializing workers...', (this._metadataQueue.length * 2) + 1);
        this._workers = this._initWorkers();
        let robotsStream = FileSystem.createWriteStream(Path.resolve(this._outputDir, 'robots.txt'));
        robotsStream.on('error', (error) => {
            this._progress.stop();
            console.error(error);
            process.exit(1);
        });
        if (this._config.robots) {
            for (let userAgent in this._config.robots) {
                let rules = this._config.robots[userAgent];
                robotsStream.write(`User-Agent: ${userAgent}\n\n`, (error) => {
                    if (error) {
                        this._progress.stop();
                        console.error(error);
                        process.exit(1);
                    }
                });
                if (rules.disallow) {
                    for (let i = 0; i < rules.disallow.length; i++) {
                        let disallow = rules.disallow[i];
                        robotsStream.write(`Disallow: ${disallow}\n`, (error) => {
                            if (error) {
                                this._progress.stop();
                                console.error(error);
                                process.exit(1);
                            }
                        });
                    }
                }
            }
            robotsStream.write('\n\n');
        }
        robotsStream.write(`User-Agent: *\n\nSitemap: ${this._config.domain}/sitemap.txt`);
        await this._endStream(robotsStream);
        await Promise.all(this._workerExitPromises);
        let sitemapStream = FileSystem.createWriteStream(Path.resolve(this._outputDir, 'sitemap.txt'));
        for (let i = 0; i < this._metadata.files.length; i++) {
            let file = this._metadata.files[i];
            if (file.sitemap === false) {
                continue;
            }
            sitemapStream.write(this._config.domain + file.$uri + '\n');
        }
        await this._endStream(sitemapStream);
        FileSystem.copySync(this._templateAssets, Path.resolve(this._outputDir, 'tassets'));
        FileSystem.copySync(this._assetsDir, Path.resolve(this._outputDir, 'assets'));
        let styleResult = Sass.renderSync({
            file: this._styleEntry,
            outFile: Path.resolve(this._outputDir, 'tassets/style.css')
        });
        FileSystem.writeFileSync(Path.resolve(this._outputDir, 'tassets/style.css'), styleResult.css);
        this._progress.stop();
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
                srcDir: this._srcDir,
                templateRoot: this._templateRoot,
                templateFile: this._templateFile,
                outputDir: this._outputDir,
                config: this._config
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
    _convertToHTMLPath(path) {
        return path.replace(this._srcDir, '').replace(/\.md$/, '.html');
    }
    _onMetadataResponse(data) {
        let page = data.page;
        let contents = data.contents;
        let metadata = data.metadata;
        let parsedPath = this._parsePath(page);
        let metadataObj = this._getMetadataObj(parsedPath);
        metadataObj.$type = 'file';
        metadata.$uri = this._convertToHTMLPath(page);
        for (let i in metadata) {
            metadataObj[i] = metadata[i];
        }
        this._contents[page] = contents;
        this._processingQueue.push(page);
    }
    _getMetadataObj(path) {
        let parts = path.split('.');
        let visitor = this._metadata.mapping;
        for (let i = 0; i < parts.length; i++) {
            let p = parts[i];
            if (!visitor[p]) {
                visitor[p] = {
                    $type: 'directory'
                };
            }
            visitor = visitor[p];
        }
        return visitor;
    }
    _normalizePath(path) {
        return path.replace(this._srcDir, '');
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
        if (this._state === ProcessingState.MARKDOWN) {
            return;
        }
        this._processMetadata();
        this._state = ProcessingState.MARKDOWN;
        for (let i = 0; i < this._workers.length; i++) {
            this._onWorkerIdle(this._workers[i]);
        }
    }
    _processMetadata() {
        this._incrementProgress('Processing metadata...');
        for (let i in this._metadata.mapping) {
            this._processMetadataItem(this._metadata, this._metadata.mapping[i]);
        }
    }
    _processMetadataItem(root, item) {
        if (item.$type === "directory") {
            for (let i in item) {
                if (/^\$/.test(i)) {
                    continue;
                }
                this._processMetadataItem(root, item[i]);
            }
        }
        else {
            root.files.push(item);
            if (item.type === 'article') {
                root.articles.push(item);
            }
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
                    this._incrementProgress('Processing metadata...');
                    let page = this._metadataQueue.pop();
                    worker.postMessage({
                        code: 'process-metadata',
                        data: page
                    });
                }
                else {
                    process.nextTick(() => {
                        this._startMarkdownProcessing();
                    });
                }
                break;
            case ProcessingState.MARKDOWN:
                if (this._processingQueue.length > 0) {
                    this._incrementProgress('Processing markdown...');
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
    async package(outFile) {
        if (!outFile) {
            outFile = this._getDefaultOutfileName();
        }
        if (!FileSystem.existsSync(this._outputDir)) {
            throw new Error('Directory doesn\'t exists. Have you built your website yet?');
        }
        let archive = Archiver('tar', {
            statConcurrency: this._getWorkerCount(),
            gzip: true
        });
        let fstream = FileSystem.createWriteStream(Path.resolve(process.cwd(), outFile));
        archive.pipe(fstream);
        archive.directory(this._outputDir, false);
        await archive.finalize();
    }
    _getDefaultOutfileName() {
        let date = new Date();
        let name = encodeURIComponent(this._config.name.toLowerCase());
        return `${name}-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.tar.gz`;
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