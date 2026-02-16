import { StrictMode, Fragment } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'

const rootEl = document.getElementById('root')
const root = createRoot(rootEl)

// 로딩 화면 먼저 표시 (JS 오류 시에도 index.html 기본 문구가 보이도록)
function Loading() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', textAlign: 'center' }}>
      로딩 중...
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{ color: '#e53935' }}>앱을 불러오지 못했어요</h2>
      <pre style={{ background: '#f5f5f5', padding: 12, overflow: 'auto', fontSize: 13 }}>
        {message}
      </pre>
      <p style={{ color: '#666', fontSize: 14 }}>F12 콘솔에서 자세한 오류를 확인할 수 있어요.</p>
    </div>
  )
}

root.render(<Loading />)

function isTossApp() {
  if (typeof window === 'undefined') return false
  const map = window.__CONSTANT_HANDLER_MAP
  return map && typeof map === 'object' && 'deploymentId' in map
}

Promise.all([
  import('@toss/tds-mobile-ait'),
  import('./App.jsx'),
  import('./BrowserTDSProvider.jsx'),
])
  .then(([tdsModule, appModule, browserTDS]) => {
    const { TDSMobileAITProvider } = tdsModule
    const { BrowserTDSProvider } = browserTDS
    const App = appModule.default
    const Provider = isTossApp() ? TDSMobileAITProvider : BrowserTDSProvider
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <Provider>
            <App />
          </Provider>
        </ErrorBoundary>
      </StrictMode>
    )
  })
  .catch((err) => {
    console.error('App load error:', err)
    root.render(
      <StrictMode>
        <ErrorScreen message={err?.message ?? String(err)} />
      </StrictMode>
    )
  })
