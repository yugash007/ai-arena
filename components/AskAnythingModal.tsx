
import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { QuestionIcon } from './icons/QuestionIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { BookIcon } from './icons/BookIcon';
import { parseMarkdown } from '../utils/markdownParser';

interface AskAnythingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAsk: (question: string, mode: 'standard' | 'socratic', useLibrary: boolean) => void;
    isLoading: boolean;
    answer: string | null;
    sources?: any[];
    question: string | null;
    onAskAnother: () => void;
    contextName?: string | null;
    hasLibrary: boolean;
}

declare global {
    interface Window {
        renderMathInElement?: (element: HTMLElement, options?: any) => void;
        katex?: {
            ParseError: any;
        };
    }
}

const AskAnythingModal: React.FC<AskAnythingModalProps> = ({ isOpen, onClose, onAsk, isLoading, answer, sources, question, onAskAnother, contextName, hasLibrary }) => {
    const [localQuestion, setLocalQuestion] = useState('');
    const [mode, setMode] = useState<'standard' | 'socratic'>('standard');
    const [useLibrary, setUseLibrary] = useState(false);
    const answerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setLocalQuestion('');
            setMode('standard');
            setUseLibrary(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (answer && answerContainerRef.current && window.renderMathInElement && document.compatMode === 'CSS1Compat') {
            try {
                window.renderMathInElement(answerContainerRef.current, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.error("KaTeX rendering error:", error);
            }
        }
    }, [answer]);

    if (!isOpen) return null;

    const handleAsk = () => {
        if (localQuestion.trim()) {
            onAsk(localQuestion.trim(), mode, useLibrary);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center p-0 md:p-6 no-print" aria-modal="true" role="dialog">
            <div className="bg-background border border-border md:rounded-xl shadow-2xl w-full h-full md:max-w-5xl flex flex-col overflow-hidden animate-fade-in">
                
                {/* Header */}
                <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-background/95 backdrop-blur z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground text-background rounded-lg">
                            <QuestionIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">
                                Neural Query
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium">
                                {useLibrary ? 'Context: Full Library' : contextName ? `Context: ${contextName}` : 'Context: Web Knowledge'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                {/* Main Content Area */}
                <div className="flex-grow overflow-hidden relative z-0 flex flex-col bg-secondary/30">
                    {isLoading ? (
                         /* Loading State */
                         <div className="flex flex-col items-center justify-center h-full text-center p-8">
                             <SpinnerIcon className="w-8 h-8 text-foreground mb-4" />
                             <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Synthesizing</h3>
                             <p className="mt-2 text-xs text-muted-foreground font-mono">Accessing neural pathways...</p>
                         </div>
                    ) : answer ? (
                        /* Result State */
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12">
                            <div className="max-w-3xl mx-auto space-y-12">
                                {/* User Query Block */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Query</span>
                                    <h3 className="text-2xl font-medium text-foreground leading-relaxed">
                                        "{question}"
                                    </h3>
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full bg-border"></div>

                                {/* AI Answer Block */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <SparklesIcon className="w-4 h-4 text-foreground" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Answer</span>
                                    </div>
                                    <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground leading-relaxed" 
                                        ref={answerContainerRef}
                                        dangerouslySetInnerHTML={{ __html: parseMarkdown(answer, { handleLatex: true }) }} 
                                    />
                                    
                                    {/* Sources Section */}
                                    {sources && sources.length > 0 && (
                                        <div className="mt-12 pt-8 border-t border-border">
                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                                                Sources
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {sources.map((source, idx) => (
                                                    <a 
                                                        key={idx} 
                                                        href={source.web?.uri} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-foreground/50 transition-all duration-200"
                                                    >
                                                        <div className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-foreground">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-foreground truncate">
                                                                {source.web?.title || "External Source"}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
                                                                {source.web?.uri}
                                                            </p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Input State */
                        <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 w-full">
                            <div className="w-full max-w-2xl space-y-8">
                                <div className="text-center space-y-2">
                                    <h3 className="text-3xl font-bold text-foreground tracking-tight">
                                        Ask Anything
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Query {useLibrary ? 'your entire library' : (contextName || "the current context")} for insights.
                                    </p>
                                </div>
                                
                                {/* Controls */}
                                <div className="flex justify-center gap-2">
                                     <button
                                        onClick={() => setMode(mode === 'standard' ? 'socratic' : 'standard')}
                                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                            mode === 'socratic' 
                                            ? 'bg-foreground text-background border-foreground' 
                                            : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                     >
                                        {mode === 'socratic' ? 'Socratic Mode' : 'Standard Mode'}
                                     </button>

                                     {hasLibrary && (
                                         <button
                                            onClick={() => setUseLibrary(!useLibrary)}
                                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                                useLibrary
                                                ? 'bg-foreground text-background border-foreground' 
                                                : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                            }`}
                                         >
                                            {useLibrary ? 'Full Library' : 'Current Doc'}
                                         </button>
                                     )}
                                </div>

                                <div className="relative bg-card rounded-xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-foreground transition-all">
                                    <textarea
                                        value={localQuestion}
                                        onChange={(e) => setLocalQuestion(e.target.value)}
                                        placeholder="Type your question..."
                                        className="w-full bg-transparent p-6 text-lg text-foreground placeholder-muted-foreground focus:outline-none resize-none min-h-[160px]"
                                    />
                                    <div className="flex justify-between items-center px-4 pb-4">
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                            {localQuestion.length} chars
                                        </span>
                                        <button
                                            onClick={handleAsk}
                                            disabled={isLoading || !localQuestion.trim()}
                                            className="px-6 py-2 bg-foreground text-background font-bold text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            <span>Query</span>
                                            <ArrowRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Suggestion Chips */}
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['Summarize findings', 'Explain formulas', 'Counter-arguments?', 'Study guide'].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setLocalQuestion(suggestion)}
                                            className="px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer (Only for Result State to allow Reset) */}
                {answer && (
                    <footer className="px-6 py-4 bg-background border-t border-border flex justify-end gap-3 shrink-0">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={onAskAnother}
                            className="px-4 py-2 text-sm font-bold bg-foreground text-background rounded-lg hover:opacity-90 transition-all"
                        >
                            New Query
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default AskAnythingModal;
