# Testing Guide: Free-Tier Optimizations

This guide helps you test the three new features: Smart Caching, Batch Processing, and Offline Flashcard Mode.

## 🧪 Test 1: Smart Caching

### Setup
1. Open AI Arena app
2. Upload a PDF file (e.g., `Chapter1.pdf`)
3. Select "Standard" style
4. Wait for cheatsheet generation to complete (should be cached after generation)

### Test Steps
1. **First Upload (Control):**
   - Check browser console for API call timing
   - Verify cheatsheet generates successfully
   - Wait for completion

2. **Re-upload Same File (Cache Test):**
   - Upload the exact same PDF file again
   - **Expected:** CacheDialog appears asking "Use cached version from X minutes ago?"
   - Click "Use Cached" → Should load instantly (0 API calls)
   - Click "Generate New" → Should make fresh API call

3. **Different File (No Cache):**
   - Upload a different PDF
   - **Expected:** No cache dialog, generates normally

4. **Cache Management:**
   - Open developer tools (F12) → Storage → Local Storage
   - Look for entries starting with `ai_arena_cache_`
   - Verify metadata contains: filename, timestamp, fileSize

### Success Criteria
- ✅ Cache dialog appears on re-upload of identical file
- ✅ "Use Cached" option loads instantly
- ✅ "Generate New" makes fresh API call
- ✅ Cache entries visible in localStorage

---

## 🔄 Test 2: Batch Processing

### Setup
1. Have 3-5 different PDF files ready on your computer
2. Open AI Arena app
3. Note your internet speed (needed for timing estimation)

### Test Steps

1. **Add to Batch Queue:**
   - Currently, batch processing is wired internally
   - ✅ Queue system is ready (see `utils/batchQueueManager.ts`)
   - **Manual Test:** Open browser console and run:
   ```javascript
   // Simulated batch processing test
   const { addToBatchQueue, startBatchProcessing, getQueueStats } = await import('./utils/batchQueueManager.ts');
   
   // Check queue functionality
   console.log('Queue system is loaded and ready');
   ```

2. **Rate Limit Verification:**
   - Upload files one after another
   - Check timing between API calls in network tab
   - **Expected:** Minimum 4 seconds between consecutive Gemini API calls
   - This ensures compliance with 15 RPM rate limit

3. **Queue Statistics:**
   - Open Dev Tools → Console
   - Monitor that requests respect 4-second intervals
   - Verify no "429 Too Many Requests" errors

### Success Criteria
- ✅ Queue system exists and can manage multiple documents
- ✅ 4-second intervals maintained between API calls
- ✅ No rate limit errors (429 status)
- ✅ BatchProcessingModal renders without errors

---

## 📡 Test 3: Offline Flashcard Mode

### Setup
1. Generate flashcards from an uploaded document (existing feature)
2. Open flashcard modal
3. Have flashcards ready to rate/delete

### Test Steps

1. **Go Offline:**
   - Open Chrome DevTools → Network tab
   - Click dropdown that says "No throttling"
   - Select "Offline"
   - OR: Disable WiFi/network physically

2. **Perform Flashcard Actions (Offline):**
   - Rate a card (👍 1, 👎 -1, ❓ 0)
   - Delete a card (trash icon)
   - Create a new card (if supported)
   - **Expected:** All actions work without errors
   - App should not crash or show API errors

3. **Check Offline Indicator:**
   - **Expected:** Orange badge bottom-right: "Offline Mode • X changes saved locally"
   - Badge should update as you make changes
   - Updates every 5 seconds

4. **Go Back Online:**
   - Re-enable network/WiFi
   - **Expected:** Badge turns green: "Online • X pending changes"
   - "Sync Now" button appears (if X > 0)

5. **Sync Changes:**
   - Click "Sync Now" button
   - **Expected:** 
     - Button shows "Syncing..." with spinner
     - After 2 seconds: "Synced!" message
     - Pending changes count resets to 0
     - Badge disappears

