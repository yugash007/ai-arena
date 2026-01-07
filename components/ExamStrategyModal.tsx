
import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { TargetIcon } from './icons/TargetIcon';
import type { ExamStrategy } from '../types';

interface ExamStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    strategy: ExamStrategy | null;
}

const ExamStrategyModal: React.FC<ExamStrategyModalProps> = ({ isOpen, onClose, strategy }) => {
    if (!isOpen || !strategy) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-0 md:p-4 no-print backdrop-blur-md" aria-modal="true" role="dialog">
            <div className="card-glow rounded-none md:rounded-2xl shadow-2xl w-full h-full md:w-[95vw] md:h-[92vh] md:max-w-7xl flex flex-col modal-enter-active bg-slate-900/90 border border-slate-700/50">
                <header className="flex justify-between items-center p-6 border-b border-slate-700/50 shrink-0 bg-slate-800/50 md:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <TargetIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Exam Prediction Engine</h2>
                            <p className="text-xs text-purple-300 font-mono tracking-wider uppercase">AI-Generated Strategy Profile</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="p-6 md:p-8 overflow-y-auto flex-grow custom-scrollbar">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                            <h3 className="text-sm text-slate-400 font-bold uppercase mb-2">Estimated Difficulty</h3>
                            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                {strategy.examProfile.difficulty}
                            </div>
                        </div>
                        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 md:col-span-2">
                            <h3 className="text-sm text-slate-400 font-bold uppercase mb-2">Likely Focus Areas</h3>
                            <div className="flex flex-wrap gap-2">
                                {strategy.examProfile.likelyFocusAreas.map((area, i) => (
                                    <span key={i} className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm font-bold border border-blue-500/30">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Strategy */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                                Tactical Approach
                            </h3>
                            
                            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                                <h4 className="font-bold text-cyan-400 mb-2 text-sm uppercase">Order of Attack</h4>
                                <p className="text-slate-300 leading-relaxed">{strategy.strategy.orderOfAttack}</p>
                            </div>

                            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                                <h4 className="font-bold text-cyan-400 mb-2 text-sm uppercase">Time Allocation</h4>
                                <p className="text-slate-300 leading-relaxed">{strategy.strategy.timeAllocation}</p>
                            </div>

                            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                                <h4 className="font-bold text-cyan-400 mb-2 text-sm uppercase">Pitfall Avoidance</h4>
                                <p className="text-slate-300 leading-relaxed">{strategy.strategy.pitfallAvoidance}</p>
                            </div>
                        </div>

                        {/* Predicted Questions */}
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                                Predicted Questions
                            </h3>
                            <div className="space-y-4">
                                {strategy.predictedQuestions.map((q, i) => (
                                    <div key={i} className="group relative p-6 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all hover:translate-x-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{q.topic}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.probability.includes('High') ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {q.probability} Prob.
                                            </span>
                                        </div>
                                        <p className="text-slate-200 font-medium group-hover:text-white transition-colors">
                                            "{q.question}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamStrategyModal;
