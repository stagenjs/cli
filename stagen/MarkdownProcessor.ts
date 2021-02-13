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

import {
    parentPort,
    workerData
} from 'worker_threads'
import * as FileSystem from 'fs';
import * as YAML from 'yaml';
import * as Path from 'path';
import * as EJS from 'ejs';
import {IPacket} from './IPacket';
import {WorkerState} from './WorkerState';
import * as Showdown from 'showdown';
import {TemplateAPI} from './TemplateAPI';
import { ITemplateAPI } from './ITemplateAPI';

let mdConverter: Showdown.Converter = new Showdown.Converter({
    tables: true
});

let currentState: WorkerState = WorkerState.IDLE;

let tapi: ITemplateAPI = new TemplateAPI(workerData.rootDir, workerData.templateRoot);

let setState = (state: WorkerState): void => {
    currentState = state;
    parentPort.postMessage({
        code: 'state-update',
        data: currentState
    });
}

let renderMarkdown = (content: string): string => {
    return mdConverter.makeHtml(content);
}

let processFile = async (data: Record<any, any>): Promise<void> => {
    setState(WorkerState.PROCESSING);

    let page: string = data.page;
    let context: Record<any, any> = data.context;
    let metadata: Record<any, any> = data.metadata;

    let output: string = await EJS.renderFile(workerData.templateFile, {
        content: renderMarkdown(await EJS.render(data.markdown, {
            context,
            metadata,
            config: workerData.config,
            stagen: tapi 
        })),
        context,
        metadata,
        config: workerData.config,
        stagen: tapi
    });

    let outputFile: string = page.replace(workerData.srcDir, workerData.outputDir).replace(/\.md$/, '.html');
    let dirName: string = Path.dirname(outputFile);
    FileSystem.mkdirSync(dirName, {
        recursive: true
    });

    FileSystem.writeFileSync(outputFile, output);

    setState(WorkerState.IDLE);
}

let parseMetadata = (contents: string): Record<any, any> => {
    let metadata: Record<any, any> = {};
    if (contents.slice(0, 4) === '---\n') {
        contents = contents.slice(4);
        let header = contents.slice(0, contents.indexOf('---\n'));
        contents = contents.replace(header, '');
        contents = contents.slice(contents.indexOf('\n') + 1);

        metadata = YAML.parse(header);
    }

    if (metadata.date) {
        let parts = metadata.date.split('/');
        metadata.date = new Date(parts[0], parts[1], parts[2]);
    }

    return {
        contents,
        metadata
    };
}

let processMetadata = (page: string): void => {
    setState(WorkerState.PROCESSING);

    let content: string = FileSystem.readFileSync(page, {
        encoding: 'utf8'
    });

    let result: Record<any, any> = parseMetadata(content);

    parentPort.postMessage({
        code: 'metadata-response',
        data: {
            page: page,
            contents: result.contents,
            metadata: result.metadata
        }
    });

    setState(WorkerState.IDLE);
}

parentPort.on('message', (packet: IPacket) => {
    switch (packet.code) {
        case 'process-markdown':
            processFile(packet.data);
            break;
        case 'process-metadata':
            processMetadata(packet.data);
            break;
        case 'currentState':
            setState(currentState);
            break;
        case 'exit': process.exit(0);
        default: throw new Error('Unknown action code: ' + packet.code);
    }
});

setState(currentState);
