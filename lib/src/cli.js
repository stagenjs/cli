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
commander_1.program.option('-a <assetsDirectory>', 'The assets directory. Defaults to ./template/assets');
commander_1.program.option('-o <directory>', 'Output directory. Defaults to ./public');
commander_1.program.option('-c <configFile>', 'Path to config file. Defaults to ./stagen.yml');
commander_1.program.option('-s <styleEntryFile>', 'Path to the entry Sass file. Defaults to ./template/style/index.scss');
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
    let configFile = null;
    if (commander_1.program.c) {
        configFile = Path.resolve(process.cwd(), commander_1.program.c);
    }
    else {
        configFile = Path.resolve(process.cwd(), './stagen.yml');
    }
    let assetsDir = null;
    if (commander_1.program.a) {
        assetsDir = Path.resolve(process.cwd(), commander_1.program.a);
    }
    else {
        assetsDir = Path.resolve(process.cwd(), './template/assets');
    }
    let styleEntry = null;
    if (commander_1.program.s) {
        styleEntry = Path.resolve(process.cwd(), commander_1.program.s);
    }
    else {
        styleEntry = Path.resolve(process.cwd(), './template/style/index.scss');
    }
    let stagen = new Stagen_1.Stagen(templateFile, entryPath, outputDir, configFile, assetsDir, styleEntry);
    await stagen.execute();
})();
//# sourceMappingURL=cli.js.map