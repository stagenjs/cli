
import * as FileSystem from 'fs-extra';
import * as Path from 'path';
import * as OS from 'os';
import * as WorkerThreads from 'worker_threads';
import {IPacket} from './IPacket';
import {WorkerState} from './WorkerState';
import {Bar, Presets} from 'cli-progress';
import * as YAML from 'yaml';
import * as Sass from 'sass';

enum ProcessingState {
    METADATA,
    MARKDOWN
}

interface IMetadataItem extends Record<string, any> {
    $type: "directory" | "file"
}

interface IMetadataFile extends IMetadataItem {
    $uri: string;
}

interface IMetadata {
    mapping: Record<string, IMetadataItem>;
    files: Array<IMetadataFile>;
}

export class Stagen {
    private _rootDir: string;
    private _outputDir: string;
    private _metadataQueue: Array<string>;
    private _processingQueue: Array<string>;
    private _templateFile: string;
    private _workerExitPromises: Array<Promise<void>>;
    private _metadata: IMetadata;
    private _contents: Record<string, string>;
    private _state: ProcessingState;
    private _workers: Array<WorkerThreads.Worker>;
    private _workerStates: Record<number, WorkerState>;
    private _progress: Bar;
    private _progressValue: number;
    private _configFile: string;
    private _config: Record<any, any>;
    private _assetsDir: string;
    private _styleEntry: string;

    public constructor(templateFile: string, rootDir: string, outputDir: string, configFile: string, assetsDir: string, styleEntry: string) {
        this._templateFile = templateFile;
        this._configFile = configFile;
        this._rootDir = rootDir;
        this._outputDir = outputDir;
        this._assetsDir = assetsDir;
        this._styleEntry = styleEntry;
        this._workerExitPromises = [];
        this._metadataQueue = null;
        this._processingQueue = null;
        this._metadata = {
            mapping: {},
            files: []
        };
        this._contents = {};
        this._state = ProcessingState.METADATA;
        this._workerStates = {};
        this._progressValue = 0;
        this._progress = new Bar({
            format: '[{bar}] {percentage}%    {text}',
        }, Presets.shades_classic);

        this._config = YAML.parse(FileSystem.readFileSync(Path.resolve(this._configFile), {
            encoding: 'utf8'
        }));
    }

    private _setProgressTotal(value: number): void {
        this._progress.setTotal(value);
    }

    private _updateProgress(value: number, text: string, newTotal?: number): void {
        if (newTotal !== undefined) {
            this._setProgressTotal(newTotal);
        }
        this._progressValue = value;
        this._progress.update(value, {
            text: text
        });
    }

    private _incrementProgress(text: string): void {
        this._progress.update(++this._progressValue, {
            text: text
        });
    }

    public async execute(): Promise<void> {
        this._progress.start(1, 0, {
            text: 'Scanning...'
        });
        this._metadataQueue = this._scanForPages(this._rootDir);
        this._processingQueue = [];

        this._updateProgress(0, 'Initializing workers...', (this._metadataQueue.length * 2) + 1);
        this._workers = this._initWorkers();

        await Promise.all(this._workerExitPromises);

        FileSystem.copySync(this._assetsDir, Path.resolve(this._outputDir, 'assets'));

        let styleResult: Sass.Result = Sass.renderSync({
            file: this._styleEntry,
            outFile: Path.resolve(this._outputDir, 'assets/style.css')
        });
        FileSystem.writeFileSync(Path.resolve(this._outputDir, 'assets/style.css'), styleResult.css);

        this._progress.stop();
    }

    private _getWorkerCount(): number {
        // TODO: return worker count setting, defaulting to Infinity.
        // Infinity will fall back to OS.cpus().length.
        return Infinity;
    }

    private _initWorkers(): Array<WorkerThreads.Worker> {
        let cpus: number = Math.min(this._metadataQueue.length, OS.cpus().length, this._getWorkerCount());
        let workers: Array<WorkerThreads.Worker> = [];

        for (let i: number = 0; i < cpus; i++) {
            let worker: WorkerThreads.Worker = this._createWorker();
            this._workerStates[worker.threadId] = WorkerState.INITIALIZING;
            this._workerExitPromises.push(this._createExitPromise(worker));
            workers.push(worker);
        }

        return workers;
    }

