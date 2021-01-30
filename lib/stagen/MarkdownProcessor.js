"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const FileSystem = require("fs");
const MarkdownIt = require("markdown-it");
const YAML = require("yaml");
const Path = require("path");
const EJS = require("ejs");
let md = MarkdownIt();
console.log('WORKER DATA', worker_threads_1.workerData);
let currentState = 'idle';
let sendCurrentState = () => {
    worker_threads_1.parentPort.postMessage({
        code: 'state',
        data: currentState
    });
};
let processFile = async (page) => {
    currentState = 'processing';
    console.log('PROCESSING', page);
    let content = FileSystem.readFileSync(page, {
        encoding: 'utf8'
    });
    let markdown = parseMetadata(content);
    let body = md.render(markdown.content, markdown.metadata);
    let output = await EJS.renderFile(worker_threads_1.workerData.templateFile, {
        ...markdown.metadata,
        content: body
    });
    let outputFile = page.replace(worker_threads_1.workerData.rootDir, worker_threads_1.workerData.outputDir).replace(/\.md$/, '.html');
    let dirName = Path.dirname(outputFile);
    FileSystem.mkdirSync(dirName, {
        recursive: true
    });
    FileSystem.writeFileSync(outputFile, output);
    currentState = 'idle';
    sendCurrentState();
};
let parseMetadata = (contents) => {
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
    };
};
worker_threads_1.parentPort.on('message', (packet) => {
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
//# sourceMappingURL=MarkdownProcessor.js.map