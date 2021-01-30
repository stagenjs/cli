"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const FileSystem = require("fs");
const MarkdownIt = require("markdown-it");
const YAML = require("yaml");
const Path = require("path");
const EJS = require("ejs");
const WorkerState_1 = require("./WorkerState");
let md = MarkdownIt();
let currentState = WorkerState_1.WorkerState.IDLE;
let setState = (state) => {
    currentState = state;
    worker_threads_1.parentPort.postMessage({
        code: 'state-update',
        data: currentState
    });
};
let processFile = async (data) => {
    setState(WorkerState_1.WorkerState.PROCESSING);
    let page = data.page;
    let context = data.context;
    let metadata = data.metadata;
    let output = await EJS.renderFile(worker_threads_1.workerData.templateFile, {
        content: md.render(data.markdown),
        context,
        metadata
    });
    let outputFile = page.replace(worker_threads_1.workerData.rootDir, worker_threads_1.workerData.outputDir).replace(/\.md$/, '.html');
    let dirName = Path.dirname(outputFile);
    FileSystem.mkdirSync(dirName, {
        recursive: true
    });
    FileSystem.writeFileSync(outputFile, output);
    setState(WorkerState_1.WorkerState.IDLE);
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
        contents,
        metadata
    };
};
let processMetadata = (page) => {
    setState(WorkerState_1.WorkerState.PROCESSING);
    let content = FileSystem.readFileSync(page, {
        encoding: 'utf8'
    });
    let result = parseMetadata(content);
    worker_threads_1.parentPort.postMessage({
        code: 'metadata-response',
        data: {
            page: page,
            contents: result.contents,
            metadata: result.metadata
        }
    });
    setState(WorkerState_1.WorkerState.IDLE);
};
worker_threads_1.parentPort.on('message', (packet) => {
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
//# sourceMappingURL=MarkdownProcessor.js.map