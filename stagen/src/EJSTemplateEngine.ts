
import {TemplateEngine} from './TemplateEngine';
import * as EJS from 'ejs';

export class EJSTemplateEngine extends TemplateEngine {
    protected async _execute(template: string, body: string): Promise<string> {
        // EJS.
        return '';
    }
}
