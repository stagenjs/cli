export declare class Stagen {
    private _rootDir;
    private _srcDir;
    private _outputDir;
    private _metadataQueue;
    private _processingQueue;
    private _templateRoot;
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
    private _styleEntry;
    private _templateAssets;
    constructor(rootDir: string, outputDir: string);
    private _setProgressTotal;
    private _updateProgress;
    private _incrementProgress;
    private _endStream;
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
    package(outFile: string): Promise<void>;
    private _getDefaultOutfileName;
    private _scanForPages;
}
