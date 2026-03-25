import { useEffect, useMemo } from 'react';
import { Text, Spacing, CTAButton } from '@toss/tds-mobile';
import TossBannerAd from '../components/TossBannerAd';
import { AD_GROUP_FEED_BANNER_REWARD } from '../constants/ads';
import styles from './RewardGrantedPage.module.css';

const GREY_900 = '#191F28';

export default function RewardGrantedPage({ onContinue, rewardAmount }) {
  const normalizedRewardAmount = useMemo(() => {
    if (rewardAmount === null || rewardAmount === undefined || rewardAmount === '') {
      return null;
    }

    const parsedAmount = Number(rewardAmount);
    return Number.isFinite(parsedAmount) && parsedAmount >= 1 ? parsedAmount : null;
  }, [rewardAmount]);

  useEffect(() => {
    let cancelled = false;
    import('@apps-in-toss/web-framework')
      .then((mod) => {
        if (cancelled || typeof mod.generateHapticFeedback !== 'function') {
          return;
        }
        void mod.generateHapticFeedback({ type: 'success' }).catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <div className={styles.content}>
          <div className={styles.iconFrame} aria-hidden>
            <img
              src="https://static.toss.im/3d-emojis/u1F389_apng.png"
              alt=""
              className={styles.icon}
            />
          </div>

          <Spacing size={20} />
          <Text typography="t4" color={GREY_900} fontWeight="bold">
            토스 포인트 지급 완료
          </Text>
          <Spacing size={8} />
          <Text typography="t6" color={GREY_900}>
            {normalizedRewardAmount !== null
              ? `${normalizedRewardAmount}포인트가 지급됐어요.`
              : '포인트가 지급됐어요.'}
          </Text>

          <TossBannerAd
            key={AD_GROUP_FEED_BANNER_REWARD}
            adGroupId={AD_GROUP_FEED_BANNER_REWARD}
            className={styles.feedBannerSlot}
            theme="auto"
            tone="grey"
            variant="card"
          />
        </div>
      </div>

      <div className={styles.bottomBar}>
        <CTAButton display="block" onClick={onContinue}>
          정답 확인하기
        </CTAButton>
      </div>
    </div>
  );
}
