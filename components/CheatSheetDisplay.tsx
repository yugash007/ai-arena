
import React, { useState, useEffect, useRef } from 'react';
import type { CheatSheetSection, CheatSheetItem, SavedCheatSheet } from '../types';
import { PrintIcon } from './icons/PrintIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CopyIcon } from './icons/CopyIcon';
import { FlashcardIcon } from './icons/FlashcardIcon';
import { QuizIcon } from './icons/QuizIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CodeIcon } from './icons/CodeIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { useToast } from '../contexts/ToastContext';
import { QuestionIcon } from './icons/QuestionIcon';
import { parseMarkdown } from '../utils/markdownParser';
import MermaidDiagram from './MermaidDiagram';

interface CheatSheetDisplayProps {
  sheet: Omit<SavedCheatSheet, 'id'> & { id?: string };
  isEditing: boolean;
  onToggleEdit: () => void;
  onContentChange: (updatedContent: CheatSheetSection[]) => void;
  onExplain: (item: CheatSheetItem) => void;
  onFixCode: (code: string) => void;
  onGenerateFlashcards: () => void;
  isGeneratingFlashcards: boolean;
  onGenerateQuiz: () => void;
  isGeneratingQuiz: boolean;
  onGeneratePlan: () => void;
  onSave: () => void;
  onStartNew: () => void;
  onOpenAskAnything: () => void;
  onSmartHighlight: () => void;
  isHighlighting: boolean;
  onUpdateSheet?: (sheet: SavedCheatSheet) => void; // Optional for non-persisted sheets
}

declare global {
    interface Window {
        renderMathInElement?: (element: HTMLElement, options?: any) => void;
        katex?: {
            ParseError: any;
        };
    }
}

const extractCode = (text: string | undefined): string | null => {
    if (!text) return null;
    const codeBlockMatch = text.match(/```(?!(mermaid))([\s\S]*?)```/);
    return codeBlockMatch && codeBlockMatch[1] ? codeBlockMatch[1].trim() : null;
};

// Highlighting Icon
const HighlighterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 11-6 6v3h9l3-3" />
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </svg>
);

