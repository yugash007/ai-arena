
import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ClockIcon } from './icons/ClockIcon';
import { generateRevisionPlan } from '../services/geminiService';
import type { RevisionPlanItem, CheatSheetSection } from '../types';
import { useToast } from '../contexts/ToastContext';

interface RevisionPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    sheetContent: CheatSheetSection[];
}

const RevisionPlannerModal: React.FC<RevisionPlannerModalProps> = ({ isOpen, onClose, sheetContent }) => {
    const [studyHours, setStudyHours] = useState(3);
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<RevisionPlanItem[] | null>(null);
    const [completedItems, setCompletedItems] = useState<number[]>([]);
    const { addToast } = useToast();

    const handleGenerate = async () => {
        if (studyHours <= 0) {
            addToast("Please enter a valid number of hours.", "error");
            return;
        }
        setIsLoading(true);
        setPlan(null);
        setCompletedItems([]);
        try {
            const result = await generateRevisionPlan(sheetContent, studyHours);
            setPlan(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            addToast(errorMessage, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleComplete = (index: number) => {
        setCompletedItems(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleClose = () => {
        setPlan(null);
        setStudyHours(3);
        setCompletedItems([]);
        onClose();
    };
    
    const priorityColors: { [key: string]: string } = {
        High: 'bg-red-500',
        Medium: 'bg-yellow-500',
        Low: 'bg-green-500',
        Default: 'bg-slate-400',
    };

    const totalPlanMinutes = plan?.reduce((sum, item) => sum + (Number(item.time_allocated_minutes) || 0), 0) || 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 no-print" aria-modal="true" role="dialog">
            <div className="card-glow rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col modal-enter-active">
                <header className="flex justify-between items-center p-4 border-b border-[var(--card-border)]">
                    <h2 className="text-lg font-bold text-slate-100">Time-Smart Revision Planner</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-700" aria-label="Close modal">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    {!plan && !isLoading && (
                        <div>
                            <p className="text-sm text-slate-400 mb-4">
                                Enter your available study time, and the AI will create a prioritized revision schedule based on your cheat sheet.
                            </p>
                            <label htmlFor="studyHours" className="block text-sm font-medium text-slate-300 mb-2">
                                How many hours do you have to study?
                            </label>
                            <input
                                id="studyHours"
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={studyHours}
                                onChange={(e) => setStudyHours(Number(e.target.value))}
                                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    )}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            <SpinnerIcon className="w-8 h-8 text-cyan-500" />
                            <p className="mt-4 text-md font-semibold text-slate-200">
                                Generating your smart plan...
                            </p>
                        </div>
                    )}
                    {plan && (
                        <div>
                            <h3 className="text-xl font-bold mb-2">Your {studyHours}-Hour Revision Plan</h3>
                            <div className="w-full bg-slate-700 rounded-full h-4 mb-4 flex overflow-hidden">
                                {plan.map((item, index) => {
                                    const itemMinutes = Number(item.time_allocated_minutes) || 0;
                                    const widthPercentage = totalPlanMinutes > 0 ? (itemMinutes / totalPlanMinutes) * 100 : 0;
                                    return (
                                        <div key={index}
                                            className={`h-4 transition-all ${item.topic.toLowerCase() === 'break' ? 'bg-cyan-500' : (priorityColors[item.priority] || priorityColors.Default)}`}
                                            style={{ width: `${widthPercentage}%` }}
                                            title={`${item.topic}: ${item.time_allocated_minutes} min`}>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                                {plan.map((item, index) => (
                                    <div key={index} className={`p-4 rounded-lg flex items-start gap-4 transition-opacity ${completedItems.includes(index) ? 'opacity-50' : 'opacity-100'} ${item.topic.toLowerCase() === 'break' ? 'bg-cyan-900/30' : 'bg-slate-800/60'}`}>
                                        <input
                                            type="checkbox"
                                            checked={completedItems.includes(index)}
                                            onChange={() => handleToggleComplete(index)}
                                            className="mt-1 h-5 w-5 rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-cyan-600 shrink-0 cursor-pointer"
                                        />
                                        <div className="flex-grow">
                                            <p className="font-bold text-slate-100">{item.topic}</p>
                                            <p className="text-sm text-slate-400 mt-1 italic">"{item.justification}"</p>
                                        </div>
                                        <div className="text-right ml-4 shrink-0">
                                            <p className="font-bold text-lg text-cyan-400">{item.time_allocated_minutes} min</p>
                                            {item.topic.toLowerCase() !== 'break' && (
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full text-slate-900 ${priorityColors[item.priority] || priorityColors.Default}`}>
                                                    {item.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-4 flex justify-end gap-3 bg-slate-800/50 rounded-b-2xl">
                    <button onClick={handleClose} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-slate-200 rounded-lg border border-slate-600 hover:bg-slate-600 btn-glow">
                        {plan ? 'Close' : 'Cancel'}
                    </button>
                    <button
                        onClick={plan ? () => { setPlan(null); setStudyHours(3); setCompletedItems([]); } : handleGenerate}
                        disabled={isLoading}
                        className={`flex items-center justify-center px-4 py-2 text-sm font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 btn-glow ${isLoading ? 'btn-loading' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="w-5 h-5 mr-2" />
                                Generating...
                            </>
                        ) : plan ? 'Start Over' : (
                            <>
                                <ClockIcon className="w-5 h-5 mr-2" />
                                Generate Plan
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default RevisionPlannerModal;
