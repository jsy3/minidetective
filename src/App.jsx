import { useState, useCallback, useEffect } from 'react'
import { prefetchTossAds } from './utils/tossAdsInit'
import IntroPage from './pages/IntroPage'
import MainPage from './pages/MainPage'
import AnswerPage from './pages/AnswerPage'
import RewardGrantedPage from './pages/RewardGrantedPage'
import RewardMissPage from './pages/RewardMissPage'
import { getRandomProblem } from './data/mysteryProblems'
import {
  readStoredAccessToken,
  persistAccessToken,
  persistRefreshToken,
  readStoredRefreshToken,
  clearStoredAuth,
} from './utils/authSession.js'
import { requestTokenRefresh } from './utils/tossTokenRefresh.js'
import './App.css'

function App() {
  const [accessToken, setAccessToken] = useState(() => readStoredAccessToken())
  const [page, setPage] = useState('intro')
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(readStoredAccessToken()))
  const [currentProblem, setCurrentProblem] = useState(() => getRandomProblem())
  const [revealedClues, setRevealedClues] = useState([]) // 현재 문제에서 확인한 단서 인덱스 [0,1,2]
  const [latestGrantedRewardAmount, setLatestGrantedRewardAmount] = useState(null)

  const goToMain = useCallback((options = {}) => {
    if (options.nextProblem) {
      setCurrentProblem(getRandomProblem())
      setRevealedClues([])
    }
    setPage('main')
  }, [])

  const goToAnswer = useCallback((options = {}) => {
    if (options.rewardMiss) {
      setLatestGrantedRewardAmount(null)
      setPage('reward-miss')
      return
    }
    if (options.rewardGrantedNow) {
      setLatestGrantedRewardAmount(options.rewardAmount ?? null)
      setPage('reward-granted')
      return
    }
    setLatestGrantedRewardAmount(null)
    setPage('answer')
  }, [])

  useEffect(() => {
    prefetchTossAds().catch(() => {})
  }, [])

  /** 문서 §3: 저장된 refreshToken(14일)으로 액세스 토큰(1시간) 조용히 갱신 */
  useEffect(() => {
    let cancelled = false
    const rt = readStoredRefreshToken()
    if (!rt) return undefined

    ;(async () => {
      try {
        const { accessToken: nextAccess, refreshToken: nextRefresh } =
          await requestTokenRefresh(rt)
        if (cancelled) return
        persistAccessToken(nextAccess)
        persistRefreshToken(nextRefresh)
        setAccessToken(nextAccess)
        setIsLoggedIn(true)
      } catch (e) {
        console.warn('저장된 세션 갱신 실패:', e)
        if (cancelled) return
        clearStoredAuth()
        setAccessToken(null)
        setIsLoggedIn(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {page === 'intro' && (
        <IntroPage
          hasStoredAccessToken={Boolean(accessToken ?? readStoredAccessToken())}
          onBrowseWithoutLogin={() => {
            setIsLoggedIn(false)
            setAccessToken(null)
            clearStoredAuth()
            setPage('main')
          }}
          onGoToMain={() => {
            const token = accessToken ?? readStoredAccessToken()
            setIsLoggedIn(Boolean(token))
            if (token && !accessToken) setAccessToken(token)
            setPage('main')
          }}
          onLoginSuccess={(loginResult) => {
            const nextAccessToken = loginResult?.accessToken ?? null
            const nextRefresh = loginResult?.refreshToken ?? null
            setIsLoggedIn(true)
            setAccessToken(nextAccessToken)
            persistAccessToken(nextAccessToken)
            if (nextRefresh) persistRefreshToken(nextRefresh)
            else persistRefreshToken(null)
            setPage('main')
          }}
        />
      )}
      {page === 'main' && (
        <MainPage
          problem={currentProblem}
          revealedClues={revealedClues}
          onRevealClue={(index) => setRevealedClues((prev) => (prev.includes(index) ? prev : [...prev, index]))}
          onShowAnswer={goToAnswer}
          isLoggedIn={isLoggedIn}
        />
      )}
      {page === 'answer' && (
        <AnswerPage
          problem={currentProblem}
          onNext={() => goToMain({ nextProblem: true })}
        />
      )}
      {page === 'reward-granted' && (
        <RewardGrantedPage
          rewardAmount={latestGrantedRewardAmount}
          onContinue={() => setPage('answer')}
        />
      )}
      {page === 'reward-miss' && (
        <RewardMissPage onContinue={() => setPage('answer')} />
      )}
    </>
  )
}

export default App
