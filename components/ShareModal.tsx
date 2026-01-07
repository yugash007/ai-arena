
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { LockIcon } from './icons/LockIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { useAuth } from '../contexts/AuthContext';
import { publishSheet, unpublishSheet } from '../services/firestoreService';
import type { SavedCheatSheet } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    sheet: SavedCheatSheet;
    onUpdateSheet: (updatedSheet: SavedCheatSheet) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, sheet, onUpdateSheet }) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [isPublic, setIsPublic] = useState(sheet.visibility === 'public');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setIsPublic(sheet.visibility === 'public');
    }, [sheet.visibility]);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}?share=${sheet.id}`;

    const handleToggleVisibility = async () => {
        if (!currentUser) {
            addToast("You must be logged in to share sheets.", "error");
            return;
        }

        setIsLoading(true);
        try {
            if (!isPublic) {
                const authorName = currentUser.displayName || sheet.authorName || 'Anonymous';
                const updated = await publishSheet(currentUser.uid, sheet, authorName);
                onUpdateSheet(updated);
                setIsPublic(true);
                addToast("Sheet is now public.", "success");
            } else {
                const updated = await unpublishSheet(currentUser.uid, sheet.id);
                if (updated) onUpdateSheet(updated);
                setIsPublic(false);
                addToast("Sheet is now private.", "success");
            }
        } catch (error: any) {
            addToast("Failed to update visibility: " + error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print" aria-modal="true" role="dialog">
            <div className="card-glow rounded-2xl shadow-2xl w-full max-w-md bg-background border border-border flex flex-col overflow-hidden animate-fade-in">
                <header className="flex justify-between items-center p-6 border-b border-border bg-background/50">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">Share Intelligence</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-6 space-y-6">
                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${isPublic ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                                {isPublic ? <GlobeIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">
                                    {isPublic ? 'Public Access' : 'Private Access'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {isPublic ? 'Anyone with the link can view' : 'Only you can view this sheet'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleToggleVisibility}
                            disabled={isLoading}
                            className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-500' : 'bg-slate-600'} ${isLoading ? 'opacity-50' : ''}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {/* Link Section */}
                    {isPublic && (
                        <div className="animate-fade-in">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                                Secure Link
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    readOnly 
                                    value={shareUrl}
                                    className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none select-all"
                                />
                                <button 
                                    onClick={handleCopy}
                                    className="px-3 py-2 bg-foreground text-background font-bold text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 min-w-[80px] justify-center"
                                >
                                    {copied ? <CheckCircleIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
