
import {arguments, program} from 'commander';
import * as Path from 'path';
import {Stagen} from '../stagen/Stagen';
import {version} from '../package.json';

program.name('stagen');
program.version(version, '-v, --version');

interface IBuildArgs{
    d?: string;
    o?: string;
}

interface IPackageArgs {
    d?: string;
    o?: string;
}

program.option('--verbose', 'Enable additional log output');
// program.option('-d <directory>', 'Input directory. Defaults to cwd');
// program.option('-o <directory>', 'Output directory. Defaults to ./public');
// program.option('-i', 'Inits directory for stagen.');

program.command('build')
    .description('Builds the site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .action(async (args: IBuildArgs) => {
        let rootDir: string = null;
        if (args.d) {
            rootDir = Path.resolve(process.cwd(), args.d);
        }
        else {
            rootDir = process.cwd();
        }

        let outputDir: string = null;
        if (args.o) {
            outputDir = Path.resolve(process.cwd(), program.o);
        }
        else {
            outputDir = Path.resolve(rootDir, './public');
        }

        let stagen: Stagen = new Stagen(rootDir, outputDir);

        await stagen.execute();
    }
);

program.command('package [outFile]')
    .description('Packages up the current generated site')
    .option('-d <directory>', 'Input directory. Defaults to cwd')
    .option('-o <directory>', 'Output directory. Defaults to ./public')
    .action(async (outFile: string, args: IPackageArgs) => {
        let rootDir: string = null;
        if (args.d) {
            rootDir = Path.resolve(process.cwd(), args.d);
        }
        else {
            rootDir = process.cwd();
        }

        let outputDir: string = null;
        if (args.o) {
            outputDir = Path.resolve(process.cwd(), program.o);
        }
        else {
            outputDir = Path.resolve(rootDir, './public');
        }

        let stagen: Stagen = new Stagen(rootDir, outputDir);
        await stagen.package(outFile);
    }
);

(async () => {
    await program.parseAsync(process.argv);
})();

