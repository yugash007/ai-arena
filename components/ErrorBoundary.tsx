import React, { ErrorInfo, ReactNode } from 'react';
import { WarningIcon } from './icons/WarningIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans flex items-center justify-center p-6">
          <div className="relative max-w-lg w-full bg-slate-900/50 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden p-8 animate-fade-in-up">
            
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `linear-gradient(to right, #ef4444 1px, transparent 1px), linear-gradient(to bottom, #ef4444 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            ></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-6 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
                <WarningIcon className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">System Critical Failure</h1>
              <p className="text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">
                The neural interface encountered an unexpected anomaly. The process has been halted to prevent data corruption.
              </p>

              {this.state.error && (
                <div className="w-full bg-black/40 border border-slate-800 rounded-lg p-4 mb-8 text-left overflow-auto max-h-40 custom-scrollbar">
                  <p className="font-mono text-xs text-red-400 font-bold mb-1">Error Trace:</p>
                  <code className="font-mono text-[10px] text-slate-400 block whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                  </code>
                </div>
              )}

              <button
                onClick={this.handleReload}
                className="group relative flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
              >
                <RefreshIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span>Initiate System Reboot</span>
              </button>
            </div>

            {/* Decorative decorative lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}