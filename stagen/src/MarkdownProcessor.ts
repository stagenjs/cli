
import {
    parentPort,
    workerData
} from 'worker_threads'
import * as FileSystem from 'fs';
import * as MarkdownIt from 'markdown-it';
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
    let content: string = md.render(FileSystem.readFileSync(page, {
        encoding: 'utf8'
    }));

    parentPort.postMessage({
        code: 'processed',
        data: {
            page,
            content
        }
    });

    currentState = 'idle';
    sendCurrentState();
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
