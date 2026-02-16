import { useCallback } from 'react';
import {
  Text,
  Spacing,
  CTAButton,
  useDialog,
} from '@toss/tds-mobile';
import { useRewardedAd } from '../hooks/useRewardedAd';
import styles from './MainPage.module.css';

const GREY_900 = '#191F28';

export default function MainPage({
  problem,
  revealedClues,
  onRevealClue,
  onShowAnswer,
}) {
  const dialog = useDialog();
  const { loading: adLoading, showRewardAd, loadRewardAd } = useRewardedAd();

  const handleClueClick = useCallback(
    (clueIndex) => {
      const showClueAndReveal = () => {
        const clueText = problem?.clues?.[clueIndex];
        dialog
          .openAlert({
            title: '단서',
            description: clueText ?? '',
            alertButton: '확인',
          })
          .then(() => {
            onRevealClue(clueIndex);
            loadRewardAd();
          });
      };
      showRewardAd({
        onRewarded: showClueAndReveal,
        onDismiss: showClueAndReveal,
      });
    },
    [problem, dialog, onRevealClue, showRewardAd, loadRewardAd]
  );

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
          단서 (광고 시청 후 확인)
        </Text>
        <Spacing size={12} />

        <div className={styles.clueButtons}>
          {[0, 1, 2].map((i) => {
            const revealed = revealedClues.includes(i);
            return (
              <CTAButton
                key={i}
                color={revealed ? 'dark' : 'danger'}
                variant={revealed ? 'weak' : 'fill'}
                display="block"
                onClick={() => handleClueClick(i)}
                disabled={adLoading || revealed}
              >
                {`단서 ${i + 1}`}
              </CTAButton>
            );
          })}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <button
          type="button"
          className={styles.answerButton}
          onClick={() => onShowAnswer()}
        >
          정답 보기
        </button>
      </div>
    </div>
  );
}
