
import {TemplateEngine} from './TemplateEngine';
import * as EJS from 'ejs';

export class EJSTemplateEngine extends TemplateEngine {
    protected async _execute(template: string, body: string): Promise<string> {
        // EJS.
        console.log('BODY', body);
        return EJS.renderFile('../test/template.ejs', {
            title: 'test',
            content: body
        });
    }
}
