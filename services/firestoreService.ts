
import { database } from '../firebase';
import { 
  ref, 
  set, 
  get, 
  remove, 
  child
} from 'firebase/database';
import type { SavedCheatSheet } from '../types';

// Helper to remove undefined values which Firebase Realtime Database dislikes
const sanitizeForFirebase = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj));
};

export const saveSheetToCloud = async (userId: string, sheet: SavedCheatSheet) => {
  try {
    const cleanSheet = sanitizeForFirebase(sheet);
    
    // 1. Always save to the user's private directory (Critical)
    // This is the source of truth for the user.
    const userSheetRef = ref(database, `users/${userId}/cheatSheets/${sheet.id}`);
    await set(userSheetRef, cleanSheet);

    // 2. Manage public directory presence (Best Effort)
    // We wrap this in try-catch so that if public permissions fail (e.g. bans, rules), 
    // the user still saves their data locally/privately.
    const publicSheetRef = ref(database, `public_sheets/${sheet.id}`);
    
    try {
        if (sheet.visibility === 'public') {
            const publicData = { ...cleanSheet, authorId: userId };
            await set(publicSheetRef, publicData);
        } else {
            // If private, remove from public_sheets
            // Using remove() on a non-existent path is a no-op, but permissions might block it.
            await remove(publicSheetRef);
        }
    } catch (publicError) {
        console.warn("Public sheet sync failed (ignoring to preserve user data):", publicError);
    }

  } catch (error) {
    console.error("Error saving sheet to Realtime Database:", error);
    throw error;
  }
};

export const getSheetsFromCloud = async (userId: string): Promise<SavedCheatSheet[]> => {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `users/${userId}/cheatSheets`));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const sheets = Object.values(data) as SavedCheatSheet[];
      return sheets.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching sheets from Realtime Database:", error);
    throw error;
  }
};

export const deleteSheetFromCloud = async (userId: string, sheetId: string) => {
  try {
    // 1. Delete from user path (Critical)
    await remove(ref(database, `users/${userId}/cheatSheets/${sheetId}`));

    // 2. Delete from public path (Best Effort)
    try {
        await remove(ref(database, `public_sheets/${sheetId}`));
    } catch (e) {
        console.warn("Public sheet deletion warning:", e);
    }
  } catch (error) {
    console.error("Error deleting sheet from Realtime Database:", error);
    throw error;
  }
};

export const publishSheet = async (userId: string, sheet: SavedCheatSheet, authorName?: string) => {
    try {
        const publicSheet: SavedCheatSheet = { 
            ...sheet, 
            visibility: 'public', 
            authorId: userId,
            authorName: authorName || sheet.authorName || 'Anonymous'
        };
        const cleanSheet = sanitizeForFirebase(publicSheet);
        
        // 1. Attempt to write to public_sheets FIRST.
        // If this fails (Permission Denied), we abort the whole process so the UI doesn't show "Public" incorrectly.
        const publicRef = ref(database, `public_sheets/${sheet.id}`);
        await set(publicRef, cleanSheet);

        // 2. If public write succeeded, update the user's private record
        const userRef = ref(database, `users/${userId}/cheatSheets/${sheet.id}`);
        await set(userRef, cleanSheet);
        
        return publicSheet;
    } catch (error: any) {
        console.error("Error publishing sheet:", error);
        if (error.message && error.message.includes('PERMISSION_DENIED')) {
             throw new Error("Permission denied: Unable to publish to public directory.");
        }
        throw error;
    }
};

export const unpublishSheet = async (userId: string, sheetId: string) => {
    try {
        const sheetRef = ref(database, `users/${userId}/cheatSheets/${sheetId}`);
        const snapshot = await get(sheetRef);
        
        if (snapshot.exists()) {
            const sheet = snapshot.val();
            const privateSheet: SavedCheatSheet = { ...sheet, visibility: 'private' };
            const cleanSheet = sanitizeForFirebase(privateSheet);

            // 1. Update user copy to private (Critical)
            await set(ref(database, `users/${userId}/cheatSheets/${sheetId}`), cleanSheet);

            // 2. Try to remove public copy (Best Effort)
            try {
                await remove(ref(database, `public_sheets/${sheetId}`));
            } catch (e) {
                console.warn("Public sheet unpublish warning (ignoring):", e);
            }
            
            return privateSheet;
        }
        throw new Error("Sheet not found");
    } catch (error) {
        console.error("Error unpublishing sheet:", error);
        throw error;
    }
};

export const getPublicSheet = async (sheetId: string): Promise<SavedCheatSheet | null> => {
    try {
        const snapshot = await get(child(ref(database), `public_sheets/${sheetId}`));
        if (snapshot.exists()) {
            return snapshot.val() as SavedCheatSheet;
        }
        return null;
    } catch (error) {
        console.error("Error fetching public sheet:", error);
        return null;
    }
};
