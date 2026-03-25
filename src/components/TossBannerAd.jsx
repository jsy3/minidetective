import { useEffect, useRef } from 'react';
import { whenTossAdsReady } from '../utils/tossAdsInit';

/** @type {number[]} 최초 로드만: onNoFill·렌더 실패 시 재시도 간격(ms) */
const RETRY_DELAYS_MS = [2000, 5000, 8000, 12000];

/**
 * TossAds.attachBanner — 리스트/피드형 배너. 컨테이너 높이·너비는 페이지 CSS로 가이드(고정형)에 맞춤.
 * 한 번이라도 노출·렌더 성공 콜백이 오면 재시도·추가 부착을 하지 않음 (깜빡임·SDK 10초 갱신과 충돌 방지).
 * @see https://developers-apps-in-toss.toss.im/ads/develop.html
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
 */
export default function TossBannerAd({
  adGroupId,
  className,
  theme = 'auto',
  tone = 'blackAndWhite',
  variant = 'expanded',
}) {
  const containerRef = useRef(null);
  const attachRef = useRef(null);
  const retryTimerRef = useRef(null);
  /** 노출 성공 이후에는 destroy·재부착 금지 */
  const slotLiveRef = useRef(false);
  const retryIndexRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !adGroupId) {
      return undefined;
    }

    cancelledRef.current = false;
    slotLiveRef.current = false;
    retryIndexRef.current = 0;

    let rafId = 0;

    const clearRetryTimer = () => {
      if (retryTimerRef.current != null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const markSlotLive = () => {
      slotLiveRef.current = true;
      clearRetryTimer();
    };

    const scheduleRetry = (TossAds, reason) => {
      if (cancelledRef.current || slotLiveRef.current || !containerRef.current) {
        return;
      }
      const idx = retryIndexRef.current;
      if (idx >= RETRY_DELAYS_MS.length) {
        if (import.meta.env.DEV) {
          console.warn('[TossBannerAd] max retries', { adGroupId, reason });
        }
        return;
      }
      const delay = RETRY_DELAYS_MS[idx];
      clearRetryTimer();
      retryTimerRef.current = window.setTimeout(() => {
        retryTimerRef.current = null;
        retryIndexRef.current = idx + 1;
        runAttach(TossAds);
      }, delay);
    };

    const attachOptions = (TossAds) => ({
      theme,
      tone,
      variant,
      callbacks: {
        onAdRendered: () => markSlotLive(),
        onAdViewable: () => markSlotLive(),
        onAdImpression: () => markSlotLive(),
        onAdFailedToRender: () => {
          if (slotLiveRef.current) {
            return;
          }
          scheduleRetry(TossAds, 'failedToRender');
        },
        onNoFill: () => {
          if (slotLiveRef.current) {
            return;
          }
          scheduleRetry(TossAds, 'noFill');
        },
      },
    });

    const runAttach = (TossAds) => {
      if (cancelledRef.current || !TossAds || !containerRef.current || slotLiveRef.current) {
        return;
      }

      attachRef.current?.destroy();
      attachRef.current = null;

      try {
        attachRef.current = TossAds.attachBanner(
          adGroupId,
          containerRef.current,
          attachOptions(TossAds),
        );
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('[TossBannerAd] attachBanner threw', e);
        }
        scheduleRetry(TossAds, 'throw');
      }
    };

    const runAttachAfterLayout = (TossAds) => {
      rafId = requestAnimationFrame(() => runAttach(TossAds));
    };

    whenTossAdsReady().then((TossAds) => {
      if (cancelledRef.current || !containerRef.current) {
        return;
      }
      if (!TossAds) {
        return;
      }
      runAttachAfterLayout(TossAds);
    });

    return () => {
      cancelledRef.current = true;
      clearRetryTimer();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      attachRef.current?.destroy();
      attachRef.current = null;
    };
  }, [adGroupId, theme, tone, variant]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
    />
  );
}
