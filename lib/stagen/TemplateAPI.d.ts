import { ITemplateAPI } from './ITemplateAPI';
export declare class TemplateAPI implements ITemplateAPI {
    private _rootDir;
    private _templateRoot;
    constructor(rootDir: string, templateRoot: string);
    import(file: string): any;
    getTemplateExtensionPath(path: string): string;
}
