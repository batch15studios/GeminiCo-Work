import './vertex-ai-proxy-interceptor.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Gemini Co-Work App Crash]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#181818',
          color: '#f3f3f3',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Segoe UI, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            backgroundColor: '#202020',
            border: '1px solid #3c3c3c',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f87171', marginBottom: '8px' }}>
              Gemini Co-Work Startup Recovery
            </h2>
            <p style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '16px', lineHeight: 1.5 }}>
              The workstation encountered an unexpected error while initializing. You can reload or reset your local workspace settings.
            </p>
            <pre style={{
              backgroundColor: '#121212',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#d4d4d4',
              overflowX: 'auto',
              marginBottom: '20px',
              border: '1px solid #282828'
            }}>
              {this.state.error?.message || 'Unknown initialization error'}
            </pre>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#60cdff',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reload Workstation
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2d2d2d',
                  color: '#cccccc',
                  fontSize: '12px',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
