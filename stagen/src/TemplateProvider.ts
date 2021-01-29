
export abstract class TemplateProvider {
    protected abstract _load(): Promise<string>;
    
    public async load(): Promise<string> {
        return this._load();
    }
}
