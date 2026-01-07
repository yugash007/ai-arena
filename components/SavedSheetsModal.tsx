import React from 'react';
import type { SavedCheatSheet } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SavedSheetsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sheets: SavedCheatSheet[];
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

const SavedSheetsModal: React.FC<SavedSheetsModalProps> = ({ isOpen, onClose, sheets, onLoad, onDelete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 no-print" aria-modal="true" role="dialog">
            <div 
                className="card-glow rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col modal-enter-active"
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--card-border)] shrink-0">
                    <h2 className="text-lg font-bold text-slate-100">My Saved Cheat Sheets</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-700" aria-label="Close modal">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    {sheets.length === 0 ? (
                        <div className="text-center p-8 text-slate-400">
                            <p className="font-semibold">No saved sheets yet!</p>
                            <p className="mt-2 text-sm">Generate a cheat sheet and save it to see it here.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {sheets.sort((a, b) => b.timestamp - a.timestamp).map(sheet => (
                                <li key={sheet.id} className="p-3 bg-slate-800/40 rounded-lg flex justify-between items-center group transition-all duration-200 hover:scale-[1.02] hover:bg-slate-700/60">
                                    <div>
                                        <p className="font-semibold text-slate-100">{sheet.filename}</p>
                                        <p className="text-xs text-slate-400">
                                            Saved on {new Date(sheet.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <button 
                                            onClick={() => onLoad(sheet.id)}
                                            className="px-3 py-1 text-sm font-semibold bg-cyan-900/50 text-cyan-300 rounded-md hover:bg-cyan-800/60 transition-colors"
                                        >
                                            Load
                                        </button>
                                        <button 
                                            onClick={() => onDelete(sheet.id)}
                                            className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-900/50"
                                            title="Delete Sheet"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SavedSheetsModal;