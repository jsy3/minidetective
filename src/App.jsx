import { useState, useCallback, useEffect } from 'react'
import { prefetchTossAds } from './utils/tossAdsInit'
import IntroPage from './pages/IntroPage'
import MainPage from './pages/MainPage'
import AnswerPage from './pages/AnswerPage'
import RewardGrantedPage from './pages/RewardGrantedPage'
import RewardMissPage from './pages/RewardMissPage'
import { getRandomProblem } from './data/mysteryProblems'
import './App.css'

const ACCESS_TOKEN_STORAGE_KEY = 'minidetective.accessToken'

function readStoredAccessToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

function persistAccessToken(token) {
  if (typeof window === 'undefined') return

  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

function App() {
  useEffect(() => {
    prefetchTossAds().catch(() => {})
  }, [])

  const [accessToken, setAccessToken] = useState(() => readStoredAccessToken())
  const [page, setPage] = useState(() => (readStoredAccessToken() ? 'main' : 'intro'))
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

  return (
    <>
      {page === 'intro' && (
        <IntroPage
          onBrowseWithoutLogin={() => {
            setIsLoggedIn(false)
            setAccessToken(null)
            persistAccessToken(null)
            setPage('main')
          }}
          onLoginSuccess={(loginResult) => {
            const nextAccessToken = loginResult?.accessToken ?? null
            setIsLoggedIn(true)
            setAccessToken(nextAccessToken)
            persistAccessToken(nextAccessToken)
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
