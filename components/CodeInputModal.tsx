import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { BugIcon } from './icons/BugIcon';
import { CodeIcon } from './icons/CodeIcon';

type SupportedLanguage = 'javascript' | 'python' | 'html';

interface CodeInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDebug: (code: string, language: string) => void;
}

const CodeInputModal: React.FC<CodeInputModalProps> = ({ isOpen, onClose, onDebug }) => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState<SupportedLanguage>('javascript');

    useEffect(() => {
        if(isOpen) {
            setCode('');
            setLanguage('javascript');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDebugClick = () => {
        if (code.trim()) {
            onDebug(code, language);
        }
    };
    
    const languages: { id: SupportedLanguage; label: string; icon: string }[] = [
      { id: 'javascript', label: 'JavaScript', icon: 'JS' },
      { id: 'python', label: 'Python', icon: 'PY' },
      { id: 'html', label: 'HTML/CSS', icon: '<>' },
    ];

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-0 md:p-6 no-print" aria-modal="true" role="dialog">
            <div className="bg-background border border-border md:rounded-xl shadow-2xl w-full h-full md:max-w-5xl flex flex-col overflow-hidden animate-fade-in">
                
                {/* Header */}
                <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-background z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground text-background rounded-lg">
                            <CodeIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">Code Injection</h2>
                            <p className="text-xs text-muted-foreground font-mono">Paste snippet for analysis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-6 flex-grow flex flex-col gap-6 bg-secondary/20 relative z-10">
                     <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 pl-1">Target Language</label>
                        <div className="flex gap-2 p-1 bg-background rounded-lg border border-border w-fit">
                          {languages.map((lang) => (
                            <button
                              key={lang.id}
                              onClick={() => setLanguage(lang.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                language === lang.id 
                                ? 'bg-foreground text-background shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                              }`}
                            >
                              <span className="font-mono opacity-80">{lang.icon}</span>
                              {lang.label}
                            </button>
                          ))}
                        </div>
                    </div>
                    
                    <div className="flex-grow flex flex-col relative group min-h-0">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Editor Buffer</label>
                            <span className="text-[10px] font-mono text-muted-foreground">{code.length} chars</span>
                        </div>
                        
                        <div className="relative flex-grow rounded-lg overflow-hidden border border-border bg-background shadow-sm focus-within:border-foreground transition-colors">
                            {/* Editor Gutter */}
                            <div className="absolute top-0 left-0 bottom-0 w-10 bg-secondary/50 border-r border-border flex flex-col items-end pt-4 pr-3 text-muted-foreground font-mono text-[10px] select-none pointer-events-none">
                                {Array.from({length: 10}).map((_, i) => <div key={i} className="leading-6">{i + 1}</div>)}
                            </div>

                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder={`// Paste your broken code here...\n\nfunction calculateTotal(items) {\n  let total = 0;\n  // Missing loop logic?\n  return total;\n}`}
                                className="w-full h-full bg-transparent p-4 pl-12 font-mono text-xs md:text-sm text-foreground placeholder-muted-foreground focus:outline-none transition-all resize-none leading-6 custom-scrollbar"
                                spellCheck="false"
                                autoCapitalize="off"
                                autoComplete="off"
                                autoCorrect="off"
                            />
                        </div>
                    </div>
                </div>

                <footer className="px-6 py-4 bg-background border-t border-border flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDebugClick}
                        disabled={!code.trim()}
                        className="flex items-center justify-center px-6 py-2 text-sm font-bold text-background bg-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <BugIcon className="w-4 h-4 mr-2" />
                        Initialize Debugger
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CodeInputModal;