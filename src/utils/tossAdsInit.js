/**
 * TossAds.initialize는 앱당 1회만 호출해야 함 (중복 시 onInitialized 미호출 등으로 배너가 안 붙을 수 있음).
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
 */
let resolvedTossAds = null;
let inFlight = null;

export function prefetchTossAds() {
  return whenTossAdsReady();
}

export function whenTossAdsReady() {
  if (resolvedTossAds) {
    return Promise.resolve(resolvedTossAds);
  }

  if (!inFlight) {
    inFlight = (async () => {
      const m = await import('@apps-in-toss/web-framework');
      const TossAds = m.TossAds;
      if (
        !TossAds ||
        typeof TossAds.initialize?.isSupported !== 'function' ||
        !TossAds.initialize.isSupported() ||
        typeof TossAds.attachBanner?.isSupported !== 'function' ||
        !TossAds.attachBanner.isSupported()
      ) {
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
