import React, { useState, useEffect, useReducer } from 'react';
import type { Quiz, QuizQuestion } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { analyzeWeaknesses } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { parseMarkdown } from '../utils/markdownParser';

interface QuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    quiz: Quiz | null;
}

// --- State and Reducer ---
interface QuizState {
    currentQuestionIndex: number;
    userAnswers: Record<number, string>;
    selectedOption: string | null;
    isAnswered: boolean;
    showResults: boolean;
    slideDirection: 'left' | 'right' | 'none';
    weaknessSummary: string | null;
    isAnalyzing: boolean;
}

type QuizAction =
    | { type: 'SELECT_OPTION'; payload: string }
    | { type: 'NEXT_QUESTION'; payload: { totalQuestions: number } }
    | { type: 'SHOW_RESULTS' }
    | { type: 'SET_ANALYSIS_STATE'; payload: { isAnalyzing: boolean; summary: string | null } }
    | { type: 'RETAKE' }
    | { type: 'RESET'; payload: { quiz: Quiz } };

const initialState: QuizState = {
    currentQuestionIndex: 0,
    userAnswers: {},
    selectedOption: null,
    isAnswered: false,
    showResults: false,
    slideDirection: 'none',
    weaknessSummary: null,
    isAnalyzing: false,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
    switch (action.type) {
        case 'SELECT_OPTION':
            if (state.isAnswered) return state;
            return {
                ...state,
                isAnswered: true,
                selectedOption: action.payload,
                userAnswers: { ...state.userAnswers, [state.currentQuestionIndex]: action.payload },
            };
        case 'NEXT_QUESTION':
            if (state.currentQuestionIndex < action.payload.totalQuestions - 1) {
                return {
                    ...state,
                    currentQuestionIndex: state.currentQuestionIndex + 1,
                    isAnswered: false,
                    selectedOption: null,
                    slideDirection: 'left',
                };
            }
            // This is the last question, so transition to results
            return { ...state, showResults: true };
        case 'SHOW_RESULTS':
             return { ...state, showResults: true };
        case 'SET_ANALYSIS_STATE':
            return {
                ...state,
                isAnalyzing: action.payload.isAnalyzing,
                weaknessSummary: action.payload.summary,
            };
        case 'RETAKE':
            return { ...initialState };
        case 'RESET':
            return { ...initialState };
        default:
            return state;
    }
}


// --- Component ---

