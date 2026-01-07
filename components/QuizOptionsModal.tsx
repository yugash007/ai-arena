import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { QuizIcon } from './icons/QuizIcon';

interface QuizOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (numQuestions: number) => void;
}

const options = [
    { value: 5, label: "Quick Warmup", description: "Rapid fire check. Good for quick review." },
    { value: 10, label: "Standard Drill", description: "Balanced session. The gold standard." },
    { value: 15, label: "Deep Dive", description: "Extensive coverage of edge cases." },
    { value: 20, label: "Exam Simulation", description: "Full endurance test. High difficulty." },
];

const QuizOptionsModal: React.FC<QuizOptionsModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [numQuestions, setNumQuestions] = useState(10);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print" aria-modal="true" role="dialog">
            <div className="card-glow rounded-2xl shadow-2xl w-full max-w-lg modal-enter-active bg-background border border-border flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-6 border-b border-border bg-background/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground/10 rounded-lg text-foreground">
                            <QuizIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Diagnostic Parameters</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-6 bg-secondary/10">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">
                        Select Intensity
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt) => {
                            const isSelected = numQuestions === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setNumQuestions(opt.value)}
                                    className={`relative w-full group flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 outline-none
                                        ${isSelected 
                                            ? 'border-foreground bg-foreground/5 shadow-sm' 
                                            : 'border-border bg-secondary/30 hover:bg-secondary hover:border-foreground/30'
                                        }
                                    `}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm border transition-colors shrink-0
                                        ${isSelected ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground'}
                                    `}>
                                        {opt.value}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <span className={`block text-sm font-bold transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                            {opt.label}
                                        </span>
                                        <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                                            {opt.description}
                                        </span>
                                    </div>

                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                                         ${isSelected ? 'border-foreground' : 'border-muted-foreground/30'}
                                    `}>
                                        {isSelected && <div className="w-2 h-2 bg-foreground rounded-full" />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <footer className="p-6 bg-background border-t border-border flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onGenerate(numQuestions)}
                        className="px-6 py-2.5 text-sm font-bold bg-foreground text-background rounded-xl hover:opacity-90 transition-all shadow-lg shadow-foreground/10"
                    >
                        Start Diagnostic
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default QuizOptionsModal;