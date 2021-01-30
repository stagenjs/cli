
import {program} from 'commander';
import * as Path from 'path';
import {Stagen} from '../stagen/Stagen';
import {version} from '../package.json';

program.name('stagen');
program.version(version, '-v, --version');

program.option('--verbose', 'Enable additional log output');
program.option('-i <directory>', 'Input directory. Defaults to cwd');
program.option('-t <templateFile>', 'A template EJS. Defaults to ./template/index.ejs');
program.option('-a <assetsDirectory>', 'The assets directory. Defaults to ./template/assets');
program.option('-o <directory>', 'Output directory. Defaults to ./public');
program.option('-c <configFile>', 'Path to config file. Defaults to ./stagen.yml');
program.option('-s <styleEntryFile>', 'Path to the entry Sass file. Defaults to ./template/style/index.scss');

program.parse(process.argv);

(async () => {
    let entryPath: string = null;
    if (program.i) {
        entryPath = Path.resolve(process.cwd(), program.i);
    }
    else {
        entryPath = process.cwd();
    }

    let templateFile: string = null;
    if (program.t) {
        templateFile = Path.resolve(process.cwd(), program.t);
    }
    else {
        templateFile = Path.resolve(process.cwd(), './template/index.ejs');
    }

    let outputDir: string = null;
    if (program.o) {
        outputDir = Path.resolve(process.cwd(), program.o);
    }
    else {
        outputDir = Path.resolve(process.cwd(), './public');
    }

    let configFile: string = null;
    if (program.c) {
        configFile = Path.resolve(process.cwd(), program.c);
    }
    else {
        configFile = Path.resolve(process.cwd(), './stagen.yml');
    }

    let assetsDir: string = null;
    if (program.a) {
        assetsDir = Path.resolve(process.cwd(), program.a);
    }
    else {
        assetsDir = Path.resolve(process.cwd(), './template/assets');
    }

    let styleEntry: string = null;
    if (program.s) {
        styleEntry = Path.resolve(process.cwd(), program.s);
    }
    else {
        styleEntry = Path.resolve(process.cwd(), './template/style/index.scss');
    }

    let stagen: Stagen = new Stagen(templateFile, entryPath, outputDir, configFile, assetsDir, styleEntry);

    await stagen.execute();
})();
