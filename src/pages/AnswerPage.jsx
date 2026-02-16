import { Text, Spacing } from '@toss/tds-mobile';
import styles from './AnswerPage.module.css';

const GREY_900 = '#191F28';

export default function AnswerPage({ problem, onNext }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Text typography="t5" color={GREY_900} fontWeight="semibold">
          정답
        </Text>
        <Spacing size={12} />
        <div className={styles.answerBox}>
          <Text typography="t6" color={GREY_900}>
            {problem?.answer ?? ''}
          </Text>
        </div>
        <Spacing size={16} />
        <Text typography="t7" color="rgba(0, 19, 43, 0.58)">
          토스 포인트가 지급되었어요.
        </Text>
      </div>

      <div className={styles.bottomBar}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={() => onNext()}
        >
          다음 문제
        </button>
      </div>
    </div>
  );
}
