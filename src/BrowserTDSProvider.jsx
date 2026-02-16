/**
 * 브라우저(토스 앱 밖)에서 TDS 스타일을 적용하기 위한 Provider.
 * 토스 앱 내에서는 main.jsx에서 TDSMobileAITProvider를 사용합니다.
 */
import { TDSMobileProvider } from '@toss/tds-mobile';

const defaultUserAgent = {
  fontA11y: undefined,
  fontScale: 100,
  isAndroid: false,
  isIOS: false,
  colorPreference: 'light',
  safeAreaBottomTransparency: undefined,
};

const defaultToken = {
  color: {
    primary: '#3182F6',
  },
};

export function BrowserTDSProvider({ children }) {
  return (
    <TDSMobileProvider
      userAgent={defaultUserAgent}
      token={defaultToken}
    >
      {children}
    </TDSMobileProvider>
  );
}
