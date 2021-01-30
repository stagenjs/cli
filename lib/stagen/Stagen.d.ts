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
    private _progress;
    private _progressValue;
    private _configFile;
    private _config;
    private _assetsDir;
    constructor(templateFile: string, rootDir: string, outputDir: string, configFile: string, assetsDir: string);
    private _setProgressTotal;
    private _updateProgress;
    private _incrementProgress;
    execute(): Promise<void>;
    private _getWorkerCount;
    private _initWorkers;
    private _createExitPromise;
    private _createWorker;
    private _convertToHTMLPath;
    private _onMetadataResponse;
    private _getMetadataObj;
    private _normalizePath;
    private _parsePath;
    private _startMarkdownProcessing;
    private _processMetadata;
    private _processMetadataItem;
    private _processPage;
    private _onWorkerIdle;
    private _scanForPages;
}
