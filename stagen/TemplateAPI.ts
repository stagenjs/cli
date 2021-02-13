/*
Copyright [2021] [Norman Breau]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