// Speaker Icon
const SpeakerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const CheatSheetDisplay: React.FC<CheatSheetDisplayProps> = ({ 
    sheet, isEditing, onToggleEdit, onContentChange, onExplain, onFixCode, 
    onGenerateFlashcards, isGeneratingFlashcards, onGenerateQuiz, isGeneratingQuiz,
    onSave, onStartNew, onOpenAskAnything, onSmartHighlight, isHighlighting, onUpdateSheet
}) => {
  const { content, id: sheetId } = sheet;
  const { addToast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for standards mode before attempting to render math
    if (containerRef.current && window.renderMathInElement && document.compatMode === 'CSS1Compat') {
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
  }, [content, isEditing]);

  const handlePrint = () => window.print();
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("Copied to clipboard", "success");
  };

  const handleChange = (sectionIndex: number, itemIndex: number | null, field: 'sectionTitle' | 'title' | 'content', value: string) => {
    const newContent = content.map((section, sIdx) => {
      if (sIdx !== sectionIndex) return section;
      if (itemIndex === null) return { ...section, [field]: value };
      return { ...section, items: section.items.map((item, iIdx) => iIdx === itemIndex ? { ...item, [field]: value } : item) };
    });
    onContentChange(newContent);
  };

  const handleVoiceMode = () => {
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
    }

    const textToRead = content.map(s => `${s.sectionTitle}. ${s.items.map(i => `${i.title}. ${i.content}`).join('. ')}`).join('. ');
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    addToast("Voice Mode Activated", "success");
  };

  return (
    <div className="animate-fade-in" ref={containerRef}>
      {/* Precision Navigation Bar */}
      <div className="max-w-7xl mx-auto mb-12 no-print animate-fade-in-up">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 surface-panel rounded-xl">
          
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-3 tracking-tight">
               <span className="w-1 h-6 bg-foreground rounded-full"></span>
               Analytical Workbench
            </h1>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase font-bold tracking-wider pl-4">
                <span>{sheet.filename}</span>
                <span className="text-border">|</span>
                <span>ID: {sheetId?.slice(0, 8) || 'BUFFER'}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
               <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-bold text-xs rounded-lg hover:opacity-90 transition-opacity hover:shadow-[0_0_15px_rgba(var(--foreground),0.3)]">
                 <SaveIcon className="w-3 h-3" />
                 {sheetId ? 'Sync' : 'Save'}
               </button>
               
               <div className="flex bg-secondary p-1 rounded-lg border border-border">
                   <button 
                        onClick={onGenerateFlashcards} 
                        disabled={isGeneratingFlashcards} 
                        className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-card hover:shadow-sm transition-all text-muted-foreground hover:text-foreground disabled:opacity-50"
                   >
                        {isGeneratingFlashcards ? <SpinnerIcon className="w-3.5 h-3.5" /> : <FlashcardIcon className="w-3.5 h-3.5" />}
                        <span>Cards</span>
                   </button>
                   <button 
                        onClick={onGenerateQuiz} 
                        disabled={isGeneratingQuiz} 
                        className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-card hover:shadow-sm transition-all text-muted-foreground hover:text-foreground disabled:opacity-50"
                   >
                        {isGeneratingQuiz ? <SpinnerIcon className="w-3.5 h-3.5" /> : <QuizIcon className="w-3.5 h-3.5" />}
                        <span>Quiz</span>
                   </button>
                   <button onClick={onOpenAskAnything} className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-card hover:shadow-sm transition-all text-muted-foreground hover:text-foreground">
                        <QuestionIcon className="w-3.5 h-3.5" />
                        Query
                   </button>
               </div>
               
               <div className="w-px h-8 bg-border mx-1 hidden sm:block"></div>
                
               <button
                  onClick={onSmartHighlight}
                  disabled={isHighlighting}
                  className={`p-2 rounded-lg border transition-all ${isHighlighting ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'}`}
                  title="Smart Highlight"
               >
                 {isHighlighting ? <SpinnerIcon className="w-4 h-4" /> : <HighlighterIcon className="w-4 h-4" />}
               </button>

               <button 
                 onClick={handleVoiceMode}
                 className={`p-2 rounded-lg border transition-all ${isSpeaking ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'}`}
                 title="Voice Study Mode"
               >
                 <SpeakerIcon className="w-4 h-4" />
               </button>

               <button onClick={onToggleEdit} className={`p-2 rounded-lg border transition-all ${isEditing ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'}`}>
                 <EditIcon className="w-4 h-4" />
               </button>
               <button onClick={handlePrint} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
                 <PrintIcon className="w-4 h-4" />
               </button>
               <button onClick={onStartNew} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-all">
                 <TrashIcon className="w-4 h-4" />
               </button>
          </div>
        </div>
      </div>

      {/* Main Sheet Matrix - Clean Document Layout */}
      <div id="cheat-sheet-container" className="max-w-5xl mx-auto pb-32 px-6 md:px-0">
        <div className="space-y-12">
          {content.map((section, sIdx) => {
            return (
                <div key={sIdx} className="group animate-fade-in-up" style={{ animationDelay: `${sIdx * 100}ms` }}>
                    {/* Section Header */}
                    <div className="mb-6 flex items-baseline gap-4 border-b border-foreground/10 pb-4">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
                            {String(sIdx + 1).padStart(2, '0')}
                        </span>
                        {isEditing ? (
                            <input 
                                value={section.sectionTitle} 
                                onChange={(e) => handleChange(sIdx, null, 'sectionTitle', e.target.value)} 
                                className="bg-transparent border-b border-border text-2xl font-bold text-foreground w-full outline-none" 
                            />
                        ) : (
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">
                                {section.sectionTitle}
                            </h2>
                        )}
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 gap-8">
                        {section.items.map((item, iIdx) => {
                            if (!item || typeof item.content !== 'string') return null;
                            const code = extractCode(item.content);
                            const parts = item.content.split(/```mermaid([\s\S]*?)```/g);

                            return (
                                <div key={iIdx} className="group/item relative pl-6 border-l-2 border-border hover:border-foreground transition-all duration-300 hover:pl-8">
                                    {/* Item Header */}
                                    <div className="flex justify-between items-start mb-2">
                                        {isEditing ? (
                                             <input 
                                                value={item.title} 
                                                onChange={(e) => handleChange(sIdx, iIdx, 'title', e.target.value)} 
                                                className="w-full bg-transparent font-bold text-foreground border-b border-border outline-none pb-1" 
                                             />
                                        ) : (
                                            <h3 className="font-bold text-lg text-foreground pr-8">
                                                {item.title}
                                            </h3>
                                        )}
                                        
                                        {/* Action Buttons (Hover) */}
                                        <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 no-print">
                                            <button onClick={() => onExplain(item)} className="p-1.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="AI Explain">
                                                <SparklesIcon className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleCopy(item.content)} className="p-1.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                                                <CopyIcon className="w-3 h-3" />
                                            </button>
                                            {code && (
                                                <button onClick={() => onFixCode(code)} className="p-1.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Debug Code">
                                                    <CodeIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Content */}
                                    <div className="text-sm leading-relaxed text-muted-foreground">
                                        {isEditing ? (
                                            <textarea 
                                                value={item.content} 
                                                onChange={(e) => handleChange(sIdx, iIdx, 'content', e.target.value)} 
                                                className="w-full h-full min-h-[100px] bg-secondary/50 p-2 rounded font-mono text-sm border-none outline-none resize-none" 
                                            />
                                        ) : (
                                            <div>
                                                {parts.map((part, partIdx) => {
                                                    if (partIdx % 2 === 1) {
                                                        return <MermaidDiagram key={partIdx} chart={part} />;
                                                    }
                                                    if (!part || (typeof part === 'string' && !part.trim())) return null;
                                                    return (
                                                        <div 
                                                          key={partIdx}
                                                          className="prose prose-sm prose-neutral dark:prose-invert max-w-none" 
                                                          dangerouslySetInnerHTML={{ __html: parseMarkdown(part, { handleLatex: true }) }} 
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
          })}
        </div>
      </div>
      
      <style>{`
        #cheat-sheet-container .prose pre {
            background: var(--secondary);
            border: 1px solid var(--border);
            color: var(--foreground);
            padding: 1rem;
            border-radius: 0.5rem;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default CheatSheetDisplay;
