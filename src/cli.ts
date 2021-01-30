
import {program} from 'commander';
import * as Path from 'path';
import {Stagen} from '../stagen/Stagen';
import {version} from '../package.json';

program.name('stagen');

// const pkg: any = require('../package.json');
program.version(version, '-v, --version');

program.option('--verbose', 'Enable additional log output');
program.option('-i <directory>', 'Input directory. Defaults to cwd');
program.option('-t <templateFile>', 'A template EJS. Defaults to ./template/index.ejs');
program.option('-o <directory>', 'Output directory. Defaults to ./public');

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

    let stagen: Stagen = new Stagen(templateFile, entryPath, outputDir);

    await stagen.execute();
})();
