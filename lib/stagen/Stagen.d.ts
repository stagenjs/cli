export declare class Stagen {
    private _rootDir;
    private _outputDir;
    private _metadataQueue;
    private _processingQueue;
    private _templateFile;
    private _workerExitPromises;
    private _metadata;
    private _contents;
    private _state;
    private _workers;
    private _workerStates;
    constructor(templateFile: string, rootDir: string, outputDir: string);
    execute(): Promise<void>;
    private _getWorkerCount;
    private _initWorkers;
    private _createExitPromise;
    private _createWorker;
    private _onMetadataResponse;
    private _getMetadataObj;
    private _normalizePath;
    private _parsePath;
    private _startMarkdownProcessing;
    private _processPage;
    private _onWorkerIdle;
    private _scanForPages;
}
