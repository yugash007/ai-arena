import React, { useState } from 'react';
import type { OutputStyle } from '../types';
import OutputStyleSelector from './OutputStyleSelector';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CodeIcon } from './icons/CodeIcon';

interface OutputStyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (style: OutputStyle) => void;
    isLoading: boolean;
}

const OutputStyleModal: React.FC<OutputStyleModalProps> = ({ isOpen, onClose, onGenerate, isLoading }) => {
    const [selectedStyle, setSelectedStyle] = useState<OutputStyle>('Standard');

    if (!isOpen) return null;

    const handleGenerateClick = () => {
        onGenerate(selectedStyle);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print" aria-modal="true" role="dialog">
            <div 
                className="card-glow rounded-2xl shadow-2xl w-full max-w-lg modal-enter-active bg-background border border-border flex flex-col overflow-hidden"
            >
                <header className="flex justify-between items-center p-6 border-b border-border bg-background/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground/10 rounded-lg text-foreground">
                            <CodeIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Intelligence Parameters</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-6 bg-secondary/10 flex-grow overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">
                        Select Analysis Matrix
                    </p>
                    <OutputStyleSelector selectedStyle={selectedStyle} onStyleChange={setSelectedStyle} />
                </div>

                <footer className="p-6 bg-background border-t border-border flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerateClick}
                        disabled={isLoading}
                        className={`flex items-center justify-center px-6 py-2.5 text-sm font-bold bg-foreground text-background rounded-xl hover:opacity-90 disabled:opacity-70 disabled:cursor-wait transition-all shadow-lg shadow-foreground/10 ${isLoading ? 'btn-loading' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : 'Initialize'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default OutputStyleModal;