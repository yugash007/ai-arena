import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface CacheDialogProps {
  isOpen: boolean;
  filename: string;
  cachedAt: number;
  onUseCached: () => void;
  onGenerateNew: () => void;
  isLoading?: boolean;
}

const CacheDialog: React.FC<CacheDialogProps> = ({
  isOpen,
  filename,
  cachedAt,
  onUseCached,
  onGenerateNew,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const timeAgo = Math.floor((Date.now() - cachedAt) / 1000);
  let timeString = '';
  
  if (timeAgo < 60) timeString = 'just now';
  else if (timeAgo < 3600) timeString = `${Math.floor(timeAgo / 60)}m ago`;
  else if (timeAgo < 86400) timeString = `${Math.floor(timeAgo / 3600)}h ago`;
  else timeString = `${Math.floor(timeAgo / 86400)}d ago`;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full animate-fade-in overflow-hidden">
        
        <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <SparklesIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Cache Found</h2>
          </div>
        </header>

        <div className="px-6 py-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              We found a cached analysis for this document:
            </p>
            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm font-mono text-foreground truncate">{filename}</p>
              <p className="text-xs text-muted-foreground mt-1">Cached {timeString}</p>
            </div>
          </div>

          <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <p className="text-xs text-cyan-200 leading-relaxed">
              💡 <strong>Pro Tip:</strong> Using cached results saves API quota and loads instantly. Perfect for staying under free tier limits!
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-background border-t border-border flex gap-3">
          <button
            onClick={onGenerateNew}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-secondary text-foreground font-semibold text-sm rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            Generate New
          </button>
          <button
            onClick={onUseCached}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white font-semibold text-sm rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-4 h-4" />
            Use Cached
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheDialog;
