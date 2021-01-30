
const Path = require('path');
const FileSystem = require('fs');
const MarkdownIt = require('markdown-it');
const YAML = require('yaml');

let cwd = process.cwd();
let dirs = FileSystem.readdirSync(cwd);

let outDir = Path.resolve(cwd, '../public');

let md = new MarkdownIt();

const scanDir = (dir) => {
    let fstat = FileSystem.statSync(dir);
    if (fstat.isDirectory()) {
        let dirs = FileSystem.readdirSync(dir);
        for (let i = 0; i < dirs.length; i++) {
            scanDir(Path.resolve(dir, dirs[i]));
        }
    }
    else if (fstat.isFile()) {
        processFile(dir);
    }
};

const processFile = (file) => {
    let contents = FileSystem.readFileSync(file, 'utf8');

    // parse header
    let metadata = {};
    if (contents.slice(0, 4) === '---\n') {
        contents = contents.slice(4);
        let header = contents.slice(0, contents.indexOf('---\n'));
        contents = contents.replace(header, '');
        contents = contents.slice(contents.indexOf('\n') + 1);

        metadata = YAML.parse(header);
    }

    let result = md.render(contents, metadata);
    
    let outPath = file.replace(/.md$/, '.html').replace(cwd + '/', '');
    let uri = Path.parse(outPath);
    FileSystem.mkdirSync(Path.resolve(outDir, uri.dir), {
        recursive: true
    });

    FileSystem.writeFileSync(Path.resolve(outDir, outPath), result);
}

for (let i = 0; i < dirs.length; i++) {
    let dir = Path.resolve(cwd, dirs[i]);
    scanDir(dir);
}
