
import {ITemplateAPI} from './ITemplateAPI';
import * as Path from 'path';

export class TemplateAPI implements ITemplateAPI {
    private _rootDir: string;

    public constructor(rootDir: string) {
        this._rootDir = rootDir;
    }

    public import(file: string): any {
        return require(Path.resolve(this._rootDir, 'template/scripts', file))
    }
}
