/**
 * 포인트 지급 완료 등 성공 피드백.
 * 무음 모드에서 일부 Android 기기는 알림 계열 햅틱이 막히는 경우가 있어,
 * 같은 시점에 navigator.vibrate로 짧은 진동을 한 번 보조합니다.
 * (iOS WebView는 vibrate 미지원이 많아 햅틱만 사용되는 편입니다.)
 */
function isAndroidUa() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
}

function isIosUa() {
  return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

function tryWebVibrateFallback() {
  if (!isAndroidUa() || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    navigator.vibrate([12, 45, 12]);
  } catch {
    /* noop */
  }
}

export function playRewardSuccessFeedback() {
  import('@apps-in-toss/web-framework')
    .then((mod) => {
      if (typeof mod.generateHapticFeedback !== 'function') {
        tryWebVibrateFallback();
        return;
      }
      if (isIosUa()) {
        void mod.generateHapticFeedback({ type: 'tap' }).catch(() => {});
      }
      void mod.generateHapticFeedback({ type: 'success' }).catch(() => {});
      tryWebVibrateFallback();
    })
    .catch(() => {
      tryWebVibrateFallback();
    });
}
