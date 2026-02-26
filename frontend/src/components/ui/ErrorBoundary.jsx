import React from 'react';
import Button from './Button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Monkey Down:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-jungle-950 flex flex-col items-center justify-center text-white p-8 text-center">
                    <h1 className="text-6xl mb-4">🙈</h1>
                    <h2 className="text-3xl font-bold text-banana-500 mb-2">Monkey Down!</h2>
                    <p className="text-gray-400 mb-8 max-w-md">
                        Something went wrong in the jungle. The monkeys are working on it.
                    </p>
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl mb-8 text-left max-w-lg overflow-auto">
                        <p className="text-red-400 font-mono text-xs">
                            {this.state.error?.toString()}
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/';
                        }}
                        variant="primary"
                    >
                        Reset Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
