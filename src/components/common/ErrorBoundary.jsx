import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback-premium">
          <div className="error-visual animate-pulse-cobalt">
            <span className="error-code">500</span>
          </div>
          <h2 className="error-title">Lost in the Frequency</h2>
          <p className="error-desc">The frequency dropped unexpectedly. We're recalibrating the stage for you.</p>
          
          <div className="error-actions">
            <button className="error-retry-btn" onClick={() => window.location.href = '/'}>
              Return to Home
            </button>
            <button className="error-refresh-btn" onClick={() => window.location.reload()}>
              Refresh Stage
            </button>
          </div>

          {import.meta.env.DEV && (
            <div className="debug-console glass-panel">
              <span className="debug-label">Debug Trace</span>
              <pre className="debug-stack">{this.state.error?.toString()}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
