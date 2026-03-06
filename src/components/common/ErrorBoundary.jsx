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
        // Persistent logging for post-crash retrieval
        try {
            const crashLog = {
                timestamp: new Date().toISOString(),
                error: error.toString(),
                stack: error.stack,
                info: errorInfo.componentStack
            };
            const logs = JSON.parse(localStorage.getItem('stride_crash_logs') || '[]');
            logs.push(crashLog);
            localStorage.setItem('stride_crash_logs', JSON.stringify(logs.slice(-5)));
        } catch (e) {
            console.error("Failed to log crash to localStorage", e);
        }

        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: 'white', background: '#1a1a1a' }}>
                    <h1>Something went wrong.</h1>
                    <p>{this.state.error?.toString()}</p>
                    <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
