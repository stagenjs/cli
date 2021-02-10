
import {ITemplateAPI} from './ITemplateAPI';
import * as Path from 'path';

export class TemplateAPI implements ITemplateAPI {
    private _rootDir: string;
    private _templateRoot: string;

    public constructor(rootDir: string, templateRoot: string) {
        this._rootDir = rootDir;
        this._templateRoot = templateRoot;
    }

    public import(file: string): any {
        return require(Path.resolve(this._templateRoot, 'scripts', file))
    }

    public getTemplateExtensionPath(path: string): string {
        return Path.resolve(this._rootDir, 'template_ext', path);
    }
}
