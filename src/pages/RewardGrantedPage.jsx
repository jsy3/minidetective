import { useMemo } from 'react';
import { Text, Spacing, CTAButton } from '@toss/tds-mobile';
import TossBannerAd from '../components/TossBannerAd';
import { AD_GROUP_FEED_BANNER } from '../constants/ads';
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

  return (
    <div className={styles.page}>
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
          adGroupId={AD_GROUP_FEED_BANNER}
          className={styles.feedBannerSlot}
          theme="auto"
          tone="grey"
          variant="card"
        />
      </div>

      <div className={styles.bottomBar}>
        <CTAButton display="block" onClick={onContinue}>
          정답 확인하기
        </CTAButton>
      </div>
    </div>
  );
}
