
import React, { Fragment, useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { parseMarkdown } from '../utils/markdownParser';

interface ExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    explanation?: string;
    isLoading: boolean;
}

declare global {
    interface Window {
        renderMathInElement?: (element: HTMLElement, options?: any) => void;
        katex?: {
            ParseError: any;
        };
    }
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ isOpen, onClose, title, explanation, isLoading }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && explanation && containerRef.current && window.renderMathInElement && document.compatMode === 'CSS1Compat') {
            try {
                window.renderMathInElement(containerRef.current, {
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
    }, [isOpen, explanation]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 no-print" aria-modal="true" role="dialog">
            <div 
                className="card-glow rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col modal-enter-active"
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--card-border)] shrink-0">
                    <h2 className="text-lg font-bold text-slate-100">AI Explanation</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-700" aria-label="Close modal">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto" ref={containerRef}>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            <div className="w-8 h-8 border-4 border-t-cyan-500 border-slate-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-md font-semibold text-slate-200">
                                Generating explanation...
                            </p>
                        </div>
                    )}
                    {explanation && (
                         <div className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-bold text-slate-100">{title}</h3>
                            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parseMarkdown(explanation, { handleLatex: true }) }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExplanationModal;
