
import {TemplateProvider} from './TemplateProvider';
import {DefaultTemplateProvider} from './DefaultTemplateProvider';
import {EJSTemplateEngine} from './EJSTemplateEngine';
import {TemplateEngine} from './TemplateEngine';
import * as FileSystem from 'fs';
import * as Path from 'path';
import * as OS from 'os';
import * as WorkerTheads from 'worker_threads';
import {IPacket} from './IPacket';

export class Stagen {
    private _rootDir: string;
    private _outputDir: string;
    private _pages: Array<string>;
    private _engine: TemplateEngine;
    private _template: string;

    public constructor(rootDir: string, outputDir: string) {
        this._rootDir = rootDir;
        this._outputDir = outputDir;

        console.log(this._rootDir, this._outputDir);

        this._pages = null;
        this._engine = this._createTemplateEngine();
    }

    protected _createTemplateProvider(): TemplateProvider {
        return new DefaultTemplateProvider();
    }

    protected _createTemplateEngine(): TemplateEngine {
        return new EJSTemplateEngine();
    }

    public async execute(): Promise<void> {
        this._pages = this._scanForPages(this._rootDir);

        let templateProvider: TemplateProvider = this._createTemplateProvider();
        this._template = await templateProvider.load();

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
            workerData: {}
        });
        worker.on('message', (packet: IPacket) => {
            switch (packet.code) {
                case 'state':
                    if (packet.data === 'idle') {
                        this._onWorkerIdle(worker);
                    }
                    break;
                case 'processed':
                    this._onWorkerProcessed(packet.data);
            }
        });
        return worker;
    }

    private async _onWorkerProcessed(data: any): Promise<void> {
        console.log('MD CONTENT', data);
        let output: string = await this._engine.execute(this._template, data.content);
        let outputDir: string = data.page.replace(this._rootDir, this._outputDir).replace(/\.md$/, '.html');
        let dirName: string = Path.dirname(outputDir);
        FileSystem.mkdirSync(dirName, {
            recursive: true
        });
        FileSystem.writeFileSync(outputDir, output);
        // console.log('OUTPUT', output);
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

    // private _isTSEnvironment(): boolean {
    //     return /\.ts$/.test(__filename);
    // }

    // private async _processPage(): Promise<void> {

    // }

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
            // processFile(dir);
        }

        return output;
    }
}
