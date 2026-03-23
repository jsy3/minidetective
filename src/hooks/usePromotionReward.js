import { grantPromotionReward } from '@apps-in-toss/web-framework';
import { useCallback, useState } from 'react';

const PROMOTION_CODE = '01KHK7GMRDY7A4BVVP1HRN4XY8';
const MIN_REWARD_AMOUNT = 1;
const MAX_REWARD_AMOUNT = 5;

/** @typedef {{ type: 'miss' }} MissOutcome */
/** @typedef {{ type: 'granted', amount: number }} GrantedOutcome */

/**
 * 광고·정답 플로우 확률: 다음 기회 60%, 1원 30%, 2원 5%, 3원 3%, 4원 1.5%, 5원 0.5%
 * @returns {MissOutcome | GrantedOutcome}
 */
export function pickPromotionOutcome() {
  const r = Math.random() * 100;
  if (r < 60) {
    return { type: 'miss' };
  }
  if (r < 90) {
    return { type: 'granted', amount: 1 };
  }
  if (r < 95) {
    return { type: 'granted', amount: 2 };
  }
  if (r < 98) {
    return { type: 'granted', amount: 3 };
  }
  if (r < 99.5) {
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
