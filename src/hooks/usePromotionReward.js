import { grantPromotionReward } from '@apps-in-toss/web-framework';
import { useCallback, useState } from 'react';

/**
 * 비게임 프로모션(토스 포인트) — 서버 없이 SDK만으로 지급
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EB%B9%84%EA%B2%8C%EC%9E%84/promotion.html
 * WebView / RN SDK 2.0.8+, 토스앱 5.232.0+ 필요
 */
const PROMOTION_CODE = '01KHK7GMRDY7A4BVVP1HRN4XY8';
const MIN_REWARD_AMOUNT = 1;
const MAX_REWARD_AMOUNT = 5;

/** @typedef {{ type: 'miss' }} MissOutcome */
/** @typedef {{ type: 'granted', amount: number }} GrantedOutcome */

/** 한국 시간(Asia/Seoul) 기준 일요일 00:00~23:59 */
export function isPromotionSundayKST(date = new Date()) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    weekday: 'long',
  }).format(date);
  return weekday === 'Sunday';
}

/**
 * 광고·정답 플로우 확률 (평일·토·월~토):
 * 꽝 65%, 1원 33.25%, 2원 1%, 3원 0.5%, 4원 0.15%, 5원 0.1%
 * (3원 0.5%로 줄인 비중 0.2%p는 1원에 반영) 기대값 ≈ 0.379원/회
 *
 * 일요일(한국 시간): 꽝 35%, 1원 63.25%, 2~5원 구간 동일
 *   → E[원] = 0.6325 + 0.02 + 0.015 + 0.006 + 0.005 = 0.6785원/회 (≈ 평일 대비 1.79배)
 *
 * `r = Math.random() * 100` ∈ [0, 100) 균등분포, 아래는 누적 상한(백분율).
 * 평일: [0,65)→miss, [65,98.25)→1, …
 * 일요: [0,35)→miss, [35,98.25)→1, …
 * @returns {MissOutcome | GrantedOutcome}
 */
export function pickPromotionOutcome() {
  const r = Math.random() * 100;
  const sunday = isPromotionSundayKST();
  const missThreshold = sunday ? 35 : 65;
  if (r < missThreshold) {
    return { type: 'miss' };
  }
  if (r < 98.25) {
    return { type: 'granted', amount: 1 };
  }
  if (r < 99.25) {
    return { type: 'granted', amount: 2 };
  }
  if (r < 99.75) {
    return { type: 'granted', amount: 3 };
  }
  if (r < 99.9) {
    return { type: 'granted', amount: 4 };
  }
  return { type: 'granted', amount: 5 };
}

function isValidRewardAmount(amount) {
  return Number.isInteger(amount) && amount >= MIN_REWARD_AMOUNT && amount <= MAX_REWARD_AMOUNT;
}

export function usePromotionReward() {
  const [loading, setLoading] = useState(false);

  const grantReward = useCallback(async () => {
    setLoading(true);
    try {
      const outcome = pickPromotionOutcome();
      if (outcome.type === 'miss') {
        return {
          ok: true,
          outcome: 'miss',
        };
      }

      const amount = outcome.amount;
      if (!isValidRewardAmount(amount)) {
        return {
          ok: false,
          errorMessage: `유효하지 않은 포인트 지급 금액이에요. (${amount})`,
        };
      }

      const result = await grantPromotionReward({
        params: {
          promotionCode: PROMOTION_CODE,
          amount,
        },
      });

      if (result === undefined) {
        return {
          ok: false,
          errorMessage:
            '토스 포인트 지급을 사용할 수 없어요. 토스 앱을 최신 버전(5.232.0 이상)으로 업데이트했는지 확인해 주세요.',
        };
      }

      if (result === 'ERROR') {
        return {
          ok: false,
          errorMessage: '토스 포인트 지급 중 알 수 없는 오류가 발생했어요.',
        };
      }

      if (result && typeof result === 'object' && 'errorCode' in result) {
        return {
          ok: false,
          errorMessage: result.message || `토스 포인트 지급에 실패했어요. (${result.errorCode})`,
        };
      }

      if (result && typeof result === 'object' && 'key' in result) {
        return {
          ok: true,
          outcome: 'granted',
          data: result,
          amount,
        };
      }

      return {
        ok: false,
        errorMessage: '토스 포인트 지급 응답을 처리하지 못했어요.',
      };
    } catch (error) {
      console.error('프로모션 지급 실패:', error);
      return {
        ok: false,
        errorMessage: error?.message || '프로모션 지급 요청에 실패했어요.',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, grantReward };
}
