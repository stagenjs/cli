
import {program} from 'commander';
import * as Path from 'path';
import {Stagen} from '../stagen/Stagen';
import {version} from '../package.json';
import * as YAML from 'yaml';
import * as FileSystem from 'fs';
import * as http from 'http';
import * as Archiver from 'archiver';
import { Socket } from 'dgram';

program.name('stagen');
program.version(version, '-v, --version');

interface ICoreArgs {
    d?: string;
    o?: string;
}

interface IPublishingArgs extends ICoreArgs {
    c: string;
}

interface IPublishingConfig {
    host: string;
    port: number;
    protocol: 'http' | 'https';
    secret: string;
}

program.option('--verbose', 'Enable additional log output');

let _instance: Stagen = null;

let getStagen = (args: ICoreArgs) => {
    if (!_instance) {
        let rootDir: string = null;
        if (args.d) {
            rootDir = Path.resolve(process.cwd(), args.d);
        }
        else {
            rootDir = process.cwd();
        }

        let outputDir: string = null;
        if (args.o) {
            outputDir = Path.resolve(process.cwd(), args.o);
        }
        else {
            outputDir = Path.resolve(rootDir, './public');
        }

        _instance = new Stagen(rootDir, outputDir);
    }

    return _instance;
};

let buildCommand = async (args: ICoreArgs) => {
    let stagen: Stagen = getStagen(args);
    await stagen.execute();
};

let packageCommand = async (outFile: string, args: ICoreArgs) => {
    if (!outFile) {
        let date: Date = new Date();
        outFile = `stagen-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.tar.gz`;
    }

    let stagen: Stagen = getStagen(args);
    let stream: Archiver.Archiver = await stagen.package();
    let fstream: FileSystem.WriteStream = FileSystem.createWriteStream(Path.resolve(process.cwd(), outFile));
    stream.pipe(fstream);

    return new Promise<void>((resolve, reject) => {
        stream.on('close', () => {
            resolve();
        });
        stream.on('error', (error: Archiver.ArchiverError) => {
            console.error(error);
            reject(error);
        });
    });
};

let publishCommand = async (args: IPublishingArgs) => {
    await buildCommand(args);

    let stagen: Stagen = getStagen(args);

    let configPath: string;

    if (args.c) {
        configPath = Path.resolve(process.cwd(), args.c);
    }
    else {
        configPath = Path.resolve(process.cwd(), './publishing.yml');
    }

    let config: IPublishingConfig = YAML.parse(FileSystem.readFileSync(Path.resolve(configPath), {
        encoding: 'utf8'
    }));

    if (!config.host) {
        throw new Error('Missing host in config');
    }

    if (!config.secret) {
        throw new Error('Missing secret in config');
    }

    let stream: Archiver.Archiver = await stagen.package();

    return new Promise<void>((resolve, reject) => {
        let request: http.ClientRequest = http.request({
            method: 'PUT',
            protocol: config.protocol + ':',
            host: config.host,
            port: config.port,
            path: '/_stagen/publish',
            headers: {
                'X-SECRET': config.secret
            }
        }, (response: http.IncomingMessage) => {
            let msg: string = '';

            response.on('data', (chunk: Buffer) => {
                msg += chunk.toString('utf8');
            });

            response.on('close', () => {
                if (response.statusCode >= 200 && response.statusCode < 400) {
                    resolve();
                }
                else {
                    console.error(msg);
                    reject(msg);
                }
            });
        });
    
        stream.pipe(request);
    });
};

program.command('build')
    .description('Builds the site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .action(buildCommand);

program.command('package [outFile]')
    .description('Packages up the current generated site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .action(packageCommand);

program.command('publish')
    .description('Publishes the site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .option('-c', 'Path to publishing.yml. Defaults to <cwd>/publishing.yml')
    .action(publishCommand);

(async () => {
    await program.parseAsync(process.argv);
})();

