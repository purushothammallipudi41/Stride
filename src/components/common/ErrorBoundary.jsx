import React from 'react';

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
        <div className="error-fallback" style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          color: 'white',
          background: '#0f0f13',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#8b5cf6' }}>Oops! Something went wrong.</h2>
          <p style={{ marginBottom: '2rem', opacity: 0.8 }}>The rhythm took a wrong turn. Let's get you back on track.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '12px 24px', 
              background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', 
              border: 'none', 
              borderRadius: '8px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          {import.meta.env.DEV && (
            <pre style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '8px',
              textAlign: 'left',
              maxWidth: '90%',
              overflow: 'auto',
              fontSize: '0.8rem',
              color: '#ff4d4d'
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
