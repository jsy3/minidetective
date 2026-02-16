/**
 * 추리 문제 목록 (AI 생성 시 API로 대체 가능)
 * 각 문제: situation(상황), clues[3](단서), answer(정답)
 */
export const MYSTERY_PROBLEMS = [
  {
    id: '1',
    situation: '비 오는 날, 한 남자가 우산 없이 건물 안으로 들어왔는데 머리카락은 전혀 젖지 않았어요. 어떻게 된 걸까요?',
    clues: [
      '그는 대머리였어요.',
      '건물 입구에 캐노피가 있어서 비를 맞지 않았어요.',
      '실제로는 실내 연결 통로로 들어온 거예요.',
    ],
    answer: '그 남자는 대머리라서 머리카락이 없었어요. 그래서 “머리카락이 젖지 않았다”는 말이 맞아요.',
  },
  {
    id: '2',
    situation: '한 여성이 식당에서 스테이크를 주문했는데, 한 입 먹고 나서 자리를 박차고 나갔어요. 그런데 불만 제기는 하지 않았어요. 왜일까요?',
    clues: [
      '그녀는 채식주의자였어요.',
      '스테이크가 아니라 다른 메뉴를 잘못 가져온 게 아니에요.',
      '그녀의 목적은 스테이크를 먹는 것이 아니었어요.',
    ],
    answer: '그녀는 스테이크 맛이 어떤지 확인하려고 한 입만 먹은 음식 평론가였어요. 맛을 확인한 뒤 다음 일정을 위해 자리를 떠난 거예요.',
  },
  {
    id: '3',
    situation: '어두운 방에 촛불 하나만 켜져 있는데, 누군가 촛불을 끄지 않았는데도 불이 꺼졌어요. 왜 그럴까요?',
    clues: [
      '바람이 불어서가 아니에요.',
      '촛불은 다 타서 자연스럽게 꺼졌어요.',
      '방에 있던 사람이 입으로 불었어요.',
    ],
    answer: '촛불이 다 타서 녹은 밀납이 바닥에 흘러 내리며 심지가 더 이상 타지 못해 자연스럽게 꺼진 거예요.',
  },
];

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
