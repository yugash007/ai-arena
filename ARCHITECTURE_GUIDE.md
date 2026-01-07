# Architecture Guide: Free-Tier Optimizations

This document explains the architecture, design patterns, and data flow of the three implemented free-tier optimization features.

---

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                              │
│                    (Main Application)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  CacheDialog    │  │ BatchProcess │  │ OfflineIndicate │ │
│  │  Component      │  │   Modal      │  │   or Component  │ │
│  └────────┬────────┘  └──────┬───────┘  └────────┬────────┘ │
│           │                  │                   │           │
│           └──────────────────┴───────────────────┘           │
│                        │                                     │
│                 Uses Event Listeners                         │
│                 - window.online                              │
│                 - window.offline                             │
│                                                              │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
        ┌───────▼──┐  ┌─────▼──┐  ┌─────▼─────┐
        │ Cache    │  │ Batch  │  │ Offline   │
        │ Manager  │  │ Queue  │  │ Flashcard │
        │ (util)   │  │Manager │  │ Manager   │
        │          │  │ (util) │  │ (util)    │
        └───────┬──┘  └────┬───┘  └─────┬─────┘
                │          │            │
                └──────────┼────────────┘
                           │
                  ┌────────▼────────┐
                  │  localStorage   │
                  │  (5-10MB quota) │
                  └─────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Smart Caching Flow

```
User Uploads PDF
      │
      ├─ generateFileHash(file)
      │  └─ Returns: hash_abc123xyz
      │
      ├─ getCachedCheatSheet(hash)
      │  └─ Check localStorage[ai_arena_cache_hash123]
      │
      ├─ Cache Found? ✓
      │  └─ Show CacheDialog
      │     ├─ User: "Use Cached" → Load from localStorage (0 API calls)
      │     └─ User: "Generate New" → Call Gemini API
      │
      └─ Cache Not Found? ✗
         └─ Call Gemini API
            └─ After success: cacheCheatSheet(hash, filename, content, size)
               └─ Stores in localStorage with metadata
```

**localStorage Structure:**
```javascript
{
  "ai_arena_cache_abc123xyz": {
    "fileHash": "hash_abc123xyz",
    "filename": "Chapter1.pdf",
    "content": [CheatSheetSection[], ...],
    "timestamp": 1704067200000,
    "fileSize": 2048576
  },
  "ai_arena_cache_metadata": {
    "totalEntries": 5,
    "lastCleanup": 1704067200000
  }
}
```

---

### 2. Batch Processing Flow

```
User Selects Multiple Files
      │
      ├─ addToBatchQueue(documents)
      │  └─ Creates QueuedDocument[] with:
      │     - id (UUID)
      │     - file (File object)
      │     - status: "pending"
      │     - progress: 0
      │
      ├─ Show BatchProcessingModal
      │  └─ Display queue statistics
      │     ├─ Pending: 3
      │     ├─ Processing: 0
      │     ├─ Completed: 0
      │     └─ Estimated time: 12 seconds
      │
      ├─ User: "Start Processing"
      │  └─ startBatchProcessing(onProcess)
      │     └─ For each item in queue:
      │        ├─ Set status: "processing"
      │        ├─ Call API (e.g., Gemini)
      │        ├─ Await completion
      │        ├─ Set status: "completed"
      │        ├─ Wait 4 seconds (REQUEST_INTERVAL)
      │        └─ Repeat for next item
      │
      └─ Queue Complete
         └─ Show: "3/3 completed"
```

**Queue Item Structure:**
```typescript
interface QueuedDocument {
  id: string;           // UUID for tracking
  file: File;           // Original File object
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;     // 0-100%
  error?: string;       // Error message if failed
  result?: CheatSheetSection[];  // Generated content
  startTime?: number;   // Timestamp when processing started
}
```

**Rate Limiting Logic:**
```typescript
const REQUEST_INTERVAL = (60 / 15) * 1000; // 4000ms
// Enforced between consecutive API calls
// Respects 15 RPM free-tier limit
```

---

### 3. Offline Flashcard Flow

