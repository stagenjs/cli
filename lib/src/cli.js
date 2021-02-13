"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const Path = require("path");
const Stagen_1 = require("../stagen/Stagen");
const package_json_1 = require("../package.json");
commander_1.program.name('stagen');
commander_1.program.version(package_json_1.version, '-v, --version');
commander_1.program.option('--verbose', 'Enable additional log output');
commander_1.program.command('build')
    .description('Builds the site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .action(async (args) => {
    let rootDir = null;
    if (args.d) {
        rootDir = Path.resolve(process.cwd(), args.d);
    }
    else {
        rootDir = process.cwd();
    }
    let outputDir = null;
    if (args.o) {
        outputDir = Path.resolve(process.cwd(), commander_1.program.o);
    }
    else {
        outputDir = Path.resolve(rootDir, './public');
    }
    let stagen = new Stagen_1.Stagen(rootDir, outputDir);
    await stagen.execute();
});
commander_1.program.command('package [outFile]')
    .description('Packages up the current generated site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .action(async (outFile, args) => {
    let rootDir = null;
    if (args.d) {
        rootDir = Path.resolve(process.cwd(), args.d);
    }
    else {
        rootDir = process.cwd();
    }
    let outputDir = null;
    if (args.o) {
        outputDir = Path.resolve(process.cwd(), commander_1.program.o);
    }
    else {
        outputDir = Path.resolve(rootDir, './public');
    }
    let stagen = new Stagen_1.Stagen(rootDir, outputDir);
    await stagen.package(outFile);
});
(async () => {
    await commander_1.program.parseAsync(process.argv);
})();
//# sourceMappingURL=cli.js.map