
export abstract class TemplateEngine {

    protected abstract _execute(template: string, body: string): Promise<string>;

    public async execute(template: string, body: string): Promise<string> {
        return this._execute(template, body);
    }
}