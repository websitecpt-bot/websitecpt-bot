import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Application Exception caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    // If quota issue caused the error, clear excessive cached items safely
    try {
      localStorage.removeItem('cpt_activeSupportUsers');
    } catch {}
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('cpt_activeSupportUsers');
    } catch {}
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
          <div className="bg-[#10141f] border border-[#222a3d] rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Temporary Interface Issue</h2>
              <p className="text-xs text-slate-400 mt-1">
                The screen was protected from an unexpected display exception.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#1b2336] hover:bg-[#25314a] text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Return to App
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