const DonutChart = ({ score, total }: { score: number, total: number }) => {
    const percentage = total > 0 ? (score / total) * 100 : 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="text-secondary" cx="60" cy="60" r={radius} strokeWidth="10" fill="transparent" stroke="currentColor" />
                <circle
                    className="text-foreground transition-all duration-1000 ease-out"
                    cx="60" cy="60" r={radius} strokeWidth="10" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    stroke="currentColor"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{score}</span>
                <span className="text-xs text-muted-foreground">/ {total}</span>
            </div>
        </div>
    );
};

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, quiz }) => {
    const [state, dispatch] = useReducer(quizReducer, initialState);
    const { currentQuestionIndex, userAnswers, selectedOption, isAnswered, showResults, slideDirection, weaknessSummary, isAnalyzing } = state;
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isOpen && quiz) {
            dispatch({ type: 'RESET', payload: { quiz } });
        }
    }, [isOpen, quiz]);
    
    useEffect(() => {
        const analyze = async () => {
             if (showResults && quiz && !weaknessSummary && !isAnalyzing) {
                const incorrectQuestions = quiz.questions.filter((_, index) => userAnswers[index] !== quiz.questions[index].correctAnswer);
                
                if (incorrectQuestions.length > 0) {
                    dispatch({ type: 'SET_ANALYSIS_STATE', payload: { isAnalyzing: true, summary: null } });
                    try {
                        const summary = await analyzeWeaknesses(incorrectQuestions);
                        dispatch({ type: 'SET_ANALYSIS_STATE', payload: { isAnalyzing: false, summary } });
                    } catch (error) {
                        console.error("Failed to analyze weaknesses:", error);
                        dispatch({ type: 'SET_ANALYSIS_STATE', payload: { isAnalyzing: false, summary: "Could not analyze your weak areas at this time." } });
                    }
                } else {
                    dispatch({ type: 'SET_ANALYSIS_STATE', payload: { isAnalyzing: false, summary: "### Excellent Work.\nYou demonstrated mastery of these concepts." } });
                }
            }
        };
        analyze();
    }, [showResults, quiz, userAnswers, weaknessSummary, isAnalyzing]);

    if (!isOpen || !quiz) return null;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const totalQuestions = quiz.questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    const handleNext = () => {
        setAnimationClass('animate-slide-out-left');
        setTimeout(() => {
            dispatch({ type: 'NEXT_QUESTION', payload: { totalQuestions } });
            setAnimationClass('animate-slide-in-left');
        }, 300);
    };

    const score = Object.keys(userAnswers).reduce((acc, index) => {
        return userAnswers[parseInt(index)] === quiz.questions[parseInt(index)].correctAnswer ? acc + 1 : acc;
    }, 0);

    const getOptionClasses = (option: string) => {
        let classes = 'text-left w-full p-4 rounded-lg border transition-all duration-200 ease-in-out disabled:cursor-not-allowed text-sm font-medium';
        if (!isAnswered) return `${classes} bg-card border-border hover:bg-secondary hover:border-foreground/50 text-foreground`;
        if (option === currentQuestion.correctAnswer) return `${classes} bg-green-500/10 border-green-500 text-green-600 dark:text-green-400`;
        if (option === selectedOption) return `${classes} bg-red-500/10 border-red-500 text-red-600 dark:text-red-400`;
        return `${classes} bg-secondary/30 border-border opacity-50`;
    };

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-0 md:p-6 no-print" aria-modal="true" role="dialog">
            <div className="bg-background border border-border md:rounded-xl shadow-2xl w-full h-full md:max-w-5xl flex flex-col overflow-hidden animate-fade-in">
                <header className="flex justify-between items-center px-6 py-4 border-b border-border shrink-0 bg-background z-10">
                    <h2 className="text-lg font-bold text-foreground">{showResults ? 'Evaluation' : quiz.title}</h2>
                    <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-6 md:p-10 flex-grow overflow-y-auto relative custom-scrollbar bg-secondary/10">
                    {!showResults ? (
                        <div className={`max-w-3xl mx-auto ${animationClass}`}>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Question {currentQuestionIndex + 1} / {totalQuestions}</p>
                            <div className="prose prose-neutral dark:prose-invert max-w-none text-xl md:text-2xl font-medium mb-10 text-foreground" dangerouslySetInnerHTML={{ __html: parseMarkdown(currentQuestion.question) }} />
                            
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => dispatch({ type: 'SELECT_OPTION', payload: option })}
                                        disabled={isAnswered}
                                        className={getOptionClasses(option)}
                                    >
                                        <div className="prose prose-neutral dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: parseMarkdown(option) }} />
                                    </button>
                                ))}
                            </div>

                            {isAnswered && (
                                <div className="mt-8 p-6 rounded-lg bg-card border border-border animate-fade-in">
                                     <h4 className="font-bold text-foreground mb-2 text-sm uppercase tracking-wide">Analysis</h4>
                                     <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: parseMarkdown(currentQuestion.explanation) }} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-fade-in max-w-4xl mx-auto">
                            <div className="text-center mb-10 flex flex-col items-center">
                                <DonutChart score={score} total={totalQuestions} />
                                <h3 className="text-xl font-bold mt-4 text-foreground">Assessment Complete</h3>
                            </div>
                            
                            <div className="mb-8 p-6 rounded-xl bg-card border border-border">
                                <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 bg-foreground rounded-full"></span>
                                    AI Feedback
                                </h4>
                                {isAnalyzing && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <SpinnerIcon className="w-4 h-4 mr-3 text-foreground" />
                                        <span>Diagnosing performance...</span>
                                    </div>
                                )}
                                {weaknessSummary && <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: parseMarkdown(weaknessSummary) }} />}
                            </div>

                             <div>
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Review</h4>
                                <div className="space-y-4">
                                   {quiz.questions.map((q, i) => {
                                       const userAnswer = userAnswers[i];
                                       const isCorrect = userAnswer === q.correctAnswer;
                                       return (
                                           <div key={i} className={`p-4 rounded-lg border-l-2 bg-card border-border ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                                <p className="font-medium text-foreground text-sm mb-2">{i+1}. {q.question}</p>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className={`${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-medium`}>
                                                        {userAnswer || 'Skipped'}
                                                    </span>
                                                    {!isCorrect && <span className="text-muted-foreground">Correct: {q.correctAnswer}</span>}
                                                </div>
                                           </div>
                                       );
                                   })}
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {!showResults && (
                    <footer className="px-6 py-4 flex flex-col border-t border-border bg-background shrink-0">
                        <div className="flex justify-end items-center w-full">
                           <button onClick={handleNext} disabled={!isAnswered} className="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                               {currentQuestionIndex < totalQuestions - 1 ? 'Next' : 'Finish'}
                               <ArrowRightIcon className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1 mt-4 overflow-hidden">
                            <div className="bg-foreground h-1 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                    </footer>
                )}
                {showResults && (
                     <footer className="px-6 py-4 flex justify-end gap-3 border-t border-border bg-background shrink-0">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Close
                        </button>
                         <button onClick={() => dispatch({ type: 'RETAKE' })} className="px-6 py-2 text-sm font-bold bg-foreground text-background rounded-lg hover:opacity-90 transition-all">
                            Retake Quiz
                        </button>
                    </footer>
                )}
            </div>
            <style>{`
                @keyframes slide-in-left { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .animate-slide-in-left { animation: slide-in-left 0.3s ease-out forwards; }
                @keyframes slide-out-left { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-20px); opacity: 0; } }
                .animate-slide-out-left { animation: slide-out-left 0.2s ease-in forwards; }
            `}</style>
        </div>
    );
};

export default QuizModal;