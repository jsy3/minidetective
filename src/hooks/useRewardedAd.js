import { useCallback, useRef, useState, useEffect } from 'react';

/** 앱인토스 콘솔에서 발급한 보상형 광고 그룹 ID */
const REWARDED_AD_GROUP_ID = 'ait.v2.live.b97c6baa847d4561';

/**
 * 보상형 광고 로드 및 노출 훅 (웹 프레임워크용).
 * 토스 앱 밖(브라우저 등)에서는 동작하지 않으며, 콜백만 호출해 흐름은 유지됩니다.
 */
export function useRewardedAd() {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [adMob, setAdMob] = useState(null); // GoogleAdMob (동적 로드)
  const cleanupRef = useRef(null);
  const rewardCallbackRef = useRef(null);
  const dismissCallbackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    import('@apps-in-toss/web-framework')
      .then((m) => {
        if (cancelled) return;
        if (m?.GoogleAdMob) setAdMob(m.GoogleAdMob);
        else {
          setLoading(false);
          setLoaded(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setLoaded(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const loadRewardAd = useCallback(() => {
    const GoogleAdMob = adMob;
    if (typeof GoogleAdMob?.loadAppsInTossAdMob?.isSupported !== 'function' || !GoogleAdMob.loadAppsInTossAdMob.isSupported()) {
      setLoading(false);
      setLoaded(false);
      return;
    }

    setLoading(true);
    setLoaded(false);
    cleanupRef.current?.();
    cleanupRef.current = null;

    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId: REWARDED_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setLoading(false);
          setLoaded(true);
        }
      },
      onError: () => {
        setLoading(false);
        setLoaded(false);
      },
    });

    cleanupRef.current = cleanup;
  }, [adMob]);

  useEffect(() => {
    if (!adMob) return;
    loadRewardAd();
    return () => {
      cleanupRef.current?.();
    };
  }, [adMob, loadRewardAd]);

  const showRewardAd = useCallback(({ onRewarded, onDismiss }) => {
    const GoogleAdMob = adMob;
    const isUnsupported = typeof GoogleAdMob?.showAppsInTossAdMob?.isSupported !== 'function' || !GoogleAdMob?.showAppsInTossAdMob.isSupported();
    if (loading || !loaded || isUnsupported) {
      return false;
    }

    rewardCallbackRef.current = onRewarded;
    dismissCallbackRef.current = onDismiss;

    GoogleAdMob.showAppsInTossAdMob({
      options: { adGroupId: REWARDED_AD_GROUP_ID },
      onEvent: (event) => {
        switch (event.type) {
          case 'userEarnedReward':
            rewardCallbackRef.current?.();
            rewardCallbackRef.current = null;
            break;
          case 'dismissed':
            dismissCallbackRef.current?.();
            dismissCallbackRef.current = null;
            loadRewardAd();
            break;
          case 'failedToShow':
            dismissCallbackRef.current?.();
            dismissCallbackRef.current = null;
            loadRewardAd();
            break;
          default:
            break;
        }
      },
      onError: () => {
        dismissCallbackRef.current?.();
        dismissCallbackRef.current = null;
        loadRewardAd();
      },
    });
    return true;
  }, [adMob, loaded, loading, loadRewardAd]);

  return { loading, loaded, loadRewardAd, showRewardAd };
}
