import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// @ts-ignore
export class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  state: State = {
    hasError: false,
    error: null,
  };

  // @ts-ignore
  props: Props;

  constructor(props: Props) {
    // @ts-ignore
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    // @ts-ignore
    if (typeof this.setState === 'function') {
      // @ts-ignore
      this.setState({ hasError: false, error: null });
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-2xl">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Something unexpected occurred</h2>
          <p className="text-xs text-zinc-400 max-w-md mt-2 font-medium">
            The application encountered a display hiccup. You can refresh or return to the main dashboard.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-xs py-2.5 px-5 font-bold"
            >
              <RotateCcw size={14} />
              <span>Refresh Page</span>
            </button>
            <button
              onClick={this.handleReset}
              className="btn-secondary text-xs py-2.5 px-5 font-bold"
            >
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
