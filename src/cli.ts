
import {program} from 'commander';
import * as Path from 'path';
import {Stagen} from '../stagen/Stagen';
import {version} from '../package.json';

program.name('stagen');
program.version(version, '-v, --version');

program.option('--verbose', 'Enable additional log output');
program.option('-d <directory>', 'Input directory. Defaults to cwd');
program.option('-o <directory>', 'Output directory. Defaults to ./public');
// program.option('-i', 'Inits directory for stagen.');

program.parse(process.argv);

(async () => {
    let rootDir: string = null;
    if (program.i) {
        rootDir = Path.resolve(process.cwd(), program.i);
    }
    else {
        rootDir = process.cwd();
    }

    let outputDir: string = null;
    if (program.o) {
        outputDir = Path.resolve(process.cwd(), program.o);
    }
    else {
        outputDir = Path.resolve(rootDir, './public');
    }

    let stagen: Stagen = new Stagen(rootDir, outputDir);

    await stagen.execute();
})();