```
User Studies Flashcards
      │
      ├─ isOnline? (navigator.onLine)
      │
      ├─ YES (Online):
      │  └─ Direct API calls (existing behavior)
      │     └─ Update Firebase in real-time
      │
      └─ NO (Offline):
         └─ recordCardRatingOffline(cardId, updates)
            ├─ localStorage[flashcard_changes] += CardChange
            │  └─ Stores: cardId, operation, rating, timestamp
            ├─ Update UI immediately (optimistic update)
            └─ OfflineIndicator shows: "• X changes saved locally"
               └─ Updates every 5 seconds

Connection Restored
      │
      └─ OfflineIndicator: "Online • X pending changes"
         └─ User: "Sync Now" → onSyncClick()
            └─ markChangesAsSynced(cardIds)
               ├─ For each offline change:
               │  ├─ Call Firebase API (batch update)
               │  └─ Mark change as synced
               └─ Confirm: "Synced!" toast
```

**Change Tracking Structure:**
```typescript
interface CardChange {
  cardId: string;
  operation: 'rate' | 'update' | 'delete' | 'create';
  updates: {
    rating?: number;           // SRS rating (-1, 0, 1)
    difficulty?: number;       // 1-5 scale
    content?: string;          // For create/update
  };
  timestamp: number;
  synced: boolean;
}

// localStorage[`flashcard_changes_${userId}`] = CardChange[]
```

---

## 🏗️ Design Patterns

### 1. Utility Pattern (Pure Functions)

**Files:** `cacheManager.ts`, `batchQueueManager.ts`, `offlineFlashcardManager.ts`

Benefits:
- No side effects (deterministic)
- Easy to test
- Reusable across components
- localStorage operations isolated

```typescript
// Example: Pure function for cache
export const generateFileHash = async (file: File): Promise<string> => {
  // No state modifications, returns consistent hash
  return 'hash_' + btoa(/* ... */).substring(0, 32);
};
```

### 2. Context Pattern (State Management)

**File:** `contexts/CacheContext.tsx`

Benefits:
- Avoid prop drilling
- Centralized cache state
- Easy to extend (add new hooks)
- Follows existing AuthContext/ToastContext patterns

```typescript
// Usage: const { getCached, saveToCache } = useCache();
// Wraps entire app: <CacheProvider><App /></CacheProvider>
```

### 3. Modal Pattern (UI Components)

**Files:** `CacheDialog.tsx`, `BatchProcessingModal.tsx`, `OfflineIndicator.tsx`

Benefits:
- Consistent with existing modals
- Self-contained logic
- Reusable across pages
- Matches design system

```typescript
interface ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  // ... feature-specific props
}
```

### 4. Event-Driven Pattern (Online/Offline)

**Location:** `App.tsx` useEffect

Benefits:
- Automatic state sync
- No polling overhead
- Native browser API
- Proper cleanup

```typescript
useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

---

## 💾 State Management

### App.tsx State Variables

```typescript
// Cache-related
const [currentFileHash, setCurrentFileHash] = useState<string | null>(null);
const [isCacheDialogOpen, setIsCacheDialogOpen] = useState(false);

// Batch-related
const [isBatchProcessingModalOpen, setIsBatchProcessingModalOpen] = useState(false);

// Network-related
const [isOnline, setIsOnline] = useState(navigator.onLine);
```

**State Dependencies:**
- `currentFileHash` → Used by `CacheDialog` to retrieve cached content
- `isCacheDialogOpen` → Triggers dialog visibility
- `isBatchProcessingModalOpen` → Triggers batch modal visibility
- `isOnline` → Controls `OfflineIndicator` appearance and behavior

---

## 🔌 Integration Points

### File Upload Handler

```typescript
const handleFileSelect = async (selectedFile: File) => {
  // ... existing code ...
  
  // NEW: Generate hash and check cache
  const hash = await generateFileHash(selectedFile);
  setCurrentFileHash(hash);
  
  const cached = getCachedCheatSheet(hash);
  if (cached) {
    setIsCacheDialogOpen(true); // Show dialog
    return; // User will choose action
  }
  
  // Continue with normal flow if no cache
  handleFileSelect(selectedFile);
};
```

### Cheatsheet Generation Handler

```typescript
const handleGenerateCheatSheet = async (style: string) => {
  // ... existing generation code ...
  
  const content = await generateCheatSheet(file, style);
  
  // NEW: Cache the result
  if (currentFileHash) {
    const { cacheCheatSheet } = await import('./utils/cacheManager');
    cacheCheatSheet(currentFileHash, file.name, content, file.size);
  }
  
  // ... rest of existing code ...
};
```

### Component Rendering

```typescript
{/* CacheDialog - appears when cache found */}
<CacheDialog
  isOpen={isCacheDialogOpen}
  onUseCached={() => { /* load from cache */ }}
  onGenerateNew={() => { /* regenerate */ }}
