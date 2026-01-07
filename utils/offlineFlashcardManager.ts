import type { FlashCard } from '../types';

/**
 * Offline Flashcard Manager
 * All flashcard operations work offline with automatic syncing when online
 */

const OFFLINE_CARDS_KEY = 'ai_arena_offline_cards';
const CARD_CHANGES_KEY = 'ai_arena_card_changes';

interface CardChange {
  cardId: string;
  operation: 'rate' | 'update' | 'delete' | 'create';
  data: any;
  timestamp: number;
  synced: boolean;
}

/**
 * Get flashcards with offline support
 * Returns cards with any pending offline changes applied
 */
export const getOfflineFlashcards = (cards: FlashCard[]): FlashCard[] => {
  try {
    const changes = getOfflineChanges();
    let resultCards = [...cards];

    // Apply pending changes
    changes.forEach((change: CardChange) => {
      if (change.operation === 'rate') {
        const cardIndex = resultCards.findIndex(c => c.id === change.cardId);
        if (cardIndex !== -1) {
          resultCards[cardIndex] = {
            ...resultCards[cardIndex],
            ...change.data,
          };
        }
      } else if (change.operation === 'delete') {
        resultCards = resultCards.filter(c => c.id !== change.cardId);
      } else if (change.operation === 'create') {
        resultCards.push(change.data as FlashCard);
      }
    });

    return resultCards;
  } catch (error) {
    console.warn('Failed to apply offline changes:', error);
    return cards;
  }
};

/**
 * Record a card rating offline
 * Will sync when online
 */
export const recordCardRatingOffline = (
  cardId: string,
  updates: Partial<FlashCard>
): void => {
  try {
    const changes = getOfflineChanges();
    changes.push({
      cardId,
      operation: 'rate',
      data: updates,
      timestamp: Date.now(),
      synced: false,
    });
    saveOfflineChanges(changes);
  } catch (error) {
    console.warn('Failed to record offline rating:', error);
  }
};

/**
 * Record a card deletion offline
 */
export const recordCardDeletionOffline = (cardId: string): void => {
  try {
    const changes = getOfflineChanges();
    changes.push({
      cardId,
      operation: 'delete',
      data: null,
      timestamp: Date.now(),
      synced: false,
    });
    saveOfflineChanges(changes);
  } catch (error) {
    console.warn('Failed to record offline deletion:', error);
  }
};

/**
 * Record a new card created offline
 */
export const createCardOffline = (card: FlashCard): void => {
  try {
    const changes = getOfflineChanges();
    changes.push({
      cardId: card.id,
      operation: 'create',
      data: card,
      timestamp: Date.now(),
      synced: false,
    });
    saveOfflineChanges(changes);
  } catch (error) {
    console.warn('Failed to create offline card:', error);
  }
};

/**
 * Get all pending offline changes
 */
export const getOfflineChanges = (): CardChange[] => {
  try {
    const changes = localStorage.getItem(CARD_CHANGES_KEY);
    return changes ? JSON.parse(changes) : [];
  } catch {
    return [];
  }
};

/**
 * Mark changes as synced after successfully uploading to server
 */
export const markChangesAsSynced = (cardIds: string[]): void => {
  try {
    const changes = getOfflineChanges();
    const updated = changes.map(change => 
      cardIds.includes(change.cardId) 
        ? { ...change, synced: true }
        : change
    );
    saveOfflineChanges(updated);
  } catch (error) {
    console.warn('Failed to mark changes as synced:', error);
  }
};

/**
 * Clear synced changes from offline storage
 */
export const clearSyncedChanges = (): void => {
  try {
    const changes = getOfflineChanges();
    const unsynced = changes.filter(c => !c.synced);
    saveOfflineChanges(unsynced);
  } catch (error) {
    console.warn('Failed to clear synced changes:', error);
  }
};

/**
 * Get unsynced changes count
 */
export const getUnsyncedChangeCount = (): number => {
  return getOfflineChanges().filter(c => !c.synced).length;
};

/**
 * Check if there are pending changes
 */
export const hasPendingChanges = (): boolean => {
  return getUnsyncedChangeCount() > 0;
};

/**
 * Internal: Save changes to localStorage
 */
const saveOfflineChanges = (changes: CardChange[]): void => {
  localStorage.setItem(CARD_CHANGES_KEY, JSON.stringify(changes));
};

/**
 * Clear all offline changes (use with caution)
 */
export const clearAllOfflineChanges = (): void => {
  localStorage.removeItem(CARD_CHANGES_KEY);
};

/**
 * Get offline sync statistics
 */
export const getOfflineSyncStats = () => {
  const changes = getOfflineChanges();
  const synced = changes.filter(c => c.synced).length;
  const unsynced = changes.filter(c => !c.synced).length;

  return {
    totalChanges: changes.length,
    synced,
    unsynced,
    lastChange: changes.length > 0 ? changes[changes.length - 1].timestamp : null,
  };
};
