import fs from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcPath = join(root, 'src', 'data', 'mysteryProblems.js');
const txt = fs.readFileSync(srcPath, 'utf8');
const marker = 'const RAW_MYSTERY_PROBLEMS = ';
const start = txt.indexOf(marker);
if (start === -1) throw new Error('RAW_MYSTERY_PROBLEMS not found');
let i = start + marker.length;
let depth = 0;
let begin = -1;
for (; i < txt.length; i++) {
  const c = txt[i];
  if (c === '[') {
    if (depth === 0) begin = i;
    depth++;
  } else if (c === ']') {
    depth--;
    if (depth === 0 && begin !== -1) {
      const code = txt.slice(begin, i + 1);
      const arr = vm.runInNewContext(code, Object.create(null));
      const slim = arr.map(({ situation, clues, answer }) => ({
        situation,
        clues,
        answer,
      }));
      fs.writeFileSync(join(root, 'src', 'data', 'mysteryBase50.json'), JSON.stringify(slim, null, 0), 'utf8');
      console.log('wrote mysteryBase50.json', slim.length);
      process.exit(0);
    }
  }
}
throw new Error('array not closed');
