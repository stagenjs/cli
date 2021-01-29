let ejs = require('ejs');
let fs = require('fs');

let html = ejs.render(fs.readFileSync('./template.ejs', 'utf8'), {
    title: 'test'
}, {
    filename: 'ejs'
});

console.log(html);
fs.writeFileSync('./output.html', html);
