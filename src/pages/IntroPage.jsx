import {
  Text,
  Top,
  FixedBottomCTA,
  CTAButton,
  Spacing,
} from '@toss/tds-mobile';
import { useAuth } from '../hooks/useAuth';
import styles from './IntroPage.module.css';

const GREY_900 = '#191F28';

export default function IntroPage({ onBrowseWithoutLogin, onLoginSuccess }) {
  const auth = useAuth();

  const handleTossLogin = async () => {
    const loginResult = await auth.login();
    if (loginResult?.accessToken) {
      onLoginSuccess?.(loginResult);
    }
  };

  return (
    <div className={styles.page}>
      <Spacing size={29} />

      <div className={styles.content}>
        <div className={styles.heroFrame}>
          <img
            src="https://static.toss.im/2d-emojis/png/4x/u1F575_u1F3FE_u200D_u2642.png"
            alt=""
            style={{ width: '100%', maxWidth: 160, aspectRatio: '1/1' }}
          />
        </div>
        <Top
          title={
            <Top.TitleParagraph size={22} color={GREY_900}>
              1분만에 추리 문제 풀고
              <br />
              포인트 받아요
            </Top.TitleParagraph>
          }
          subtitleBottom={
            <Top.SubtitleParagraph>
              로그인해야 포인트를 받을 수 있어요.
            </Top.SubtitleParagraph>
          }
        />
      </div>

      {auth.error && (
        <div className={styles.error} role="alert">
          {auth.error}
        </div>
      )}

      <FixedBottomCTA.Double
        leftButton={
          <CTAButton
            color="dark"
            variant="weak"
            display="block"
            onClick={onBrowseWithoutLogin}
            disabled={auth.loading}
          >
            로그인 없이 둘러보기
          </CTAButton>
        }
        rightButton={
          <CTAButton
            display="block"
            onClick={handleTossLogin}
            disabled={auth.loading}
          >
            {auth.loading ? '로그인 중...' : '토스로 로그인하기'}
          </CTAButton>
        }
      />
    </div>
  );
}
