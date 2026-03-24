import { grantPromotionReward } from '@apps-in-toss/web-framework';
import { useCallback, useState } from 'react';

const PROMOTION_CODE = '01KHK7GMRDY7A4BVVP1HRN4XY8';
const MIN_REWARD_AMOUNT = 1;
const MAX_REWARD_AMOUNT = 5;

/** @typedef {{ type: 'miss' }} MissOutcome */
/** @typedef {{ type: 'granted', amount: number }} GrantedOutcome */

/**
 * 광고·정답 플로우 확률: 꽝 65%, 1원 33.25%, 2원 1%, 3원 0.5%, 4원 0.15%, 5원 0.1%
 * (3원 0.5%로 줄인 비중 0.2%p는 1원에 반영) 기대값 ≈ 0.379원/회
 * `r = Math.random() * 100` ∈ [0, 100) 균등분포, 아래는 누적 상한(백분율).
 * [0,65)→miss, [65,98.25)→1, [98.25,99.25)→2, [99.25,99.75)→3, [99.75,99.9)→4, [99.9,100)→5
 * @returns {MissOutcome | GrantedOutcome}
 */
export function pickPromotionOutcome() {
  const r = Math.random() * 100;
  if (r < 65) {
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
      const result = await grantPromotionReward({
        params: {
          promotionCode: PROMOTION_CODE,
          amount,
        },
      });

      if (!result) {
        return {
          ok: false,
          errorMessage: '현재 앱 버전에서는 토스 포인트 지급을 지원하지 않아요.',
        };
      }

      if (result === 'ERROR') {
        return {
          ok: false,
          errorMessage: '토스 포인트 지급 중 알 수 없는 오류가 발생했어요.',
        };
      }

      if ('errorCode' in result) {
        return {
          ok: false,
          errorMessage: result.message || `토스 포인트 지급에 실패했어요. (${result.errorCode})`,
        };
      }

      if (!isValidRewardAmount(amount)) {
        return {
          ok: false,
          errorMessage: `유효하지 않은 포인트 지급 금액이에요. (${amount})`,
        };
      }

      return {
        ok: true,
        outcome: 'granted',
        data: result,
        amount,
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
