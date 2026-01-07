
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { BrainIcon } from './icons/BrainIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { validateConcept } from '../services/geminiService';
import type { FeynmanResponse } from '../types';
import { parseMarkdown } from '../utils/markdownParser';
import { useToast } from '../contexts/ToastContext';

interface FeynmanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const FeynmanModal: React.FC<FeynmanModalProps> = ({ isOpen, onClose }) => {
    const [topic, setTopic] = useState('');
    const [explanation, setExplanation] = useState('');
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [style, setStyle] = useState('Concise');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<FeynmanResponse | null>(null);
    const [isListening, setIsListening] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const { addToast } = useToast();

    // Cleanup speech recognition on unmount or close
    useEffect(() => {
        if (!isOpen) {
            stopListening();
        }
        return () => stopListening();
    }, [isOpen]);

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addToast("Voice input is not supported in this browser.", "error");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                addToast("Microphone access denied.", "error");
            }
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setExplanation(prev => {
                    const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                    return prev + spacer + finalTranscript;
                });
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    if (!isOpen) return null;

    const handleValidate = async () => {
        if (!topic.trim() || !explanation.trim()) return;
        setIsLoading(true);
        try {
            const data = await validateConcept(topic, explanation, difficulty, style);
            setResult(data);
        } catch (error) {
            console.error(error);
            addToast("Failed to validate concept. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setExplanation('');
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500 border-green-500';
        if (score >= 50) return 'text-amber-500 border-amber-500';
        return 'text-red-500 border-red-500';
    };

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-0 md:p-6 no-print" aria-modal="true" role="dialog">
            <div className="bg-background border border-border md:rounded-xl shadow-2xl w-full h-full md:max-w-5xl flex flex-col overflow-hidden animate-fade-in">
                
                {/* Header */}
                <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-background z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground text-background rounded-lg">
                            <BrainIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">
                                Feynman Board
                            </h2>
                            <p className="text-xs text-muted-foreground font-mono">Meta-Learning Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-10 relative z-10 bg-secondary/10">
                    {!result ? (
                        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Concept Topic</label>
                                    <input 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Quantum Entanglement"
                                        className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:border-foreground outline-none transition-all"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Target Difficulty</label>
                                        <div className="relative">
                                            <select 
                                                value={difficulty}
                                                onChange={(e) => setDifficulty(e.target.value)}
                                                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-foreground appearance-none"
                                            >
                                                <option>Beginner</option>
                                                <option>Intermediate</option>
                                                <option>Advanced</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Feedback Style</label>
                                        <select 
                                            value={style}
                                            onChange={(e) => setStyle(e.target.value)}
                                            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-foreground appearance-none"
                                        >
                                            <option>Concise</option>
                                            <option>Detailed</option>
                                            <option>Visual</option>
                                            <option>Analogy-based</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2 pl-1">
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Your Explanation</label>
                                        <button 
                                            onClick={toggleListening}
                                            className={`p-1.5 rounded-full transition-all flex items-center gap-2 ${isListening ? 'bg-red-500/10 text-red-500 ring-1 ring-red-500/50 animate-pulse' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}
                                            title={isListening ? "Stop Recording" : "Start Voice Input"}
                                        >
                                            <MicrophoneIcon className="w-4 h-4" />
                                            {isListening && <span className="text-[9px] font-bold uppercase tracking-wider">Recording</span>}
                                        </button>
                                    </div>
                                    <textarea 
                                        value={explanation}
                                        onChange={(e) => setExplanation(e.target.value)}
                                        placeholder="Explain the concept in your own words. Don't worry about being perfect..."
                                        className="w-full h-64 bg-card border border-border rounded-lg p-4 text-foreground placeholder-muted-foreground focus:border-foreground outline-none resize-none transition-all custom-scrollbar leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto animate-fade-in">
                            {/* Score Header */}
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-card border border-border p-8 rounded-xl">
                                <div className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center ${getScoreColor(result.confidence_score)}`}>
                                    <div className="text-center text-foreground">
                                        <div className="text-2xl font-black">{result.confidence_score}%</div>
                                        <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Confidence</div>
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-foreground mb-2">Feedback Summary</h3>
                                    <p className="text-muted-foreground leading-relaxed">{result.feedback_summary}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Corrected Explanation */}
                                <div className="p-6 rounded-xl bg-card border border-border">
                                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                                        <CheckCircleIcon className="w-4 h-4 text-foreground" />
                                        Refined Explanation
                                    </h4>
                                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: parseMarkdown(result.corrected_explanation) }} />
                                </div>

                                {/* Follow-up */}
                                <div className="p-6 rounded-xl bg-card border border-border">
                                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                                        <BrainIcon className="w-4 h-4 text-foreground" />
                                        Deepen Knowledge
                                    </h4>
                                    <ul className="space-y-4">
                                        {result.follow_up_questions.map((q, i) => (
                                            <li key={i} className="flex gap-3 text-muted-foreground text-sm">
                                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                                                {q}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="px-6 py-4 bg-background border-t border-border flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Close
                    </button>
                    {result ? (
                        <button
                            onClick={handleReset}
                            className="px-6 py-2 bg-secondary text-foreground hover:bg-border font-bold rounded-lg transition-all"
                        >
                            Try Another
                        </button>
                    ) : (
                        <button
                            onClick={handleValidate}
                            disabled={isLoading || !topic.trim() || !explanation.trim()}
                            className="flex items-center justify-center px-6 py-2 text-sm font-bold bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? (
                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                            ) : (
                                <span>Analyze Understanding</span>
                            )}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default FeynmanModal;