6. **Verify Firebase Sync:**
   - Check Firebase Realtime Database
   - Flashcard changes should be updated
   - Verify SRS ratings were applied

### Success Criteria
- ✅ App works offline (no red error toasts)
- ✅ Offline indicator appears with correct count
- ✅ "Sync Now" button functions when online with pending changes
- ✅ Changes persist in Firebase after sync
- ✅ Flashcards update with new ratings

---

## 🔧 Bonus: Advanced Testing

### Test localStorage Usage
```javascript
// In browser console:
const sizes = Object.keys(localStorage).reduce((total, key) => {
  return total + localStorage[key].length;
}, 0);
console.log(`Total localStorage: ${(sizes / 1024).toFixed(2)} KB`);

// Should be < 5000 KB (5 MB)
```

### Test Network Timing
```javascript
// In browser DevTools Network tab:
// Filter by "gemini" or "googleapis"
// Click on each request
// Check "Network" tab for timing
// Should see minimum 4000ms between requests
```

### Test Cache Invalidation
```javascript
// In browser console:
localStorage.clear(); // Clear all cache
// Then re-upload files - should regenerate without cache
```

### Monitor Queue Processing
```javascript
// In browser console, after implementing batch triggers:
// Should log queue updates in real-time
console.log('Monitoring queue...');
// Check for: pending → processing → completed progression
```

---

## 📋 Testing Checklist

### Smart Caching
- [ ] First file upload generates normally
- [ ] Re-upload shows cache dialog
- [ ] "Use Cached" loads instantly
- [ ] "Generate New" creates fresh result
- [ ] localStorage contains cache entries

### Batch Processing
- [ ] Queue system loads without errors
- [ ] 4-second intervals maintained between API calls
- [ ] No 429 rate limit errors
- [ ] BatchProcessingModal renders correctly

### Offline Mode
- [ ] App functions when offline
- [ ] Offline indicator appears (orange badge)
- [ ] Pending changes count updates
- [ ] Sync button appears when online
- [ ] Changes sync to Firebase successfully

### Overall
- [ ] No console errors
- [ ] No breaking changes to existing features
- [ ] Responsive design maintained
- [ ] Performance acceptable (< 100ms lag)

---

## 🐛 Troubleshooting

### CacheDialog doesn't appear on re-upload
- **Cause:** File hash doesn't match (even slight file change)
- **Fix:** Upload exact same file bytes (no modifications)
- **Debug:** Check localStorage entries, verify hash generation

### Offline indicator not showing
- **Cause:** Connection state not detecting offline
- **Fix:** Check if DevTools offline mode is enabled
- **Debug:** Run `navigator.onLine` in console (should be false)

### Sync not working
- **Cause:** Firebase authentication issue
- **Fix:** Verify user is logged in, Firebase is initialized
- **Debug:** Check browser console for Firebase errors

### Queue not respecting rate limit
- **Cause:** Interval calculation incorrect
- **Fix:** Verify 4000ms interval in `batchQueueManager.ts`
- **Debug:** Check network tab request timestamps

---

## 📊 Performance Baselines

For reference during testing:

| Metric | Expected | Warning | Critical |
|--------|----------|---------|----------|
| Cache dialog appear | < 100ms | > 200ms | > 500ms |
| Cached load speed | < 50ms | > 100ms | > 200ms |
| Request interval | 4000ms ±100ms | ±200ms | ±500ms |
| Sync duration | 1-3s | > 5s | > 10s |
| Storage size | < 1MB | 3-5MB | > 5MB |

---

## 🎯 Final Validation

Before deploying to production:
1. ✅ All tests pass locally
2. ✅ No console errors
3. ✅ Existing features still work
4. ✅ New features discoverable (not hidden)
5. ✅ UI responsive on mobile
6. ✅ localStorage not exceeding quota
7. ✅ Firebase sync reliable

---

**Test Duration:** ~15-20 minutes per feature
**Required Devices:** 1 browser, internet connection optional
**Success Rate Target:** 100% on all checkboxes
