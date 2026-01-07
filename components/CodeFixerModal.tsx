import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import type { CodeFixResult } from '../types';
import { useToast } from '../contexts/ToastContext';
import { CopyIcon } from './icons/CopyIcon';
import { parseMarkdown } from '../utils/markdownParser';
import { BugIcon } from './icons/BugIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface CodeFixerModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: {
        originalCode: string;
        result: CodeFixResult | null;
    };
    isLoading: boolean;
}

// --- Diff Logic (Preserved) ---

interface DiffChunk {
    value: string;
    type: 'common' | 'added' | 'removed';
}

const generateCharacterDiff = (original: string, corrected: string): { old: DiffChunk[], new: DiffChunk[] } => {
    const matrix = Array(original.length + 1).fill(null).map(() => Array(corrected.length + 1).fill(0));
    for (let i = 1; i <= original.length; i++) {
        for (let j = 1; j <= corrected.length; j++) {
            matrix[i][j] = original[i - 1] === corrected[j - 1]
                ? matrix[i - 1][j - 1] + 1
                : Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
    }

    let i = original.length, j = corrected.length;
    const oldChunks: DiffChunk[] = [], newChunks: DiffChunk[] = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && original[i - 1] === corrected[j - 1]) {
            oldChunks.unshift({ value: original[i - 1], type: 'common' });
            newChunks.unshift({ value: corrected[j - 1], type: 'common' });
            i--; j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            newChunks.unshift({ value: corrected[j - 1], type: 'added' });
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
            oldChunks.unshift({ value: original[i - 1], type: 'removed' });
            i--;
        }
    }
    
    const merge = (chunks: DiffChunk[]) => chunks.reduce((acc, chunk) => {
        if (acc.length > 0 && acc[acc.length - 1].type === chunk.type) {
            acc[acc.length - 1].value += chunk.value;
        } else {
            acc.push({ ...chunk });
        }
        return acc;
    }, [] as DiffChunk[]);

    return { old: merge(oldChunks), new: merge(newChunks) };
};

const generateLineDiff = (original: string, corrected: string) => {
    const originalLines = original.split('\n');
    const correctedLines = corrected.split('\n');
    const matrix = Array(originalLines.length + 1).fill(null).map(() => Array(correctedLines.length + 1).fill(0));

    for (let i = 1; i <= originalLines.length; i++) {
        for (let j = 1; j <= correctedLines.length; j++) {
            matrix[i][j] = originalLines[i - 1] === correctedLines[j - 1]
                ? matrix[i - 1][j - 1] + 1
                : Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
    }

    let i = originalLines.length, j = correctedLines.length;
    const diff = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && originalLines[i - 1] === correctedLines[j - 1]) {
            diff.unshift({ value: originalLines[i - 1], type: 'common', oldLine: i, newLine: j });
            i--; j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            diff.unshift({ value: correctedLines[j - 1], type: 'added', newLine: j });
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
            diff.unshift({ value: originalLines[i - 1], type: 'removed', oldLine: i });
            i--;
        } else { break; }
    }
    return diff;
};

// --- Component ---

