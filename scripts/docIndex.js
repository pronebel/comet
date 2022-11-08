import fs from 'fs';
import path from 'path';
import walk from 'walkdir';

const rootPath = path.resolve(process.argv[2]);
const outName = process.argv[3];
const docPath = './src/docs/';
const outputPath = path.join(docPath, `${outName}.ts`);

if (!fs.existsSync(docPath)) {
    fs.mkdirSync(docPath, { recursive: true });
}

console.log(`Walking: ${rootPath}...\n`)

const buffer = [];
 
walk.sync(rootPath, function(filePath, stat) {
    const ext = path.extname(filePath);
    const name = path.basename(filePath);
    if (
        stat.isFile() && 
        ext === '.ts' && 
        filePath.indexOf('.d.ts') === -1 &&
        name.indexOf('vite') !== 0
    ) {
        console.log(filePath)
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

console.log(`\n(${buffer.length}) lines successfully written to ${outputPath}`)