
import {program} from 'commander';
import * as Path from 'path';
import {Stagen} from './Stagen';

program.name('stagen');

const pkg: any = require('../package.json');
program.version(pkg.version, '-v, --version');

program.option('--verbose', 'Enable additional log output');
program.option('-i <directory>', 'Input directory. Defaults to cwd');
program.option('-o <directory>', 'Output directory. Defaults to ./public');

program.parse(process.argv);
// console.log('PROGRAM', program);

(async () => {
    let entryPath: string = null;
    if (program.i) {
        entryPath = Path.resolve(process.cwd(), program.i);
    }
    else {
        entryPath = process.cwd();
    }

    let outputDir: string = null;
    if (program.o) {
        outputDir = Path.resolve(process.cwd(), program.o);
    }
    else {
        outputDir = Path.resolve(process.cwd(), './public');
    }

    let stagen: Stagen = new Stagen(entryPath, outputDir);

    await stagen.execute();
    // console.log('ENTRY PATH', entryPath);
})();
