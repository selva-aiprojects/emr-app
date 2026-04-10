import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Clinical Module Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-rose-50 rounded-2xl border border-rose-100 animate-fade-in text-center mx-4 my-8 shadow-sm">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm shadow-rose-200">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 mb-2 uppercase">Something went wrong</h2>
          <p className="text-sm font-medium text-slate-500 max-w-lg mb-8">
            The page you are looking for has encountered a temporary problem. 
            Your data is safe and has not been affected.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 cx-6 py-3 bg-slate-900 px-6 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
            >
              Refresh Page
            </button>
          </div>

          {this.state.error && process.env.NODE_ENV === 'development' && (
            <div className="mt-10 p-6 bg-white rounded-xl border border-rose-100 text-left w-full max-w-3xl overflow-auto text-xs text-rose-900 font-mono shadow-sm">
              <p className="font-bold mb-2">{this.state.error.toString()}</p>
              <pre className="opacity-70">{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