/>

{/* BatchProcessingModal - shows queue progress */}
<BatchProcessingModal
  isOpen={isBatchProcessingModalOpen}
  queue={[]} // Will be wired to actual queue
/>

{/* OfflineIndicator - shows connection status */}
<OfflineIndicator
  isOnline={isOnline}
  onSyncClick={() => { /* sync offline changes */ }}
/>
```

---

## 🔄 Function Call Sequences

### Scenario: User uploads same file twice

```
1. User selects PDF (Chapter1.pdf)
   └─ handleFileSelect() called
   
2. Hash generated
   └─ generateFileHash(file) → "hash_abc123"
   
3. Cache checked
   └─ getCachedCheatSheet("hash_abc123") → returns content
   
4. Cache found!
   └─ setIsCacheDialogOpen(true)
   
5. Dialog appears
   └─ User sees: "Cached from 2 hours ago"
   
6a. User clicks "Use Cached"
    └─ getCachedCheatSheet("hash_abc123") again
    └─ setActiveSheet({ content, ... })
    └─ addToast("Loaded from cache - saved an API call!")
    
6b. User clicks "Generate New"
    └─ setIsCacheDialogOpen(false)
    └─ handleGenerateCheatSheet('Standard')
    └─ API call made
    └─ After success: cacheCheatSheet(...)
```

### Scenario: User goes offline, rates cards, goes back online

```
1. User online, studying flashcards
   └─ Connection drops
   
2. window 'offline' event fires
   └─ setIsOnline(false)
   
3. User rates a card (e.g., "Easy": 1)
   └─ recordCardRatingOffline(cardId, { rating: 1 })
   └─ Change saved to localStorage
   
4. OfflineIndicator updates
   └─ getUnsyncedChangeCount() → 1
   └─ Shows: "Offline Mode • 1 changes saved locally"
   
5. Connection restored
   └─ window 'online' event fires
   └─ setIsOnline(true)
   
6. OfflineIndicator updates
   └─ Shows: "Online • 1 pending changes"
   └─ "Sync Now" button appears
   
7. User clicks "Sync Now"
   └─ onSyncClick() triggered
   └─ getOfflineChanges() retrieves all changes
   └─ For each change: Firebase API call
   └─ markChangesAsSynced(cardIds)
   └─ localStorage cleared for synced items
```

---

## 📊 Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| generateFileHash | O(n) | n = file size (first 1KB read) |
| getCachedCheatSheet | O(1) | Direct localStorage lookup by key |
| cacheCheatSheet | O(1) | Direct localStorage write |
| addToBatchQueue | O(1) | Append to array |
| startBatchProcessing | O(n*m) | n = queue items, m = API time |
| recordCardRatingOffline | O(1) | Append to changes array |
| getUnsyncedChangeCount | O(n) | n = number of changes |

### Space Complexity

| Data Structure | Size | Notes |
|---|---|---|
| CacheEntry | ~50KB | Per cached cheatsheet |
| QueuedDocument | ~1-2KB | Per queued item |
| CardChange | ~500B | Per offline change |
| Total localStorage | <5MB | Browser quota safe |

---

## ✅ Error Handling

### Cache Errors
```typescript
try {
  const cached = getCachedCheatSheet(hash);
} catch (e) {
  // Corrupted cache entry
  console.error('Cache read error:', e);
  // Fall back to fresh generation
  return null;
}
```

### Network Errors (Offline)
```typescript
// Automatic: All flashcard ops recorded locally
recordCardRatingOffline(cardId, updates);
// No API call attempted, no error thrown
```

### Sync Errors
```typescript
// Sync fails (network issue)
addToast('Sync failed - will retry when online', 'error');
// Changes remain in localStorage, not marked as synced
```

---

## 🧪 Testing Strategy

### Unit Tests (Per Utility)

```typescript
// cacheManager.ts
describe('generateFileHash', () => {
  it('should return consistent hash for same file', async () => {
    const hash1 = await generateFileHash(file);
    const hash2 = await generateFileHash(file);
    expect(hash1).toBe(hash2);
  });
  
  it('should return different hash for different files', async () => {
    const hash1 = await generateFileHash(file1);
    const hash2 = await generateFileHash(file2);
    expect(hash1).not.toBe(hash2);
  });
});

