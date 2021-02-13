"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const Path = require("path");
const Stagen_1 = require("../stagen/Stagen");
const package_json_1 = require("../package.json");
const YAML = require("yaml");
const FileSystem = require("fs");
const http = require("http");
commander_1.program.name('stagen');
commander_1.program.version(package_json_1.version, '-v, --version');
commander_1.program.option('--verbose', 'Enable additional log output');
let _instance = null;
let getStagen = (args) => {
    if (!_instance) {
        let rootDir = null;
        if (args.d) {
            rootDir = Path.resolve(process.cwd(), args.d);
        }
        else {
            rootDir = process.cwd();
        }
        let outputDir = null;
        if (args.o) {
            outputDir = Path.resolve(process.cwd(), args.o);
        }
        else {
            outputDir = Path.resolve(rootDir, './public');
        }
        _instance = new Stagen_1.Stagen(rootDir, outputDir);
    }
    return _instance;
};
let buildCommand = async (args) => {
    let stagen = getStagen(args);
    await stagen.execute();
};
let packageCommand = async (outFile, args) => {
    if (!outFile) {
        let date = new Date();
        outFile = `stagen-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.tar.gz`;
    }
    let stagen = getStagen(args);
    let stream = await stagen.package();
    let fstream = FileSystem.createWriteStream(Path.resolve(process.cwd(), outFile));
    stream.pipe(fstream);
    return new Promise((resolve, reject) => {
        stream.on('close', () => {
            resolve();
        });
        stream.on('error', (error) => {
            console.error(error);
            reject(error);
        });
    });
};
let publishCommand = async (args) => {
    await buildCommand(args);
    let stagen = getStagen(args);
    let configPath;
    if (args.c) {
        configPath = Path.resolve(process.cwd(), args.c);
    }
    else {
        configPath = Path.resolve(process.cwd(), './publishing.yml');
    }
    let config = YAML.parse(FileSystem.readFileSync(Path.resolve(configPath), {
        encoding: 'utf8'
    }));
    if (!config.host) {
        throw new Error('Missing host in config');
    }
    if (!config.secret) {
        throw new Error('Missing secret in config');
    }
    let stream = await stagen.package();
    return new Promise((resolve, reject) => {
        let request = http.request({
            method: 'PUT',
            protocol: config.protocol + ':',
            host: config.host,
            port: config.port,
            path: '/_stagen/publish',
            headers: {
                'X-SECRET': config.secret
            }
        }, (response) => {
            let msg = '';
            response.on('data', (chunk) => {
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
commander_1.program.command('build')
    .description('Builds the site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .action(buildCommand);
commander_1.program.command('package [outFile]')
    .description('Packages up the current generated site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .action(packageCommand);
commander_1.program.command('publish')
    .description('Publishes the site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .option('-c', 'Path to publishing.yml. Defaults to <cwd>/publishing.yml')
    .action(publishCommand);
(async () => {
    await commander_1.program.parseAsync(process.argv);
})();
//# sourceMappingURL=cli.js.map