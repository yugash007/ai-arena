
import React, { useState, useCallback, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { UploadIcon } from './icons/UploadIcon';
import { generateExamHeatmap } from '../services/geminiService';
import type { HeatmapResult, HeatmapTopic } from '../types';
import { useToast } from '../contexts/ToastContext';
import { FaceFrownIcon } from './icons/FaceFrownIcon';
import { FaceMehIcon } from './icons/FaceMehIcon';
import { FaceSmileIcon } from './icons/FaceSmileIcon';
import { WarningIcon } from './icons/WarningIcon';

interface HeatmapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SUPPORTED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE_MB = 10;
const MAX_TOTAL_FILES = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type ConfidenceLevel = 'low' | 'medium' | 'high';
type TopicWithConfidence = HeatmapTopic & { confidence?: ConfidenceLevel };

const InsightCard: React.FC<{
    item: TopicWithConfidence;
    index: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onSetConfidence: (confidence: ConfidenceLevel) => void;
}> = ({ item, index, isExpanded, onToggleExpand, onSetConfidence }) => {
    const [isRendered, setIsRendered] = React.useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsRendered(true), index * 75);
        return () => clearTimeout(timer);
    }, [index]);

    const frequencyPercentage = (item.frequency / 10) * 100;
    const getFrequencyColor = (freq: number) => {
        if (freq >= 8) return 'bg-red-500';
        if (freq >= 5) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const confidenceClasses = {
        low: 'confidence-border-low text-red-400',
        medium: 'confidence-border-medium text-amber-400',
        high: 'confidence-border-high text-green-400',
    };
    
    const confidenceBorder = item.confidence ? confidenceClasses[item.confidence].replace(/text-.*/, '') : 'confidence-border-none';

    return (
        <div className={`bg-slate-800/60 rounded-lg insight-card ${confidenceBorder} ${isExpanded ? 'expanded' : ''} transition-opacity duration-500 ${isRendered ? 'opacity-100' : 'opacity-0'}`} >
            <div className="p-4 cursor-pointer" onClick={onToggleExpand}>
                <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-slate-100">{item.topic}</p>
                    <span className="text-sm font-semibold text-slate-300">{item.frequency}/10</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className={`h-3 rounded-full transition-all duration-1000 ease-out ${getFrequencyColor(item.frequency)}`}
                        style={{ width: `${frequencyPercentage}%` }}
                    ></div>
                </div>
            </div>
            <div className="insight-card-content">
                <div className="px-4 pb-4 border-t border-slate-700/50">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-cyan-400 text-sm mb-1">Summary</h4>
                            <p className="text-sm text-slate-400">{item.summary}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-cyan-400 text-sm mb-1">Key Sub-Topics</h4>
                            <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                                {item.sub_topics.map((sub, i) => <li key={i}>{sub}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-cyan-400 text-sm mb-1">Actionable Recommendation</h4>
                            <p className="text-sm text-slate-400 italic">"{item.actionable_recommendation}"</p>
                        </div>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                                <WarningIcon className="w-4 h-4 text-amber-400 shrink-0" />
                                <h4 className="font-semibold text-cyan-400 text-sm">Common Pitfalls</h4>
                            </div>
                            <p className="text-sm text-slate-400 pl-6">{item.common_pitfalls}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-700/50">
                            <h4 className="font-semibold text-slate-300 text-sm mb-2">My Confidence Level:</h4>
                            <div className="flex gap-2">
                                {(['low', 'medium', 'high'] as ConfidenceLevel[]).map(level => (
                                    <button key={level} onClick={() => onSetConfidence(level)}
                                        className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm rounded-md transition-colors ${item.confidence === level ? `${confidenceClasses[level].replace('confidence-border-', 'bg-')} bg-opacity-20` : 'bg-slate-700/50 hover:bg-slate-700'}`}
                                    >
                                        {level === 'low' && <FaceFrownIcon className="w-4 h-4" />}
                                        {level === 'medium' && <FaceMehIcon className="w-4 h-4" />}
                                        {level === 'high' && <FaceSmileIcon className="w-4 h-4" />}
                                        <span className="capitalize">{level}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const HeatmapModal: React.FC<HeatmapModalProps> = ({ isOpen, onClose }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<HeatmapResult | null>(null);
    const [topics, setTopics] = useState<TopicWithConfidence[]>([]);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<'frequency' | 'confidence'>('frequency');
    const { addToast } = useToast();

    useEffect(() => {
        if (result) {
            setTopics(result.topics.sort((a,b) => b.frequency - a.frequency));
        } else {
            setTopics([]);
        }
    }, [result]);

    const handleFileChange = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        const newFiles = Array.from(selectedFiles);
        let validFiles = [...files];
        for (const file of newFiles) {
            if (validFiles.length >= MAX_TOTAL_FILES) { addToast(`Max ${MAX_TOTAL_FILES} files.`, 'error'); break; }
            if (!SUPPORTED_TYPES.includes(file.type)) { addToast(`${file.name} type not supported.`, 'error'); continue; }
            if (file.size > MAX_FILE_SIZE_BYTES) { addToast(`${file.name} is too large.`, 'error'); continue; }
            if (!validFiles.some(f => f.name === file.name && f.size === file.size)) validFiles.push(file);
        }
        setFiles(validFiles);
    }, [files, addToast]);

    const handleGenerate = async () => {
        if (files.length < 2) { addToast("Please upload at least two past exams.", "error"); return; }
        setIsLoading(true); setResult(null);
        try {
            const heatmapResult = await generateExamHeatmap(files);
            setResult(heatmapResult);
        } catch (err) {
            addToast(err instanceof Error ? err.message : "An unknown error occurred.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFiles([]); setResult(null); setSortBy('frequency'); setExpandedCard(null);
        onClose();
    };

    const handleSetConfidence = (index: number, confidence: ConfidenceLevel) => {
        setTopics(currentTopics =>
            currentTopics.map((topic, i) =>
                i === index ? { ...topic, confidence } : topic
            )
        );
    };

    const sortedTopics = React.useMemo(() => {
        return [...topics].sort((a, b) => {
            if (sortBy === 'confidence') {
                const confidenceOrder: Record<ConfidenceLevel, number> = { 'low': 1, 'medium': 2, 'high': 3 };
                const confidenceA = confidenceOrder[a.confidence ?? 'medium'];
                const confidenceB = confidenceOrder[b.confidence ?? 'medium'];
                if (confidenceA !== confidenceB) return confidenceA - confidenceB;
            }
            return b.frequency - a.frequency;
        });
    }, [topics, sortBy]);
    

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-0 md:p-4 no-print" aria-modal="true" role="dialog">
            <div className="card-glow rounded-none md:rounded-2xl shadow-2xl w-full h-full md:w-[95vw] md:h-[92vh] md:max-w-7xl flex flex-col modal-enter-active">
                <header className="flex justify-between items-center p-6 border-b border-[var(--card-border)] shrink-0">
                    <h2 className="text-lg font-bold text-slate-100">Exam Prep Heatmap</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-700" aria-label="Close modal">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-6 md:p-8 overflow-y-auto flex-grow custom-scrollbar">
                    {!result && !isLoading && (
                         <div className="max-w-3xl mx-auto">
                            <p className="text-sm text-slate-400 mb-4">
                                Upload multiple past exam papers (PDF, DOCX, TXT). The AI will analyze them to find the most frequently tested topics and give you actionable insights.
                            </p>
                            <div className="p-12 border-2 border-dashed border-slate-600 rounded-2xl text-center bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                                <UploadIcon className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                                <input type="file" multiple onChange={(e) => handleFileChange(e.target.files)} className="hidden" id="heatmap-file-input" />
                                <label htmlFor="heatmap-file-input" className="text-lg font-semibold text-cyan-400 cursor-pointer hover:underline">Choose files</label>
                                <p className="text-sm text-slate-400 mt-2">or drag and drop</p>
                            </div>
                            <div className="mt-8">
                                {files.length > 0 && <h4 className="font-semibold text-slate-300 mb-3">Selected Files ({files.length}/{MAX_TOTAL_FILES}):</h4>}
                                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">{files.map((file, index) => (<li key={index} className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex justify-between items-center"><span>{file.name}</span></li>))}</ul>
                            </div>
                        </div>
                    )}
                    {isLoading && <div className="text-center p-8 h-full flex flex-col items-center justify-center"><SpinnerIcon className="w-12 h-12 text-cyan-500 mb-4" /><p className="text-xl font-semibold text-slate-200">Analyzing exams across time...</p></div>}
                    {result && (
                         <div className="max-w-5xl mx-auto">
                            <h3 className="text-2xl font-bold mb-6 text-white">{result.title}</h3>
                            <div className="flex flex-wrap gap-4 items-center mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <p className="text-slate-300 font-medium">Sort topics by:</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setSortBy('frequency')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${sortBy === 'frequency' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Frequency</button>
                                    <button onClick={() => setSortBy('confidence')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${sortBy === 'confidence' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>My Confidence</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {sortedTopics.map((item, index) => (
                                    <InsightCard 
                                        key={item.topic} 
                                        item={item} 
                                        index={index} 
                                        isExpanded={expandedCard === index}
                                        onToggleExpand={() => setExpandedCard(expandedCard === index ? null : index)}
                                        onSetConfidence={(confidence) => handleSetConfidence(topics.findIndex(t => t.topic === item.topic), confidence)}
                                    />
                               ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-6 flex justify-end gap-4 bg-slate-800/50 rounded-b-none md:rounded-b-2xl shrink-0">
                    <button onClick={handleClose} className="px-6 py-2.5 text-sm font-semibold bg-slate-700 text-slate-200 rounded-xl border border-slate-600 hover:bg-slate-600 btn-glow">Cancel</button>
                    <button onClick={result ? () => { setResult(null); setFiles([]); } : handleGenerate} disabled={isLoading} className={`flex items-center justify-center px-6 py-2.5 text-sm font-semibold bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 btn-glow ${isLoading ? 'btn-loading' : ''}`}>
                         {isLoading ? 'Analyzing...' : (result ? 'Analyze New' : 'Generate Heatmap')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default HeatmapModal;
