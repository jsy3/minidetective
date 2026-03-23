import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { EXTRA_SEEDS } from './mystery-extra-seeds.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'src', 'data');

const base = JSON.parse(fs.readFileSync(join(dataDir, 'mysteryBase50.json'), 'utf8'));

const prefixes = ['', '소문으로, ', '어느 마을에서 ', '뉴스 한 줄. ', '친구가 들려준 '];

function varyBaseClues(problems) {
  return problems.map((p, i) => {
    const c = [...p.clues];
    if (i % 13 === 0 && c.length >= 1) return { ...p, clues: [c[0]] };
    if (i % 9 === 0 && c.length >= 2) return { ...p, clues: c.slice(0, 2) };
    return { ...p, clues: c };
  });
}

function buildExtra150() {
  const triple = [...EXTRA_SEEDS, ...EXTRA_SEEDS, ...EXTRA_SEEDS];
  const slice150 = triple.slice(0, 150);
  return slice150.map((p, i) => {
    const nClues = (i % 3) + 1;
    const clues = p.clues.slice(0, Math.min(nClues, p.clues.length));
    const prefix = prefixes[i % prefixes.length];
    return {
      situation: prefix + p.situation,
      clues: clues.length > 0 ? clues : [p.clues[0]],
      answer: p.answer,
    };
  });
}

const baseVaried = varyBaseClues(base);
const extra = buildExtra150();
const merged = [...baseVaried, ...extra].slice(0, 200);

const out = merged.map((p, index) => ({
  id: String(index + 1),
  situation: p.situation,
  clues: [...p.clues],
  answer: p.answer,
}));

fs.writeFileSync(join(dataDir, 'mysteryProblemsData.json'), JSON.stringify(out), 'utf8');
console.log('wrote mysteryProblemsData.json', out.length, 'problems');
