"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const Path = require("path");
const Stagen_1 = require("../stagen/Stagen");
const package_json_1 = require("../package.json");
commander_1.program.name('stagen');
commander_1.program.version(package_json_1.version, '-v, --version');
commander_1.program.option('--verbose', 'Enable additional log output');
commander_1.program.option('-i <directory>', 'Input directory. Defaults to cwd');
commander_1.program.option('-t <templateFile>', 'A template EJS. Defaults to ./template/index.ejs');
commander_1.program.option('-o <directory>', 'Output directory. Defaults to ./public');
commander_1.program.parse(process.argv);
(async () => {
    let entryPath = null;
    if (commander_1.program.i) {
        entryPath = Path.resolve(process.cwd(), commander_1.program.i);
    }
    else {
        entryPath = process.cwd();
    }
    let templateFile = null;
    if (commander_1.program.t) {
        templateFile = Path.resolve(process.cwd(), commander_1.program.t);
    }
    else {
        templateFile = Path.resolve(process.cwd(), './template/index.ejs');
    }
    let outputDir = null;
    if (commander_1.program.o) {
        outputDir = Path.resolve(process.cwd(), commander_1.program.o);
    }
    else {
        outputDir = Path.resolve(process.cwd(), './public');
    }
    let stagen = new Stagen_1.Stagen(templateFile, entryPath, outputDir);
    await stagen.execute();
})();
//# sourceMappingURL=cli.js.map