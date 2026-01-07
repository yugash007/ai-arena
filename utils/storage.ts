import type { SavedCheatSheet } from '../types';

const SHEETS_KEY = 'ai_cheat_sheets';
const ACTIVE_SHEET_KEY = 'ai_cheat_sheet_active';

type ActiveSheet = (Omit<SavedCheatSheet, 'id'> & { id?: string });

// --- Active Sheet (Session) Storage ---

export const getSavedActiveSheet = (): ActiveSheet | null => {
  try {
    const savedData = localStorage.getItem(ACTIVE_SHEET_KEY);
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error("Failed to retrieve active sheet from local storage:", error);
    return null;
  }
};

export const saveActiveSheet = (sheet: ActiveSheet | null): void => {
  try {
    if (sheet) {
      localStorage.setItem(ACTIVE_SHEET_KEY, JSON.stringify(sheet));
    } else {
      localStorage.removeItem(ACTIVE_SHEET_KEY);
    }
  } catch (error) {
    console.error("Failed to save active sheet to local storage:", error);
  }
};


// --- Cheat Sheet Storage ---

export const getSavedCheatSheets = (): SavedCheatSheet[] => {
  try {
    const savedData = localStorage.getItem(SHEETS_KEY);
    return savedData ? JSON.parse(savedData) : [];
  } catch (error) {
    console.error("Failed to retrieve saved cheat sheets from local storage:", error);
    return [];
  }
};

export const saveCheatSheets = (sheets: SavedCheatSheet[]): void => {
  try {
    localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets));
  } catch (error) {
    console.error("Failed to save cheat sheets to local storage:", error);
  }
};
