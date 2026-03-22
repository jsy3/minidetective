import { useCallback, useEffect, useRef, useState } from 'react';

const ANSWER_AD_GROUP_ID = 'ait.v2.live.8c6c794bce594cba';

function getInterstitialAdGroupId() {
  return ANSWER_AD_GROUP_ID;
}

export function useInterstitialAd() {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [fullScreenAdApi, setFullScreenAdApi] = useState(null);
  const cleanupRef = useRef(null);
  const doneRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    import('@apps-in-toss/web-framework')
      .then((m) => {
        if (cancelled) return;
        if (m?.loadFullScreenAd && m?.showFullScreenAd) {
          setFullScreenAdApi({
            loadFullScreenAd: m.loadFullScreenAd,
            showFullScreenAd: m.showFullScreenAd,
          });
        }
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

    return () => {
      cancelled = true;
    };
  }, []);

  const loadInterstitialAd = useCallback(() => {
    const api = fullScreenAdApi;
    const adGroupId = getInterstitialAdGroupId();

    if (
      typeof api?.loadFullScreenAd?.isSupported !== 'function' ||
      !api.loadFullScreenAd.isSupported()
    ) {
      setLoading(false);
      setLoaded(false);
      return;
    }

    cleanupRef.current?.();
    cleanupRef.current = null;
    setLoading(true);
    setLoaded(false);

    const cleanup = api.loadFullScreenAd({
      options: { adGroupId },
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
  }, [fullScreenAdApi]);

  useEffect(() => {
    if (!fullScreenAdApi) return;
    loadInterstitialAd();

    return () => {
      cleanupRef.current?.();
    };
  }, [fullScreenAdApi, loadInterstitialAd]);

  const showInterstitialAd = useCallback(
    ({ onDone }) => {
      const api = fullScreenAdApi;
      const adGroupId = getInterstitialAdGroupId();
      const isUnsupported =
        typeof api?.showFullScreenAd?.isSupported !== 'function' ||
        !api.showFullScreenAd.isSupported();

      if (loading || !loaded || isUnsupported) {
        return false;
      }

      doneRef.current = onDone;

      const safeDone = () => {
        if (!doneRef.current) return;
        const callback = doneRef.current;
        doneRef.current = null;
        callback?.();
      };

      api.showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          switch (event.type) {
            case 'dismissed':
            case 'failedToShow':
              safeDone();
              loadInterstitialAd();
              break;
            default:
              break;
          }
        },
        onError: () => {
          safeDone();
          loadInterstitialAd();
        },
      });

      return true;
    },
    [fullScreenAdApi, loaded, loading, loadInterstitialAd]
  );

  return {
    loading,
    loaded,
    loadInterstitialAd,
    showInterstitialAd,
  };
}
