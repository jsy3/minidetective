import {
  Top,
  FixedBottomCTA,
  CTAButton,
  Spacing,
  Badge,
  Asset,
  Text,
} from '@toss/tds-mobile';
import { useAuth } from '../hooks/useAuth';
import styles from './IntroPage.module.css';

const GREY_900 = '#191F28';

export default function IntroPage({
  hasStoredAccessToken = false,
  onBrowseWithoutLogin,
  onGoToMain,
  onLoginSuccess,
}) {
  const auth = useAuth();
  const isLoggedIn = Boolean(hasStoredAccessToken || auth.accessToken);

  const handleTossLogin = async () => {
    const loginResult = await auth.login();
    if (loginResult?.accessToken) {
      onLoginSuccess?.(loginResult);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.heroCard}>
          <Asset.Image
            src="https://static.toss.im/2d-emojis/png/4x/u1F575_u1F3FE_u200D_u2642.png"
            alt=""
            frameShape={{
              width: 112,
              height: 112,
              radius: 24,
            }}
            backgroundColor="transparent"
          />
        </div>

        <Top
          upperGap={12}
          lowerGap={20}
          title={
            <Top.TitleParagraph size={22} color={GREY_900}>
              1분만에 추리 문제 풀고
              <br />
              최대 5포인트 받아요
            </Top.TitleParagraph>
          }
          subtitleBottom={
            !isLoggedIn ? (
              <Top.SubtitleParagraph size={15}>
                로그인해야 포인트를 받을 수 있어요.
              </Top.SubtitleParagraph>
            ) : null
          }
        />

        <div className={styles.eventSection} role="status">
          <Badge size="large" variant="fill" color="yellow">
            이벤트
          </Badge>
          <Spacing size={8} />
          <Text
            typography="t4"
            fontWeight="bold"
            color={GREY_900}
            display="block"
            textAlign="center"
            className={styles.eventLine}
          >
            일요일에는 포인트 당첨 확률이{' '}
            <span className={styles.eventEmphasis}>2배</span>!
          </Text>
        </div>
      </div>

      {auth.error && (
        <Text
          typography="t6"
          color="var(--token-tds-color-red-500, #e53935)"
          display="block"
          className={styles.error}
          role="alert"
        >
          {auth.error}
        </Text>
      )}

      {isLoggedIn ? (
        <FixedBottomCTA display="block" onClick={() => onGoToMain?.()}>
          문제 풀러가기
        </FixedBottomCTA>
      ) : (
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
      )}
    </div>
  );
}
