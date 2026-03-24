/**
 * 추리 문제 목록 (바다거북스프형). 단서는 보통 2~3개(compose 결과 기준).
 * 원본 데이터: mysteryProblemsData.json (200문항)
 * 재생성: node scripts/compose-mystery-200.mjs (베이스는 mysteryBase50.json + mystery-extra-seeds.mjs)
 */
import mysteryProblemsData from './mysteryProblemsData.json';

function buildMysteryProblems(problems) {
  return problems
    .filter((p) => Array.isArray(p.clues) && p.clues.length >= 1 && p.situation && p.answer)
    .slice(0, 200)
    .map((p, index) => ({
      id: String(index + 1),
      situation: p.situation,
      answer: p.answer,
      clues: [...p.clues],
    }));
}

export const MYSTERY_PROBLEMS = buildMysteryProblems(mysteryProblemsData);

export function getProblemByIndex(index) {
  return MYSTERY_PROBLEMS[index % MYSTERY_PROBLEMS.length] ?? MYSTERY_PROBLEMS[0];
}

export function getTotalCount() {
  return MYSTERY_PROBLEMS.length;
}

/** id 기준 랜덤 문제 반환 */
export function getRandomProblem() {
  const idx = Math.floor(Math.random() * MYSTERY_PROBLEMS.length);
  return MYSTERY_PROBLEMS[idx];
}
