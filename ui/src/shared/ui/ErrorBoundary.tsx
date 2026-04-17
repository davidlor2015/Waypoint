import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl border border-smoke/60 shadow-sm p-8 flex flex-col gap-5 text-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-espresso">Something went wrong</h1>
            <p className="text-sm text-flint mt-2 leading-relaxed">
              An unexpected error occurred. You can try again or return to the start.
            </p>
          </div>

          {this.state.error && (
            <pre className="text-left text-xs text-flint/70 bg-parchment rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {this.state.error.message}
            </pre>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex-1 py-2.5 rounded-full bg-amber text-white text-sm font-bold
                         hover:bg-amber-dark transition-colors duration-150 cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="flex-1 py-2.5 rounded-full bg-parchment text-espresso text-sm font-semibold
                         hover:bg-smoke transition-colors duration-150 cursor-pointer"
            >
              Return to start
            </button>
          </div>
        </div>
      </div>
    );
  }
}