const DiffViewer: React.FC<{ original: string; corrected: string; onCopy: () => void; }> = ({ original, corrected, onCopy }) => {
    const lineDiff = generateLineDiff(original, corrected);
    const renderableDiff = [];
    
    for(let i = 0; i < lineDiff.length; i++) {
        const current = lineDiff[i];
        const next = lineDiff[i+1];
        if (current.type === 'removed' && next?.type === 'added') {
            const { old: oldChunks, new: newChunks } = generateCharacterDiff(current.value, next.value);
            renderableDiff.push({
                type: 'modified',
                oldLine: current.oldLine,
                newLine: next.newLine,
                oldChunks,
                newChunks
            });
            i++; 
        } else {
            renderableDiff.push(current);
        }
    }
    
    return (
        <div className="rounded-lg border border-border bg-card shadow-sm font-mono text-xs md:text-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex justify-between items-center px-4 py-2 bg-secondary border-b border-border">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-xs font-medium text-muted-foreground">Deleted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-medium text-muted-foreground">Added</span>
                    </div>
                </div>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-foreground bg-background hover:bg-secondary border border-border rounded-md transition-all"
                >
                    <CopyIcon className="w-3 h-3" />
                    Copy Code
                </button>
            </div>

            {/* Diff Content */}
            <div className="overflow-x-auto custom-scrollbar max-h-[60vh] bg-card">
                <table className="w-full border-collapse">
                    <tbody className="divide-y divide-border">
                        {renderableDiff.map((line, index) => {
                            if (line.type === 'modified') {
                                return (
                                    <React.Fragment key={index}>
                                        {/* Removed Line */}
                                        <tr className="bg-red-500/10 dark:bg-red-900/20">
                                            <td className="w-10 px-2 py-1 text-right text-red-500/70 font-mono text-[10px] select-none border-r border-border bg-red-500/5">{line.oldLine}</td>
                                            <td className="w-10 px-2 py-1 text-right text-muted-foreground font-mono text-[10px] select-none border-r border-border bg-secondary/50"></td>
                                            <td className="px-4 py-1 whitespace-pre-wrap break-all text-foreground font-mono relative">
                                                {line.oldChunks.map((c, i) => (
                                                    <span key={i} className={c.type === 'removed' ? 'bg-red-500/20 rounded-[2px]' : ''}>{c.value}</span>
                                                ))}
                                            </td>
                                        </tr>
                                        {/* Added Line */}
                                        <tr className="bg-emerald-500/10 dark:bg-emerald-900/20">
                                            <td className="w-10 px-2 py-1 text-right text-muted-foreground font-mono text-[10px] select-none border-r border-border bg-secondary/50"></td>
                                            <td className="w-10 px-2 py-1 text-right text-emerald-500/70 font-mono text-[10px] select-none border-r border-border bg-emerald-500/5">{line.newLine}</td>
                                            <td className="px-4 py-1 whitespace-pre-wrap break-all text-foreground font-mono relative">
                                                {line.newChunks.map((c, i) => (
                                                    <span key={i} className={c.type === 'added' ? 'bg-emerald-500/20 rounded-[2px]' : ''}>{c.value}</span>
                                                ))}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            }
                            
                            const isAdded = line.type === 'added';
                            const isRemoved = line.type === 'removed';
                            
                            return (
                                <tr key={index} className={`
                                    transition-colors
                                    ${isAdded ? 'bg-emerald-500/10 dark:bg-emerald-900/20' : ''}
                                    ${isRemoved ? 'bg-red-500/10 dark:bg-red-900/20' : ''}
                                `}>
                                    <td className={`w-10 px-2 py-1 text-right font-mono text-[10px] select-none border-r border-border ${isAdded ? 'text-muted-foreground bg-card' : 'text-muted-foreground bg-secondary/30'}`}>
                                        {isAdded ? '' : line.oldLine}
                                    </td>
                                    <td className={`w-10 px-2 py-1 text-right font-mono text-[10px] select-none border-r border-border ${isRemoved ? 'text-muted-foreground bg-card' : 'text-muted-foreground bg-secondary/30'}`}>
                                        {isRemoved ? '' : line.newLine}
                                    </td>
                                    <td className="px-4 py-1 whitespace-pre-wrap break-all text-foreground font-mono relative">
                                        <span className={`inline-block w-4 select-none opacity-50 ${isAdded ? 'text-emerald-600' : isRemoved ? 'text-red-600' : 'invisible'}`}>
                                            {isAdded ? '+' : isRemoved ? '-' : ' '}
                                        </span>
                                        <span className={isRemoved ? 'opacity-50 line-through decoration-red-500/30' : ''}>{line.value}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CodeFixerModal: React.FC<CodeFixerModalProps> = ({ isOpen, onClose, content, isLoading }) => {
    const { addToast } = useToast();
    
    if (!isOpen) return null;
    
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        addToast("Fixed code copied to clipboard", "success");
    };

    const languageLabel = content.result?.language ? content.result.language.charAt(0).toUpperCase() + content.result.language.slice(1) : 'Code';

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-0 md:p-6 no-print" aria-modal="true" role="dialog">
            <div className="bg-background border border-border md:rounded-xl shadow-2xl w-full h-full md:max-w-7xl flex flex-col overflow-hidden animate-fade-in">
                
                {/* Header */}
                <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-background z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground text-background rounded-lg">
                            <BugIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                Debugger
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-foreground border border-border uppercase tracking-widest hidden sm:inline-block">
                                    AI
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground font-mono">
                                Environment: {languageLabel}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto bg-secondary/20 flex-grow">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <SpinnerIcon className="w-8 h-8 text-foreground mb-4" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Scanning Codebase</h3>
                            <p className="mt-2 text-xs text-muted-foreground font-mono">Analyzing syntax, logic, and patterns...</p>
                        </div>
                    ) : content.result ? (
                        <div className="space-y-6">
                            {/* Analysis Panel */}
                            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Diagnostic Report</h3>
                                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-foreground" 
                                             dangerouslySetInnerHTML={{ __html: parseMarkdown(content.result.explanation) }} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Diff Viewer */}
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-foreground rounded-full"></span>
                                    Patch Preview
                                </h3>
                                <DiffViewer
                                    original={content.originalCode}
                                    corrected={content.result.corrected_code}
                                    onCopy={() => handleCopy(content.result!.corrected_code)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-12 font-mono text-xs">No analysis data available.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CodeFixerModal;