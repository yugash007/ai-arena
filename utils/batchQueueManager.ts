/**
 * Batch Processing Queue Manager
 * Respects 15 RPM (1 request per 4 seconds) for free tier
 */

export interface QueuedDocument {
  id: string;
  file: File;
  fileHash: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
  resultId?: string; // Reference to generated sheet ID
}

interface BatchQueue {
  items: QueuedDocument[];
  isProcessing: boolean;
  currentIndex: number;
}

const BATCH_QUEUE_KEY = 'ai_arena_batch_queue';
const FREE_TIER_RPM_LIMIT = 15; // requests per minute
const REQUEST_INTERVAL = (60 / FREE_TIER_RPM_LIMIT) * 1000; // ~4000ms = 4 seconds

let queue: BatchQueue = {
  items: [],
  isProcessing: false,
  currentIndex: 0,
};

/**
 * Add documents to the batch queue
 */
export const addToBatchQueue = (documents: { file: File; fileHash: string }[]): void => {
  const newItems: QueuedDocument[] = documents.map((doc) => ({
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    file: doc.file,
    fileHash: doc.fileHash,
    status: 'pending',
    progress: 0,
  }));

  queue.items = [...queue.items, ...newItems];
  saveBatchQueueToStorage();
};

/**
 * Get current queue status
 */
export const getBatchQueue = (): QueuedDocument[] => {
  return queue.items;
};

/**
 * Get queue statistics
 */
export const getQueueStats = () => {
  const pending = queue.items.filter(i => i.status === 'pending').length;
  const processing = queue.items.filter(i => i.status === 'processing').length;
  const completed = queue.items.filter(i => i.status === 'completed').length;
  const failed = queue.items.filter(i => i.status === 'failed').length;

  const estimatedTimeMinutes = Math.ceil((pending + (processing ? 1 : 0)) * REQUEST_INTERVAL / 1000 / 60);

  return {
    pending,
    processing,
    completed,
    failed,
    total: queue.items.length,
    estimatedTimeMinutes,
  };
};

/**
 * Update a queued item's status
 */
export const updateQueueItem = (
  id: string,
  updates: Partial<QueuedDocument>
): void => {
  const item = queue.items.find(i => i.id === id);
  if (item) {
    Object.assign(item, updates);
    saveBatchQueueToStorage();
  }
};

/**
 * Start processing the batch queue
 * Returns a callback function to call for each item processed
 */
export const startBatchProcessing = (
  onProcess: (item: QueuedDocument) => Promise<void>,
  onProgress?: (stats: ReturnType<typeof getQueueStats>) => void
): (() => Promise<void>) => {
  return async () => {
    if (queue.isProcessing) return;

    queue.isProcessing = true;

    for (let i = 0; i < queue.items.length; i++) {
      const item = queue.items[i];

      if (item.status === 'completed' || item.status === 'failed') {
        continue; // Skip already processed items
      }

      updateQueueItem(item.id, { status: 'processing', progress: 25 });
      onProgress?.(getQueueStats());

      try {
        await onProcess(item);
        updateQueueItem(item.id, { status: 'completed', progress: 100 });
      } catch (error: any) {
        updateQueueItem(item.id, {
          status: 'failed',
          error: error.message || 'Unknown error',
          progress: 0,
        });
      }

      onProgress?.(getQueueStats());

      // Respect rate limit: wait 4 seconds between requests
      if (i < queue.items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
      }
    }

    queue.isProcessing = false;
    saveBatchQueueToStorage();
  };
};

/**
 * Clear a specific item from queue
 */
export const removeFromQueue = (id: string): void => {
  queue.items = queue.items.filter(i => i.id !== id);
  saveBatchQueueToStorage();
};

/**
 * Clear all queue items (completed and failed)
 */
export const clearCompletedQueue = (): void => {
  queue.items = queue.items.filter(i => i.status === 'pending' || i.status === 'processing');
  saveBatchQueueToStorage();
};

/**
 * Clear entire queue
 */
export const clearBatchQueue = (): void => {
  queue = {
    items: [],
    isProcessing: false,
    currentIndex: 0,
  };
  localStorage.removeItem(BATCH_QUEUE_KEY);
};

/**
 * Persist queue to localStorage for recovery
 */
const saveBatchQueueToStorage = (): void => {
  try {
    // Only store metadata (not File objects which can't be serialized)
    const metadata = queue.items.map(item => ({
      id: item.id,
      filename: item.file.name,
      fileHash: item.fileHash,
      status: item.status,
      progress: item.progress,
      error: item.error,
      resultId: item.resultId,
    }));
    localStorage.setItem(BATCH_QUEUE_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn('Failed to save batch queue:', error);
  }
};

/**
 * Load queue metadata from storage (files will need to be re-added)
 */
export const loadBatchQueueMetadata = () => {
  try {
    const data = localStorage.getItem(BATCH_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};
