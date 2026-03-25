/**
 * TossAds.initialize는 앱당 1회만 호출해야 함.
 * 정적 import로 청크 로드 대기 없이 attach 시점을 앞당김.
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
 */
import { TossAds } from '@apps-in-toss/web-framework';

let resolvedTossAds = null;
let inFlight = null;

function tossAdsSupported() {
  return (
    TossAds &&
    typeof TossAds.initialize?.isSupported === 'function' &&
    TossAds.initialize.isSupported() &&
    typeof TossAds.attachBanner?.isSupported === 'function' &&
    TossAds.attachBanner.isSupported()
  );
}

export function prefetchTossAds() {
  return whenTossAdsReady();
}

export function whenTossAdsReady() {
  if (resolvedTossAds) {
    return Promise.resolve(resolvedTossAds);
  }

  if (!inFlight) {
    inFlight = (async () => {
      if (!tossAdsSupported()) {
        return null;
      }

      await new Promise((resolve, reject) => {
        TossAds.initialize({
          callbacks: {
            onInitialized: () => resolve(),
            onInitializationFailed: (err) => reject(err),
          },
        });
      });

      resolvedTossAds = TossAds;
      return TossAds;
    })()
      .catch((err) => {
        console.warn('[TossAds] initialize failed:', err);
        return null;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

if (typeof window !== 'undefined') {
  queueMicrotask(() => {
    prefetchTossAds().catch(() => {});
  });
}
