import React, { useEffect, useState } from 'react';
import { WarningIcon } from './icons/WarningIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { getUnsyncedChangeCount } from '../utils/offlineFlashcardManager';

interface OfflineIndicatorProps {
  isOnline: boolean;
  onSyncClick?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline, onSyncClick }) => {
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Check for unsynced changes periodically
    const interval = setInterval(() => {
      setUnsyncedCount(getUnsyncedChangeCount());
    }, 5000);

    setUnsyncedCount(getUnsyncedChangeCount());
    return () => clearInterval(interval);
  }, []);

  if (isOnline && unsyncedCount === 0) {
    return null; // Don't show anything if online and no pending changes
  }

  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border backdrop-blur-sm flex items-center gap-3 z-40 animate-fade-in-up ${
        isOnline
          ? 'bg-green-500/10 border-green-500/30 text-green-300'
          : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
      }`}
    >
      <div className="flex items-center gap-3 flex-grow">
        {isOnline ? (
          <>
            <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-semibold">
              Online
              {unsyncedCount > 0 && ` • ${unsyncedCount} pending changes`}
            </span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
            <span className="text-sm font-semibold">
              Offline Mode
              {unsyncedCount > 0 && ` • ${unsyncedCount} changes saved locally`}
            </span>
          </>
        )}
      </div>

      {unsyncedCount > 0 && isOnline && onSyncClick && (
        <button
          onClick={() => {
            setIsSyncing(true);
            onSyncClick();
            setTimeout(() => setIsSyncing(false), 2000);
          }}
          disabled={isSyncing}
          className="text-xs font-bold bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 px-3 py-1 rounded transition-colors flex items-center gap-1.5"
        >
          {isSyncing ? (
            <>
              <SpinnerIcon className="w-3 h-3 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync Now'
          )}
        </button>
      )}
    </div>
  );
};

export default OfflineIndicator;
