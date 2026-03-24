import { useEffect, useRef } from 'react';

/**
 * TossAds.attachBanner — 리스트/피드형 배너용.
 * @see https://developers-apps-in-toss.toss.im/ads/develop.html
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !adGroupId) {
      return undefined;
    }

    let cancelled = false;

    import('@apps-in-toss/web-framework').then((m) => {
      const TossAds = m.TossAds;
      if (cancelled || !TossAds) {
        return;
      }

      const initOk =
        typeof TossAds.initialize?.isSupported === 'function' &&
        TossAds.initialize.isSupported();
      const attachOk =
        typeof TossAds.attachBanner?.isSupported === 'function' &&
        TossAds.attachBanner.isSupported();

      if (!initOk || !attachOk) {
        return;
      }

      const tryAttach = () => {
        if (cancelled || !containerRef.current) {
          return;
        }
        attachRef.current?.destroy();
        attachRef.current = TossAds.attachBanner(adGroupId, containerRef.current, {
          theme,
          tone,
          variant,
        });
      };

      TossAds.initialize({
        callbacks: {
          onInitialized: tryAttach,
          onInitializationFailed: () => {},
        },
      });
    });

    return () => {
      cancelled = true;
      attachRef.current?.destroy();
      attachRef.current = null;
    };
  }, [adGroupId, theme, tone, variant]);

  return <div ref={containerRef} className={className} />;
}
