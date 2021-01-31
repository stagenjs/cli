import { ITemplateAPI } from './ITemplateAPI';
export declare class TemplateAPI implements ITemplateAPI {
    private _rootDir;
    constructor(rootDir: string);
    import(file: string): any;
}
