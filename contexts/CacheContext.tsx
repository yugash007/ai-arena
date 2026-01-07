import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { generateFileHash, getCachedCheatSheet, cacheCheatSheet } from '../utils/cacheManager';
import { 
  QueuedDocument, 
  addToBatchQueue, 
  getBatchQueue, 
  startBatchProcessing, 
  clearBatchQueue 
} from '../utils/batchQueueManager';
import type { CheatSheetSection } from '../types';

interface CacheContextType {
  // Cache-related
  fileHash: string | null;
  hasCachedVersion: boolean;
  generateHash: (file: File) => Promise<string>;
  getCached: (hash: string) => CheatSheetSection[] | null;
  saveToCache: (hash: string, filename: string, content: CheatSheetSection[], fileSize: number) => void;

  // Batch processing
  batchQueue: QueuedDocument[];
  isBatchProcessing: boolean;
  queueDocuments: (documents: { file: File; fileHash: string }[]) => void;
  startBatch: (onProcess: (item: QueuedDocument) => Promise<void>) => Promise<void>;
  clearBatch: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [batchQueue, setBatchQueue] = useState<QueuedDocument[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const generateHash = useCallback(async (file: File): Promise<string> => {
    const hash = await generateFileHash(file);
    setFileHash(hash);
    return hash;
  }, []);

  const getCached = useCallback((hash: string) => {
    return getCachedCheatSheet(hash);
  }, []);

  const saveToCache = useCallback(
    (hash: string, filename: string, content: CheatSheetSection[], fileSize: number) => {
      cacheCheatSheet(hash, filename, content, fileSize);
    },
    []
  );

  const queueDocuments = useCallback((documents: { file: File; fileHash: string }[]) => {
    addToBatchQueue(documents);
    setBatchQueue(getBatchQueue());
  }, []);

  const startBatch = useCallback(
    async (onProcess: (item: QueuedDocument) => Promise<void>) => {
      setIsBatchProcessing(true);
      const processor = startBatchProcessing(onProcess, () => {
        setBatchQueue(getBatchQueue());
      });
      
      try {
        await processor();
      } finally {
        setIsBatchProcessing(false);
        setBatchQueue(getBatchQueue());
      }
    },
    []
  );

  const clearBatch = useCallback(() => {
    clearBatchQueue();
    setBatchQueue([]);
  }, []);

  const value: CacheContextType = {
    fileHash,
    hasCachedVersion: fileHash !== null && getCachedCheatSheet(fileHash || '') !== null,
    generateHash,
    getCached,
    saveToCache,
    batchQueue,
    isBatchProcessing,
    queueDocuments,
    startBatch,
    clearBatch,
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
};
