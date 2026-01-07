
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { UniverseIcon } from './icons/UniverseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { generateParallelUniverse } from '../services/geminiService';
import type { ParallelUniverseResult, ParallelTimeline } from '../types';
import { ClockIcon } from './icons/ClockIcon';

interface ParallelUniverseModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: string | null;
}

const TimelineCard: React.FC<{ timeline: ParallelTimeline; delay: number }> = ({ timeline, delay }) => {
    let colorClass = "";
    let icon = "";

    switch (timeline.archetype) {
        case 'The Sprinter':
            colorClass = "border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10";
            icon = "⚡";
            break;
        case 'The Deep Diver':
            colorClass = "border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10";
            icon = "🤿";
            break;
        case 'The Hacker':
            colorClass = "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10";
            icon = "💻";
            break;
        default:
            colorClass = "border-slate-500/50 bg-slate-500/5";
            icon = "🔮";
    }

    return (
        <div 
            className={`p-6 rounded-xl border transition-all duration-500 hover:scale-[1.02] ${colorClass} animate-fade-in-up`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{icon}</span>
                        <h3 className="text-lg font-bold text-foreground">{timeline.name}</h3>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{timeline.archetype}</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-foreground">{timeline.probability}</span>
                    <p className="text-[10px] text-muted-foreground uppercase">Probability</p>
                </div>
            </div>
            
            <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                    <span className="font-bold text-foreground text-xs uppercase block mb-1">Short Term Outcome</span>
                    <p>{timeline.shortTermOutcome}</p>
                </div>
                <div>
                    <span className="font-bold text-foreground text-xs uppercase block mb-1">Long Term Outcome</span>
                    <p>{timeline.longTermOutcome}</p>
                </div>
                <div>
                    <span className="font-bold text-foreground text-xs uppercase block mb-1">Career (5 Years)</span>
                    <p className="italic">"{timeline.careerTrajectory}"</p>
                </div>
                <div className="pt-2 border-t border-dashed border-foreground/10 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-foreground">Mental State:</span>
                    <span className="px-2 py-0.5 rounded-full bg-background border border-foreground/10 text-xs">{timeline.mentalState}</span>
                </div>
            </div>
        </div>
    );
};

const ParallelUniverseModal: React.FC<ParallelUniverseModalProps> = ({ isOpen, onClose, context }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ParallelUniverseResult | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setResult(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSimulate = async () => {
        if (!context) return;
        setIsLoading(true);
        try {
            const data = await generateParallelUniverse(context);
            setResult(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl z-50 flex justify-center items-center p-0 md:p-6 no-print" aria-modal="true" role="dialog">
            
            {/* Cosmic Background Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative w-full h-full md:max-w-7xl flex flex-col overflow-hidden animate-fade-in z-10">
                
                <header className="flex justify-between items-center px-6 py-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                            <UniverseIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Parallel Universe</h2>
                            <p className="text-sm text-purple-300/60 font-mono tracking-wider">Simulate Alternative Timelines</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-8">
                    {!result && !isLoading && (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                            <UniverseIcon className="w-24 h-24 text-purple-500/20 mb-6 animate-float" />
                            <h3 className="text-2xl font-bold text-white mb-4">What if you studied differently?</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Our neural engine will project three potential futures based on the content of your document. 
                                See how adopting a <span className="text-purple-400">Sprinter</span>, <span className="text-blue-400">Deep Diver</span>, or <span className="text-emerald-400">Hacker</span> mindset changes your outcome.
                            </p>
                            <button
                                onClick={handleSimulate}
                                disabled={!context}
                                className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-2xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:scale-100"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5" />
                                    Generate Simulation
                                </span>
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            </button>
                            {!context && <p className="mt-4 text-xs text-red-400">No context loaded. Please upload a file first.</p>}
                        </div>
                    )}

                    {isLoading && (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="relative w-20 h-20 mb-8">
                                <div className="absolute inset-0 border-t-2 border-purple-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-2 border-r-2 border-indigo-500 rounded-full animate-spin-reverse"></div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Calculating Trajectories</h3>
                            <p className="text-slate-500 font-mono text-xs">Collapsing wave functions...</p>
                        </div>
                    )}

                    {result && (
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-8 p-6 rounded-xl bg-purple-900/10 border border-purple-500/20">
                                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                                    AI Analysis
                                </h3>
                                <p className="text-slate-300 leading-relaxed">{result.analysis}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {result.scenarios.map((timeline, idx) => (
                                    <TimelineCard key={idx} timeline={timeline} delay={idx * 200} />
                                ))}
                            </div>
                            
                            <div className="mt-12 text-center">
                                <button 
                                    onClick={handleSimulate}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                                >
                                    Rerun Simulation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .animate-spin-reverse { animation: spin-reverse 3s linear infinite; }
                @keyframes spin-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
            `}</style>
        </div>
    );
};

export default ParallelUniverseModal;