// batchQueueManager.ts
describe('startBatchProcessing', () => {
  it('should enforce 4-second intervals', async () => {
    // Mock API, measure intervals
    // Verify 4000ms between requests
  });
});
```

### Integration Tests

```typescript
// App.tsx + utilities
describe('Cache Dialog Flow', () => {
  it('should show dialog when cache exists', () => {
    // Render App with cached file
    // Upload same file
    // Assert CacheDialog appears
  });
});
```

### E2E Tests

```typescript
// Full user workflows
describe('Offline Flashcard Workflow', () => {
  it('should sync changes after reconnection', () => {
    // Go online
    // Study flashcards
    // Go offline
    // Rate cards
    // Go online
    // Sync
    // Verify Firebase updated
  });
});
```

---

## 🚀 Scalability Considerations

### For Paid Tier
- Remove API key rotation requirement
- Increase rate limits (no 4-second interval)
- Larger cache quotas
- Enhanced analytics

### For Multi-Device Sync
- Use Firebase Realtime Database instead of localStorage
- Sync cache across devices
- Conflict resolution for offline changes

### For Team Features
- Shared cache (for team studies)
- Collaborative offline mode
- Audit trail of changes

---

## 🔐 Security Considerations

### localStorage Data
- ✅ No sensitive data stored (content is public anyway)
- ✅ No authentication tokens
- ✅ No passwords
- ⚠️ Cache is user-visible (expected behavior)

### Offline Changes
- ✅ Changes stored locally until synced
- ✅ No loss of data if sync fails
- ✅ User in control of sync timing
- ⚠️ No encryption (localStorage limitation)

### Rate Limiting
- ✅ Enforced client-side (4-second intervals)
- ⚠️ Server-side rate limiting still required (for enforcement)

---

## 📈 Monitoring & Analytics

### Metrics to Track
1. **Cache Hit Rate:** Percentage of re-uploads that use cache
2. **API Call Reduction:** Actual vs. expected savings
3. **Offline Usage:** % of users using offline mode
4. **Sync Success Rate:** % of offline changes synced successfully
5. **localStorage Usage:** Average cache size per user
6. **Rate Limit Compliance:** 429 error frequency

### Dashboard Queries
```sql
-- Cache hit rate
SELECT COUNT(*) as cache_hits WHERE used_cache = true
/ COUNT(*) as total_uploads

-- Average savings
SELECT AVG(api_calls_saved) FROM cache_usage

-- Offline session count
SELECT COUNT(DISTINCT user_id) FROM offline_sessions
```

---

## 🎯 Future Improvements

### Short Term (1-2 weeks)
- [ ] Add "Clear Cache" button to Settings
- [ ] Show cache size in UI
- [ ] Cache hit notification

### Medium Term (1-2 months)
- [ ] Compression for cached data
- [ ] Multi-device cache sync
- [ ] Intelligent cache prefetching

### Long Term (3+ months)
- [ ] Analytics dashboard
- [ ] ML-based cache prediction
- [ ] Collaborative caching
- [ ] Cloud backup of offline changes

---

This architecture provides a solid foundation for free-tier cost optimization while remaining flexible for future enhancements.
