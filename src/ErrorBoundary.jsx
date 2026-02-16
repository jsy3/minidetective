import { Component } from 'react';

/** 앱 크래시 시 오류 메시지를 화면에 표시 (localhost 디버깅용) */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 480,
          margin: '0 auto',
        }}>
          <h2 style={{ color: '#e53935' }}>오류가 발생했어요</h2>
          <pre style={{
            background: '#f5f5f5',
            padding: 16,
            overflow: 'auto',
            fontSize: 14,
          }}>
            {this.state.error?.message ?? String(this.state.error)}
          </pre>
          <p style={{ color: '#666', fontSize: 14 }}>
            브라우저 콘솔(F12)에서 자세한 내용을 확인할 수 있어요.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
