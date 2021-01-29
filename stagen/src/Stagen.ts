
import {TemplateProvider} from './TemplateProvider';
import {DefaultTemplateProvider} from './DefaultTemplateProvider';
import {EJSTemplateEngine} from './EJSTemplateEngine';
import {TemplateEngine} from './TemplateEngine';
import * as FileSystem from 'fs';
import * as Path from 'path';
import * as OS from 'os';
import * as WorkerTheads from 'worker_threads';

export class Stagen {
    private _rootDir: string;
    private _outputDir: string;

    public constructor(rootDir: string, outputDir: string) {
        this._rootDir = rootDir;
        this._outputDir = outputDir;
    }

    protected _createTemplateProvider(): TemplateProvider {
        return new DefaultTemplateProvider();
    }

    protected _createTemplateEngine(): TemplateEngine {
        return new EJSTemplateEngine();
    }

    public async execute(): Promise<void> {
        let pages: Array<string> = this._scanForPages(this._rootDir);

        let templateProvider: TemplateProvider = this._createTemplateProvider();
        let template: string = await templateProvider.load();

        await this._processPages(pages, template);
    }

    private async _processPages(pages: Array<string>, template: string): Promise<void> {
        let tEngine: TemplateEngine = this._createTemplateEngine();

        let i: number = 0;
        let cpus: number = OS.cpus().length;

        for (let i: number = 0; i < cpus; i++) {
            let worker: WorkerTheads.Worker = new WorkerTheads.Worker('./MarkdownProcessor.js', {
                // TODO:
            });
        }
        
    }

    private async _processPage(): Promise<void> {

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
            // processFile(dir);
        }

        return output;
    }
}
