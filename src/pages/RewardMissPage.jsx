import { Text, Spacing, CTAButton } from '@toss/tds-mobile';
import TossBannerAd from '../components/TossBannerAd';
import { AD_GROUP_FEED_BANNER_REWARD } from '../constants/ads';
import styles from './RewardMissPage.module.css';

const GREY_900 = '#191F28';
const GREY_500 = '#8B95A1';

export default function RewardMissPage({ onContinue }) {
  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <div className={styles.content}>
          <div className={styles.missBadge} aria-hidden>
            <span className={styles.missLetter}>꽝</span>
          </div>

          <Spacing size={24} />
          <Text typography="t4" color={GREY_900} fontWeight="bold">
            토스포인트는 다음 기회에…
          </Text>
          <Spacing size={8} />
          <Text typography="t6" color={GREY_500}>
            아쉽지만 이번엔 포인트가 없어요.
          </Text>
          <Spacing size={4} />
          <Text typography="t6" color={GREY_500}>
            다음 문제도 도전해보세요!
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
