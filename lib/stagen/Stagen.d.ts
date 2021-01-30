export declare class Stagen {
    private _rootDir;
    private _outputDir;
    private _pages;
    private _templateFile;
    constructor(templateFile: string, rootDir: string, outputDir: string);
    execute(): Promise<void>;
    private _getWorkerCount;
    private _processPages;
    private _createExitPromise;
    private _createWorker;
    private _onWorkerIdle;
    private _scanForPages;
}
