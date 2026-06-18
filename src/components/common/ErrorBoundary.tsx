import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error);
      return (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
          <h3 className="mb-2 font-semibold text-red-400">Something went wrong</h3>
          <pre className="overflow-auto text-xs text-red-300/80">{this.state.error.message}</pre>
          <button
            type="button"
            className="mt-4 text-sm text-primary hover:underline"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