    private _createExitPromise(worker: WorkerThreads.Worker): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            worker.once('exit', (exitCode: number) => {
                if (exitCode !== 0) {
                    reject(exitCode);
                }
                else {
                    resolve();
                }
            });
        });
    }

    private _createWorker(): WorkerThreads.Worker {
        let worker: WorkerThreads.Worker = new WorkerThreads.Worker(Path.resolve(__dirname, './MarkdownProcessor.js'), {
            workerData: {
                rootDir: this._rootDir,
                templateFile: this._templateFile,
                outputDir: this._outputDir,
                config: this._config
            }
        });
        worker.on('message', (packet: IPacket) => {
            switch (packet.code) {
                case 'state-update':
                    this._workerStates[worker.threadId] = packet.data;
                    if (packet.data === WorkerState.IDLE) {
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

    private _convertToHTMLPath(path: string): string {
        return path.replace(this._rootDir, '').replace(/\.md$/, '.html');
    }

    private _onMetadataResponse(data: any): void {
        let page: string = data.page;
        let contents: string = data.contents;
        let metadata: any = data.metadata;

        let parsedPath: string = this._parsePath(page);

        let metadataObj: Partial<IMetadataFile> = this._getMetadataObj(parsedPath);
        metadataObj.$type = 'file';
        
        metadata.$uri = this._convertToHTMLPath(page);

        for (let i in metadata) {
            metadataObj[i] = metadata[i];
        }

        this._contents[page] = contents;

        this._processingQueue.push(page);
    }

    private _getMetadataObj(path: string): IMetadataItem {
        let parts: Array<string> = path.split('.');

        let visitor: Record<any, any> = this._metadata.mapping;

        for (let i = 0; i < parts.length; i++) {
            let p: string = parts[i];
            if (!visitor[p]) {
                visitor[p] = {
                    $type: 'directory'
                };
            }

            visitor = visitor[p];
        }

        return <IMetadataItem>visitor;
    }

    private _normalizePath(path: string): string {
        return path.replace(this._rootDir, '');
    }

    private _parsePath(path: string): string {
        let parts: Path.ParsedPath = Path.parse(this._normalizePath(path));

        let dir: string = '';
        let obj: string = parts.name;

        if (parts.dir !== '/') {
            dir = parts.dir.slice(1).replace('/', '.');
        }

        let parsedPath: string = dir;

        if (parsedPath) {
            parsedPath += '.' + obj;
        }
        else {
            parsedPath = obj;
        }

        return parsedPath;
    }

    private _startMarkdownProcessing(): void {
        // First check to ensure that all workers are finished processing.

        let isAllIdling: boolean = true;
        for (let i in this._workerStates) {
            if (this._workerStates[i] !== WorkerState.IDLE) {
                isAllIdling = false;
                break;
            }
        }

        if (!isAllIdling) {
            // Then wait some more
            setTimeout(() => {
                this._startMarkdownProcessing();
            }, 1000);
            return;
        }

        this._processMetadata();

        this._state = ProcessingState.MARKDOWN;

        for (let i: number = 0; i < this._workers.length; i++) {
            this._onWorkerIdle(this._workers[i]);
        }
    }

    private _processMetadata(): void {
        this._incrementProgress('Processing metadata...');
        for (let i in this._metadata.mapping) {
            this._processMetadataItem(this._metadata, this._metadata.mapping[i]);
        }
    }

    private _processMetadataItem(root: IMetadata, item: IMetadataItem): void {
        if (item.$type === "directory") {
            for (let i in item) {
                this._processMetadataItem(root, item[i]);
            }
        }
        else {
            root.files.push(<IMetadataFile>item);
        }
    }

    private _processPage(worker: WorkerThreads.Worker, page: string): void {
        let parsed: string = this._parsePath(page);
        let context: Record<any, any> = this._getMetadataObj(parsed);
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

    private _onWorkerIdle(worker: WorkerThreads.Worker): void {
        switch (this._state) {
            case ProcessingState.METADATA:
                if (this._metadataQueue.length > 0) {
                    this._incrementProgress('Processing metadata...');
                    let page: string = this._metadataQueue.pop();
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
    
    private _scanForPages(dir: string): Array<string> {
        let fstat = FileSystem.statSync(dir);
        let output: Array<string> = [];
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
