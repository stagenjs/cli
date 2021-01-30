
import {
    parentPort,
    workerData
} from 'worker_threads'
import * as FileSystem from 'fs';
import * as MarkdownIt from 'markdown-it';
import * as YAML from 'yaml';
import * as Path from 'path';
import * as EJS from 'ejs';
import {IPacket} from './IPacket';

let md: MarkdownIt = MarkdownIt();

console.log('WORKER DATA', workerData);

let currentState: string = 'idle';

let sendCurrentState = () => {
    parentPort.postMessage({
        code: 'state',
        data: currentState
    });
};

let processFile = async (page: string): Promise<void> => {
    currentState = 'processing';

    console.log('PROCESSING', page);
    let content: string = FileSystem.readFileSync(page, {
        encoding: 'utf8'
    });

    let markdown: Record<any, any> = parseMetadata(content);
    let body: string = md.render(markdown.content, markdown.metadata);

    let output: string = await EJS.renderFile(workerData.templateFile, {
        ...markdown.metadata,
        content: body
    });

    let outputFile: string = page.replace(workerData.rootDir, workerData.outputDir).replace(/\.md$/, '.html');
    let dirName: string = Path.dirname(outputFile);
    FileSystem.mkdirSync(dirName, {
        recursive: true
    });

    FileSystem.writeFileSync(outputFile, output);

    currentState = 'idle';
    sendCurrentState();
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
        content: contents,
        metadata
    }
}

parentPort.on('message', (packet: IPacket) => {
    switch (packet.code) {
        case 'process':
            processFile(packet.data);
            break;
        case 'currentState':
            sendCurrentState();
            break;
        case 'exit': process.exit(0);
    }
});

sendCurrentState();
