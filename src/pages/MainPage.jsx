import { useCallback, useState } from 'react';
import {
  Text,
  Spacing,
  Button,
  CTAButton,
  useDialog,
} from '@toss/tds-mobile';
import TossBannerAd from '../components/TossBannerAd';
import { AD_GROUP_LIST_BANNER } from '../constants/ads';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { usePromotionReward } from '../hooks/usePromotionReward';
import styles from './MainPage.module.css';

const GREY_900 = '#191F28';

export default function MainPage({
  problem,
  revealedClues,
  onRevealClue,
  onShowAnswer,
  isLoggedIn,
}) {
  const dialog = useDialog();
  const { loading: adLoading, loaded: isAdLoaded, loadInterstitialAd, showInterstitialAd } = useInterstitialAd();
  const { loading: rewardGranting, grantReward } = usePromotionReward();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClueClick = useCallback(
    (clueIndex) => {
      const clueText = problem?.clues?.[clueIndex];
      dialog
        .openAlert({
          title: '단서',
          description: clueText ?? '',
          alertButton: '확인',
        })
        .then(() => {
          onRevealClue(clueIndex);
        });
    },
    [problem, dialog, onRevealClue]
  );

  const clueCount = Math.max(0, problem?.clues?.length ?? 0);

  const handleShowAnswerClick = useCallback(() => {
    if (adLoading || isProcessing || rewardGranting) {
      return;
    }

    if (!isAdLoaded) {
      loadInterstitialAd();
      void dialog.openAlert({
        title: '광고 준비 중',
        description: '광고를 불러오고 있어요. 잠시 후 다시 시도해 주세요.',
        alertButton: '확인',
      });
      return;
    }

    setIsProcessing(true);

    const moveAfterAd = async () => {
      try {
        if (!isLoggedIn) {
          onShowAnswer({ rewardGrantedNow: false });
          return;
        }

        const rewardResult = await grantReward();
        if (rewardResult.ok) {
          if (rewardResult.outcome === 'miss') {
            onShowAnswer({ rewardMiss: true });
            return;
          }
          onShowAnswer({
            rewardGrantedNow: true,
            rewardAmount: rewardResult.amount ?? null,
          });
          return;
        }

        // 지급 API 오류: 별도 팝업 없이 정답 화면으로 (당회 미지급과 동일 처리)
        onShowAnswer({ rewardGrantedNow: false });
      } finally {
        setIsProcessing(false);
      }
    };

    const started = showInterstitialAd({
      onDone: () => {
        void moveAfterAd();
      },
    });

    if (!started) {
      setIsProcessing(false);
      loadInterstitialAd();
      void dialog.openAlert({
        title: '광고 준비 중',
        description: '광고를 다시 불러오는 중이에요. 잠시 후 다시 시도해 주세요.',
        alertButton: '확인',
      });
    }
  }, [
    adLoading,
    dialog,
    grantReward,
    isAdLoaded,
    isLoggedIn,
    isProcessing,
    loadInterstitialAd,
    onShowAnswer,
    rewardGranting,
    showInterstitialAd,
  ]);

  return (
    <div className={styles.page}>
      <Spacing size={24} />

      <div className={styles.content}>
        <Text typography="t5" color={GREY_900} fontWeight="semibold">
          추리 상황
        </Text>
        <Spacing size={12} />
        <div className={styles.situationBox}>
          <Text typography="t6" color={GREY_900}>
            {problem?.situation ?? ''}
          </Text>
        </div>

        <Spacing size={24} />
        <Text typography="t5" color={GREY_900} fontWeight="semibold">
          단서
        </Text>
        <Spacing size={12} />

        <div className={styles.clueButtons}>
          {Array.from({ length: clueCount }, (_, i) => {
            const revealed = revealedClues.includes(i);
            return (
              <CTAButton
                key={i}
                color="dark"
                variant="weak"
                display="block"
                onClick={() => handleClueClick(i)}
                disabled={revealed}
              >
                {`단서 ${i + 1}`}
              </CTAButton>
            );
          })}
        </div>

        <TossBannerAd
          adGroupId={AD_GROUP_LIST_BANNER}
          className={styles.listBannerSlot}
          theme="auto"
          tone="grey"
          variant="card"
        />
      </div>

      <div className={styles.bottomBar}>
        <Button
          color="primary"
          display="block"
          onClick={handleShowAnswerClick}
          loading={adLoading || isProcessing || rewardGranting}
          disabled={adLoading || isProcessing || rewardGranting}
        >
          광고 보고 정답 확인
        </Button>
      </div>
    </div>
  );
}
