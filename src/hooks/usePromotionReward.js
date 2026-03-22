import { grantPromotionReward } from '@apps-in-toss/web-framework';
import { useCallback, useState } from 'react';

const PROMOTION_CODE = '01KHK7GMRDY7A4BVVP1HRN4XY8';
const MIN_REWARD_AMOUNT = 1;
const MAX_REWARD_AMOUNT = 5;

function isValidRewardAmount(amount) {
  return Number.isInteger(amount) && amount >= MIN_REWARD_AMOUNT && amount <= MAX_REWARD_AMOUNT;
}

function pickRandomRewardAmount() {
  return Math.floor(Math.random() * (MAX_REWARD_AMOUNT - MIN_REWARD_AMOUNT + 1)) + MIN_REWARD_AMOUNT;
}

export function usePromotionReward() {
  const [loading, setLoading] = useState(false);

  const grantReward = useCallback(async () => {
    setLoading(true);
    try {
      const amount = pickRandomRewardAmount();
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
