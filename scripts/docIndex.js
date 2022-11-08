import fs from 'fs';
import path from 'path';
import walk from 'walkdir';

const rootPath = path.resolve(process.argv[2]);
const outName = process.argv[3];
const docPath = './src/doc/';
const outputPath = path.join(docPath, `${outName}.ts`);

console.log(`Walking: ${rootPath}...\n`)

const buffer = [];
 
walk.sync(rootPath, function(filePath, stat) {
    const ext = path.extname(filePath);
    const name = path.basename(filePath);
    if (stat.isFile() && ext === '.ts' && name.indexOf('vite') !== 0) {
        buffer.push(filePath);
    }
});

const output = buffer
    .map(filePath => {
        const relPath = path.relative(docPath, filePath);
        return `export * from '${relPath.replace(/\.ts$/, '')}';`
    })
    .join('\n');

fs.writeFileSync(outputPath, output);

console.log(`(${buffer.length}) lines successfully written to ${outputPath}.`)