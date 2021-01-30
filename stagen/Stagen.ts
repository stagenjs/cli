
import * as FileSystem from 'fs';
import * as Path from 'path';
import * as OS from 'os';
import * as WorkerTheads from 'worker_threads';
import {IPacket} from './IPacket';

export class Stagen {
    private _rootDir: string;
    private _outputDir: string;
    private _pages: Array<string>;
    private _templateFile: string;

    public constructor(templateFile: string, rootDir: string, outputDir: string) {
        this._templateFile = templateFile;
        this._rootDir = rootDir;
        this._outputDir = outputDir;

        console.log(this._rootDir, this._outputDir);

        this._pages = null;
    }

    public async execute(): Promise<void> {
        this._pages = this._scanForPages(this._rootDir);

        await this._processPages();
    }

    private _getWorkerCount(): number {
        // TODO: return worker count setting, defaulting to Infinity.
        // Infinity will fall back to OS.cpus().length.
        return Infinity;
    }

    private async _processPages(): Promise<void> {
        let cpus: number = Math.min(this._pages.length, OS.cpus().length, this._getWorkerCount());
        let workerThreads: Record<number, WorkerTheads.Worker> = {};

        let promises: Array<Promise<void>> = [];

        for (let i: number = 0; i < cpus; i++) {
            workerThreads[i] = this._createWorker();
            promises.push(this._createExitPromise(workerThreads[i]));
        }

        await Promise.all(promises);
    }

    private _createExitPromise(worker: WorkerTheads.Worker): Promise<void> {
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

    private _createWorker(): WorkerTheads.Worker {
        let worker: WorkerTheads.Worker = new WorkerTheads.Worker(Path.resolve(__dirname, './MarkdownProcessor.js'), {
            workerData: {
                rootDir: this._rootDir,
                templateFile: this._templateFile,
                outputDir: this._outputDir
            }
        });
        worker.on('message', (packet: IPacket) => {
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

    private _onWorkerIdle(worker: WorkerTheads.Worker): void {
        console.log('ON IDLE');
        if (this._pages.length > 0) {
            let page: string = this._pages.pop();
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
