import React from 'react';
import { RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col h-full w-full bg-brand-cream items-center justify-center p-6 text-center gap-4 select-none">
          <div className="text-6xl animate-bounce">🌱</div>
          <h2 className="text-2xl font-black text-brand-blue tracking-tight">
            {this.props.fallbackTitle || 'あれれ？ がめん を よみなおすね'}
          </h2>
          <p className="text-xs text-gray-500 font-bold max-w-xs leading-relaxed">
            もんだい が おきました。したの ボタン を おして、もういちど あそんでみてね！
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-3 bg-brand-orange text-white rounded-2xl font-black shadow-md hover:bg-brand-orange/90 active:scale-95 transition text-sm"
            >
              <RefreshCw size={18} />
              <span>もういちど やる</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-5 py-3 bg-white text-brand-blue border-2 border-brand-blue rounded-2xl font-black shadow-sm hover:bg-brand-blue/5 active:scale-95 transition text-sm"
            >
              <Home size={18} />
              <span>ホーム に もどる</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
