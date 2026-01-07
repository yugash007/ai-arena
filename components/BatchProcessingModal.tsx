import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { WarningIcon } from './icons/WarningIcon';
import { QueuedDocument, getQueueStats, clearCompletedQueue } from '../utils/batchQueueManager';

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: QueuedDocument[];
  isProcessing: boolean;
  onStartProcessing: () => void;
}

const BatchProcessingModal: React.FC<BatchProcessingModalProps> = ({
  isOpen,
  onClose,
  queue,
  isProcessing,
  onStartProcessing,
}) => {
  if (!isOpen) return null;

  const stats = getQueueStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <WarningIcon className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <SpinnerIcon className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'processing':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-background border border-border rounded-xl shadow-2xl max-w-2xl w-full animate-fade-in overflow-hidden flex flex-col max-h-[80vh]">
        
        <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-secondary/30 shrink-0">
          <h2 className="text-lg font-bold text-foreground">Batch Processing Queue</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-secondary/30 rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
              <p className="text-xs text-blue-300 mt-1">Processing</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-xs text-green-300 mt-1">Completed</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
              <p className="text-xs text-red-300 mt-1">Failed</p>
            </div>
          </div>

          {/* Estimated Time */}
          {stats.estimatedTimeMinutes > 0 && (
            <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <p className="text-sm text-cyan-200">
                ⏱️ <strong>Estimated Time:</strong> ~{stats.estimatedTimeMinutes} minute{stats.estimatedTimeMinutes !== 1 ? 's' : ''} 
                <span className="text-xs text-cyan-300 ml-2">(Respecting 15 RPM limit)</span>
              </p>
            </div>
          )}

          {/* Queue Items */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Queue Items</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {queue.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No items in queue</p>
              ) : (
                queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-secondary/20 rounded-lg border border-border flex items-start gap-3"
                  >
                    <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-mono text-foreground truncate">{item.file.name}</p>
                        <span className={`text-xs font-semibold ml-2 capitalize shrink-0 ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      {item.progress > 0 && item.progress < 100 && (
                        <div className="mt-2 w-full bg-secondary rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.error && (
                        <p className="text-xs text-red-400 mt-1">{item.error}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-background border-t border-border flex gap-3 shrink-0">
          {stats.completed > 0 && !isProcessing && (
            <button
              onClick={() => clearCompletedQueue()}
              className="px-4 py-2 bg-secondary text-foreground font-semibold text-sm rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Clear Completed
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-secondary text-foreground font-semibold text-sm rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            Close
          </button>
          {stats.pending > 0 && (
            <button
              onClick={onStartProcessing}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-cyan-600 text-white font-semibold text-sm rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <SpinnerIcon className="w-4 h-4" />
                  Start Processing
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchProcessingModal;
