import { useEffect, useRef } from 'react';
import { whenTossAdsReady } from '../utils/tossAdsInit';

/** @type {number[]} 실패·노필 시 지연 재시도(ms), 최대 횟수만큼 순서대로 */
const RETRY_DELAYS_MS = [2000, 5000, 8000, 12000, 20000];

/**
 * TossAds.attachBanner — 리스트/피드형 배너용.
 * 노필(onNoFill)·렌더 실패·뷰포트 밖 부착 등 간헐 이슈에 대비해 재시도·가시성 진입 시 재부착.
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
  const watchdogTimerRef = useRef(null);
  const renderedRef = useRef(false);
  const retryIndexRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !adGroupId) {
      return undefined;
    }

    cancelledRef.current = false;
    renderedRef.current = false;
    retryIndexRef.current = 0;

    let raf1 = 0;
    let raf2 = 0;
    let io = null;
    let ioDebounceTimer = null;
    let lastIntersectAttachAt = 0;

    const clearRetryTimer = () => {
      if (retryTimerRef.current != null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const clearWatchdog = () => {
      if (watchdogTimerRef.current != null) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };

    const scheduleRetry = (TossAds, reason) => {
      if (cancelledRef.current || renderedRef.current || !containerRef.current) {
        return;
      }
      const idx = retryIndexRef.current;
      if (idx >= RETRY_DELAYS_MS.length) {
        if (import.meta.env.DEV) {
          console.warn('[TossBannerAd] max retries reached', { adGroupId, reason });
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
        onAdRendered: () => {
          renderedRef.current = true;
          clearRetryTimer();
          clearWatchdog();
        },
        onAdFailedToRender: () => scheduleRetry(TossAds, 'failedToRender'),
        onNoFill: () => scheduleRetry(TossAds, 'noFill'),
      },
    });

    const runAttach = (TossAds) => {
      if (cancelledRef.current || !TossAds || !containerRef.current) {
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
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => runAttach(TossAds));
      });
    };

    /** SDK는 visibility 전환 시 갱신되지만, 뷰포트 진입 시 부착이 안정되는 경우가 있음 */
    const onIntersect = (TossAds) => {
      if (cancelledRef.current || renderedRef.current) {
        return;
      }
      const now = Date.now();
      if (now - lastIntersectAttachAt < 4500) {
        return;
      }
      if (ioDebounceTimer) {
        clearTimeout(ioDebounceTimer);
      }
      ioDebounceTimer = window.setTimeout(() => {
        ioDebounceTimer = null;
        if (cancelledRef.current || renderedRef.current) {
          return;
        }
        lastIntersectAttachAt = Date.now();
        runAttachAfterLayout(TossAds);
      }, 160);
    };

    whenTossAdsReady().then((TossAds) => {
      if (cancelledRef.current || !TossAds || !containerRef.current) {
        return;
      }

      runAttachAfterLayout(TossAds);

      /* onAdRendered/onNoFill 지연 시 한 번 더 시도 */
      clearWatchdog();
      watchdogTimerRef.current = window.setTimeout(() => {
        watchdogTimerRef.current = null;
        if (!cancelledRef.current && !renderedRef.current && containerRef.current) {
          runAttach(TossAds);
        }
      }, 10000);

      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) {
            return;
          }
          onIntersect(TossAds);
        },
        { root: null, rootMargin: '120px 0px 160px 0px', threshold: 0 },
      );
      io.observe(el);
    });

    return () => {
      cancelledRef.current = true;
      clearRetryTimer();
      clearWatchdog();
      if (ioDebounceTimer) {
        clearTimeout(ioDebounceTimer);
      }
      io?.disconnect();
      if (raf1) {
        cancelAnimationFrame(raf1);
      }
      if (raf2) {
        cancelAnimationFrame(raf2);
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
