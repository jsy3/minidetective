import { useState, useCallback } from 'react'
import IntroPage from './pages/IntroPage'
import MainPage from './pages/MainPage'
import AnswerPage from './pages/AnswerPage'
import { getProblemByIndex, getRandomProblem } from './data/mysteryProblems'
import './App.css'

function App() {
  const [page, setPage] = useState('intro')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentProblem, setCurrentProblem] = useState(() => getRandomProblem())
  const [revealedClues, setRevealedClues] = useState([]) // 현재 문제에서 확인한 단서 인덱스 [0,1,2]

  const goToMain = useCallback((options = {}) => {
    if (options.nextProblem) {
      setCurrentProblem(getRandomProblem())
      setRevealedClues([])
    }
    setPage('main')
  }, [])

  const goToAnswer = useCallback(() => {
    setPage('answer')
  }, [])

  return (
    <>
      {page === 'intro' && (
        <IntroPage
          onBrowseWithoutLogin={() => {
            setIsLoggedIn(false)
            setPage('main')
          }}
          onLoginSuccess={() => {
            setIsLoggedIn(true)
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
        />
      )}
      {page === 'answer' && (
        <AnswerPage
          problem={currentProblem}
          onNext={() => goToMain({ nextProblem: true })}
        />
      )}
    </>
  )
}

export default App
