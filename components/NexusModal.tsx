import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { NexusIcon } from './icons/NexusIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import MermaidDiagram from './MermaidDiagram';
import type { NexusData } from '../types';

interface NexusModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: NexusData | null;
    isLoading: boolean;
    onGenerate: () => void;
}

const NexusModal: React.FC<NexusModalProps> = ({ isOpen, onClose, data, isLoading, onGenerate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-0 md:p-6 no-print" aria-modal="true" role="dialog">
            <div className="bg-background border border-border md:rounded-xl shadow-2xl w-full h-full md:max-w-7xl flex flex-col overflow-hidden animate-fade-in">
                
                <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-background z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground text-background rounded-lg">
                            <NexusIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">The Nexus</h2>
                            <p className="text-xs text-muted-foreground font-mono">Global Knowledge Graph</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative z-10">
                    {/* Left Panel: Graph */}
                    <div className="flex-1 bg-secondary/20 relative overflow-hidden flex flex-col">
                        <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur px-3 py-1 rounded-full border border-border text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Knowledge Topology
                        </div>
                        
                        {isLoading ? (
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <SpinnerIcon className="w-8 h-8 text-foreground mb-4" />
                                <p className="text-muted-foreground font-mono text-xs">Synthesizing connections...</p>
                             </div>
                        ) : data ? (
                            <div className="flex-grow p-4 overflow-auto custom-scrollbar flex items-center justify-center">
                                <div className="min-w-full min-h-full flex items-center justify-center">
                                    <MermaidDiagram chart={data.graph} className="w-full h-full flex justify-center items-center" />
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                <NexusIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-bold text-foreground mb-2">Initialize The Nexus</h3>
                                <p className="text-muted-foreground max-w-sm mb-8 text-sm">
                                    Analyze your entire Knowledge Vault to uncover hidden connections, gaps, and generate an optimal study path.
                                </p>
                                <button 
                                    onClick={onGenerate}
                                    className="px-6 py-2 bg-foreground text-background font-bold rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2 text-sm"
                                >
                                    <NexusIcon className="w-4 h-4" />
                                    Generate Graph
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Study Path & Insights */}
                    {data && !isLoading && (
                        <div className="w-full md:w-[350px] xl:w-[400px] bg-background border-l border-border overflow-y-auto custom-scrollbar p-6 space-y-8">
                            
                            {/* Insights */}
                            <div>
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground"></span>
                                    AI Insights
                                </h3>
                                <div className="space-y-3">
                                    {data.globalInsights.map((insight, i) => (
                                        <div key={i} className="p-4 rounded-lg bg-card border border-border text-xs text-muted-foreground leading-relaxed">
                                            {insight}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Study Path */}
                            <div>
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground"></span>
                                    Smart Study Path
                                </h3>
                                <div className="relative pl-4 space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
                                    
                                    {data.studyPath.map((node, i) => (
                                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                            
                                            {/* Icon Marker */}
                                            <div className="absolute left-0 w-10 h-10 rounded-full border-4 border-background flex items-center justify-center z-10 -ml-5 bg-card shadow-sm border-t-border border-l-border">
                                                <div className={`w-2.5 h-2.5 rounded-full ${
                                                    node.status === 'mastered' ? 'bg-green-500' :
                                                    node.status === 'in-progress' ? 'bg-amber-500 animate-pulse' :
                                                    'bg-muted'
                                                }`}></div>
                                            </div>
                                            
                                            {/* Content Card */}
                                            <div className="ml-10 w-full bg-card border border-border p-4 rounded-lg hover:border-foreground/30 transition-all">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-foreground text-sm">{node.title}</h4>
                                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-border bg-secondary text-muted-foreground">
                                                        {node.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{node.description}</p>
                                                <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono uppercase">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {node.estimatedTime}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NexusModal;