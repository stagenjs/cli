
import {
    parentPort,
    workerData,
    threadId
} from 'worker_threads'
import * as FileSystem from 'fs';
import * as MarkdownIt from 'markdown-it';
import * as YAML from 'yaml';
import * as Path from 'path';
import * as EJS from 'ejs';
import {IPacket} from './IPacket';
import {WorkerState} from './WorkerState';

let md: MarkdownIt = MarkdownIt({
    html: true,
    typographer: true
});

let currentState: WorkerState = WorkerState.IDLE;

let setState = (state: WorkerState): void => {
    currentState = state;
    parentPort.postMessage({
        code: 'state-update',
        data: currentState
    });
}

let processFile = async (data: Record<any, any>): Promise<void> => {
    setState(WorkerState.PROCESSING);

    let page: string = data.page;
    let context: Record<any, any> = data.context;
    let metadata: Record<any, any> = data.metadata;

    let output: string = await EJS.renderFile(workerData.templateFile, {
        content: await EJS.render(md.render(data.markdown), {
            context,
            metadata,
            config: workerData.config    
        }),
        context,
        metadata,
        config: workerData.config
    });

    let outputFile: string = page.replace(workerData.rootDir, workerData.outputDir).replace(/\.md$/, '.html');
    let dirName: string = Path.dirname(outputFile);
    FileSystem.mkdirSync(dirName, {
        recursive: true
    });

    FileSystem.writeFileSync(outputFile, output);

    setState(WorkerState.IDLE);
}

let parseMetadata = (contents: string): Record<any, any> => {
    let metadata = {};
    if (contents.slice(0, 4) === '---\n') {
        contents = contents.slice(4);
        let header = contents.slice(0, contents.indexOf('---\n'));
        contents = contents.replace(header, '');
        contents = contents.slice(contents.indexOf('\n') + 1);

        metadata = YAML.parse(header);
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
