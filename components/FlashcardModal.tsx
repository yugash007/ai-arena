import React, { useState, useEffect, useRef } from 'react';
import type { FlashCard } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { parseMarkdown } from '../utils/markdownParser';

interface FlashcardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cards: FlashCard[];
}

declare global {
    interface Window {
        renderMathInElement?: (element: HTMLElement, options?: any) => void;
        katex?: {
            ParseError: any;
        };
    }
}

const SRS_RATINGS = [
    { value: 0, label: 'Again', color: 'hover:bg-red-500 hover:text-white', text: 'text-red-500', interval: '< 1m' },
    { value: 1, label: 'Hard', color: 'hover:bg-orange-500 hover:text-white', text: 'text-orange-500', interval: '2d' },
    { value: 3, label: 'Good', color: 'hover:bg-blue-500 hover:text-white', text: 'text-blue-500', interval: '4d' },
    { value: 5, label: 'Easy', color: 'hover:bg-green-500 hover:text-white', text: 'text-green-500', interval: '7d' },
];

const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, cards: initialCards }) => {
    const [cards, setCards] = useState<FlashCard[]>([]);
    const [currentCard, setCurrentCard] = useState<FlashCard | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({ reviewed: 0, learned: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && initialCards.length > 0) {
            const sortedCards = [...initialCards].sort((a, b) => a.nextReview - b.nextReview);
            setCards(sortedCards);
            setCurrentCard(sortedCards[0]);
            setIsFlipped(false);
            setSessionStats({ reviewed: 0, learned: 0 });
        }
    }, [isOpen, initialCards]);

    useEffect(() => {
        // Render math when card changes or flips
        if (cardRef.current && window.renderMathInElement && document.compatMode === 'CSS1Compat') {
            try {
                window.renderMathInElement(cardRef.current, {
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
    }, [currentCard, isFlipped, isOpen]);

    const calculateNextInterval = (card: FlashCard, quality: number) => {
        let { interval, repetition, efactor } = card;

        if (quality >= 3) {
            if (repetition === 0) {
                interval = 1;
            } else if (repetition === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * efactor);
            }
            repetition += 1;
            efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        } else {
            repetition = 0;
            interval = 1;
        }

        if (efactor < 1.3) efactor = 1.3;

        return {
            interval,
            repetition,
            efactor,
            nextReview: Date.now() + interval * 24 * 60 * 60 * 1000
        };
    };

    const handleRate = (quality: number) => {
        if (!currentCard) return;

        const updatedStats = calculateNextInterval(currentCard, quality);
        const updatedCard = { ...currentCard, ...updatedStats };
        const remainingCards = cards.slice(1);
        
        const nextQueue = quality < 3 
            ? [...remainingCards, { ...updatedCard, nextReview: Date.now() }] 
            : remainingCards;

        setSessionStats(prev => ({
            reviewed: prev.reviewed + 1,
            learned: quality >= 3 ? prev.learned + 1 : prev.learned
        }));

        setCards(nextQueue);
        setIsFlipped(false);
        
        if (nextQueue.length > 0) {
            setCurrentCard(nextQueue[0]);
        } else {
            setCurrentCard(null); 
        }
    };

    const handleFlip = () => setIsFlipped(!isFlipped);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-0 md:p-6 no-print" aria-modal="true" role="dialog">
            <div className="bg-background border border-border md:rounded-xl shadow-2xl w-full h-full md:max-w-5xl flex flex-col overflow-hidden animate-fade-in">
                <header className="flex justify-between items-center px-6 py-4 border-b border-border z-10 bg-background">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Neural Flash</h2>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            SESSION: {sessionStats.reviewed} | LEARNED: {sessionStats.learned}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-4 md:p-12 flex flex-col items-center justify-center flex-grow overflow-hidden relative perspective-1200 bg-secondary/10">
                    {currentCard ? (
                        <div 
                            className={`w-full max-w-3xl aspect-[4/3] md:aspect-[16/9] relative cursor-pointer transition-transform duration-500 preserve-3d group ${isFlipped ? 'rotate-y-180' : ''}`}
                            onClick={handleFlip}
                            ref={cardRef}
                        >
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden rounded-xl shadow-lg p-8 md:p-12 flex flex-col items-center justify-center bg-card border border-border hover:border-foreground/30 transition-all">
                                <span className="absolute top-6 left-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Question</span>
                                <div className="prose prose-neutral dark:prose-invert prose-lg md:prose-xl text-center max-w-none line-clamp-12 text-foreground font-medium"
                                     dangerouslySetInnerHTML={{ __html: parseMarkdown(currentCard.front, { handleLatex: true }) }}
                                />
                                <div className="absolute bottom-6 text-muted-foreground text-xs uppercase tracking-widest opacity-50">Tap to Flip</div>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl shadow-lg p-8 md:p-12 flex flex-col items-center justify-center bg-card border border-foreground/20">
                                <span className="absolute top-6 left-6 text-[10px] font-bold text-foreground uppercase tracking-widest">Answer</span>
                                <div className="prose prose-neutral dark:prose-invert prose-lg md:prose-xl text-center max-w-none overflow-y-auto max-h-full custom-scrollbar text-foreground" 
                                     dangerouslySetInnerHTML={{ __html: parseMarkdown(currentCard.back, { handleLatex: true }) }} 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center animate-fade-in">
                            <div className="mb-4 inline-block p-4 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">Session Complete</h3>
                            <p className="text-muted-foreground text-sm">You've reviewed all cards for now.</p>
                            <button onClick={() => { setCards(initialCards); setCurrentCard(initialCards[0]); setSessionStats({reviewed:0, learned:0}); }} className="mt-6 px-6 py-2 bg-foreground text-background hover:opacity-90 font-bold rounded-lg transition-all">
                                Review Again
                            </button>
                        </div>
                    )}
                </div>

                <footer className="p-6 border-t border-border bg-background z-10">
                    {currentCard && isFlipped ? (
                        <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
                            {SRS_RATINGS.map((rating) => (
                                <button
                                    key={rating.value}
                                    onClick={() => handleRate(rating.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all border border-border bg-card ${rating.color}`}
                                >
                                    <span className={`text-sm font-bold ${rating.text} group-hover:text-white`}>{rating.label}</span>
                                    <span className="text-[9px] text-muted-foreground mt-1">{rating.interval}</span>
                                </button>
                            ))}
                        </div>
                    ) : currentCard ? (
                        <div className="flex justify-center">
                            <button 
                                onClick={handleFlip}
                                className="w-full max-w-xs py-3 bg-secondary hover:bg-border text-foreground font-bold text-sm rounded-lg transition-all"
                            >
                                Show Answer
                            </button>
                        </div>
                    ) : null}
                </footer>
            </div>
            <style>{`
                .perspective-1200 { perspective: 1200px; }
                .preserve-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
            `}</style>
        </div>
    );
};

export default FlashcardModal;