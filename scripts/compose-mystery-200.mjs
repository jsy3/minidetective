import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { EXTRA_SEEDS } from './mystery-extra-seeds.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'src', 'data');

const base = JSON.parse(fs.readFileSync(join(dataDir, 'mysteryBase50.json'), 'utf8'));

const prefixes = ['', '소문으로, ', '어느 마을에서 ', '뉴스 한 줄. ', '친구가 들려준 '];

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/** EXTRA_SEEDS 길이와 서로소인 걸음 — 연속 문항에 같은 시드가 잘 안 붙게 분산 */
function spreadStep(seedCount) {
  for (let s = 17; s < seedCount * 2; s++) {
    if (gcd(s, seedCount) === 1) return s;
  }
  return 1;
}

/** 베이스 50: 단서 1개로 줄이지 않음(너무 빡센 변형 방지). 가끔만 2개만 공개 */
function varyBaseClues(problems) {
  return problems.map((p, i) => {
    const c = [...p.clues];
    if (c.length <= 2) return { ...p, clues: c };
    if (i % 7 === 0) return { ...p, clues: c.slice(0, 2) };
    return { ...p, clues: c };
  });
}

function buildExtra150() {
  const L = EXTRA_SEEDS.length;
  const step = spreadStep(L);
  return Array.from({ length: 150 }, (_, i) => {
    const p = EXTRA_SEEDS[(i * step + 11) % L];
    const nClues = Math.min(p.clues.length, 2 + (i % 2));
    const clues = p.clues.slice(0, Math.max(2, Math.min(nClues, p.clues.length)));
    const prefix = prefixes[i % prefixes.length];
    return {
      situation: prefix + p.situation,
      clues: clues.length > 0 ? clues : [...p.clues],
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
