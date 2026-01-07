
import React from 'react';
import FileUpload from './FileUpload';
import { SparklesIcon } from './icons/SparklesIcon';
import { FlashcardIcon } from './icons/FlashcardIcon';
import { QuizIcon } from './icons/QuizIcon';
import { CodeIcon } from './icons/CodeIcon';
import { TargetIcon } from './icons/TargetIcon';
import { BugIcon } from './icons/BugIcon';
import { QuestionIcon } from './icons/QuestionIcon';
import { NetworkIcon } from './icons/NetworkIcon';
import { VideoIcon } from './icons/VideoIcon';
import { BrainIcon } from './icons/BrainIcon';
import { GlowCard, GlowCardWrapper } from './ui/GlowCard';

interface HomeScreenProps {
    file: File | null;
    onFileSelect: (file: File) => void;
    onGenerateCheatSheet: () => void;
    onGenerateFormulaSheet: () => void;
    onGenerateFlashcards: () => void;
    onGenerateQuiz: () => void;
    onOpenHeatmap: () => void;
    onOpenCodeDebugger: () => void;
    onOpenAskAnything: () => void;
    onGenerateStrategy: () => void;
    onGenerateConceptMap: () => void;
    onGenerateLectureNotes: () => void;
    onOpenFeynman: () => void;
}

const ToolCard: React.FC<{ 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string; 
    description: string;
    delayClass?: string;
}> = ({ onClick, icon, label, description, delayClass = '' }) => (
    <GlowCard
        onClick={onClick}
        className={`group flex flex-col p-6 h-full text-left opacity-0 animate-fade-in-up cursor-pointer hover:-translate-y-1 transition-transform duration-300 ${delayClass}`}
    >
        <div className="relative z-10">
            <div className="mb-4 text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {icon}
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                {label}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    </GlowCard>
);

const HomeScreen: React.FC<HomeScreenProps> = ({
    file,
    onFileSelect,
    onGenerateCheatSheet,
    onGenerateFormulaSheet,
    onGenerateFlashcards,
    onGenerateQuiz,
    onOpenHeatmap,
    onOpenCodeDebugger,
    onOpenAskAnything,
    onGenerateStrategy,
    onGenerateConceptMap,
    onGenerateLectureNotes,
    onOpenFeynman
}) => {
    return (
        <div className="max-w-7xl mx-auto px-6 py-12 relative">
            {/* Hero Section */}
            <div className="relative text-center mb-20 max-w-4xl mx-auto animate-fade-in-up">
                
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-foreground relative z-10 leading-[0.9]">
                    Your Intelligence, <br />
                    <span className="text-muted-foreground">Amplified.</span>
                </h1>
                
                {/* Decorative Gradients for Title */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-foreground/5 blur-[60px] -z-10 rounded-full pointer-events-none"></div>

                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200 opacity-0 relative z-10 font-light">
                    The minimal AI workspace for high-performance engineering, medicine, and mathematics.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Upload Console */}
                <div className="lg:col-span-5 w-full sticky top-28 z-10 animate-fade-in-up delay-300 opacity-0">
                    <div className="surface-panel rounded-2xl p-1 shadow-sm relative overflow-hidden group">
                        <div className="bg-background rounded-xl p-6 relative z-10">
                             <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse-slow"></span>
                                    Data Ingestion
                                </h2>
                                <span className="text-[9px] font-mono text-muted-foreground uppercase border border-border px-2 py-0.5 rounded-full">v2.0</span>
                            </div>
                            
                            <FileUpload onFileSelect={onFileSelect} />
                            
                            <div className="mt-6">
                                {file ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={onGenerateCheatSheet}
                                                className="btn-primary btn-shimmer w-full py-3.5 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-foreground/5"
                                            >
                                                Analyze Logic
                                            </button>
                                            {(file.type.startsWith('audio') || file.type.startsWith('video')) && (
                                                <button
                                                    onClick={onGenerateLectureNotes}
                                                    className="btn-outline w-full py-3.5 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-2"
                                                >
                                                    Transcribe
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">System Idle</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Gradient Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-foreground/10 to-transparent pointer-events-none"></div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="lg:col-span-7">
                    <div className="mb-6 flex items-center gap-3 animate-fade-in-up delay-300 opacity-0 px-1">
                        <div className="w-1 h-4 bg-foreground rounded-full"></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Neural Tools</h3>
                    </div>
                    
                    <GlowCardWrapper hue={220} size={400} border={1} radius={16} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ToolCard 
                            onClick={onOpenFeynman}
                            icon={<BrainIcon className="w-6 h-6" />}
                            label="Feynman Board"
                            description="Meta-learning via simplification."
                            delayClass="delay-100"
                        />
                         <ToolCard 
                            onClick={onGenerateConceptMap}
                            icon={<NetworkIcon className="w-6 h-6" />}
                            label="Concept Mapper"
                            description="Visualize semantic connections."
                            delayClass="delay-200"
                        />
                         <ToolCard 
                            onClick={onGenerateLectureNotes}
                            icon={<VideoIcon className="w-6 h-6" />}
                            label="Lecture Intel"
                            description="Parse audio into structured notes."
                            delayClass="delay-300"
                        />
                         <ToolCard 
                            onClick={onGenerateFormulaSheet}
                            icon={<CodeIcon className="w-6 h-6" />}
                            label="Formula Matrix"
                            description="Extract derivations & constants."
                            delayClass="delay-400"
                        />
                         <ToolCard 
                            onClick={onOpenCodeDebugger}
                            icon={<BugIcon className="w-6 h-6" />}
                            label="Code Debugger"
                            description="Static analysis and refactoring."
                            delayClass="delay-500"
                        />
                         <ToolCard 
                            onClick={onGenerateFlashcards}
                            icon={<FlashcardIcon className="w-6 h-6" />}
                            label="Neural Flash"
                            description="Spaced repetition system."
                            delayClass="delay-100"
                        />
                        <ToolCard 
                            onClick={onGenerateQuiz}
                            icon={<QuizIcon className="w-6 h-6" />}
                            label="Diagnostic Test"
                            description="Identify knowledge gaps."
                            delayClass="delay-200"
                        />
                        <ToolCard 
                            onClick={onOpenAskAnything}
                            icon={<QuestionIcon className="w-6 h-6" />}
                            label="Neural Query"
                            description="Deep dive Q&A with context."
                            delayClass="delay-300"
                        />
                        <ToolCard 
                            onClick={onGenerateStrategy}
                            icon={<TargetIcon className="w-6 h-6" />}
                            label="Prediction Engine"
                            description="Exam strategy & probability."
                            delayClass="delay-400"
                        />
                    </GlowCardWrapper>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
