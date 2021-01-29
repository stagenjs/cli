
import {TemplateProvider} from './TemplateProvider';
import * as FileSystem from 'fs';
import * as Utils from 'util';
import * as Path from 'path';

export class DefaultTemplateProvider extends TemplateProvider {
    protected async _load(): Promise<string> {
        return Utils.promisify(FileSystem.readFile)(Path.resolve(__dirname, './template/template.ejs'), 'utf8');
    }
}
