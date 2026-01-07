import React from 'react';
import type { OutputStyle } from '../types';

interface OutputStyleSelectorProps {
  selectedStyle: OutputStyle;
  onStyleChange: (style: OutputStyle) => void;
}

const styles: { id: OutputStyle; label: string; description: string }[] = [
  { id: 'Concise', label: 'Concise', description: 'High-yield formulas & key facts only. Maximum density.' },
  { id: 'Standard', label: 'Standard', description: 'Balanced coverage of theory, application, and diagrams.' },
  { id: 'Detailed', label: 'Detailed', description: 'Deep dive with extensive explanations and Mermaid flowcharts.' },
  { id: 'Formula-heavy', label: 'Formula Matrix', description: 'Prioritizes mathematical derivations, constants, and code.' },
  { id: 'Definition-heavy', label: 'Lexicon', description: 'Focus on vocabulary, taxonomy, and core distinctions.' },
];

const OutputStyleSelector: React.FC<OutputStyleSelectorProps> = ({ selectedStyle, onStyleChange }) => {
  return (
    <div className="space-y-3">
        {styles.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
                <button
                    key={style.id}
                    onClick={() => onStyleChange(style.id)}
                    className={`relative w-full group flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 outline-none
                        ${isSelected 
                            ? 'border-foreground bg-foreground/5 shadow-[0_0_20px_-12px_rgba(var(--foreground),0.3)]' 
                            : 'border-border bg-secondary/30 hover:bg-secondary hover:border-foreground/30'
                        }
                    `}
                >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0
                        ${isSelected ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground/30 bg-transparent'}
                    `}>
                        {isSelected && <div className="w-2 h-2 bg-background rounded-full" />}
                    </div>
                    
                    <div>
                        <span className={`block text-sm font-bold transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {style.label}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1 leading-relaxed font-medium opacity-80">
                            {style.description}
                        </span>
                    </div>
                </button>
            )
        })}
    </div>
  );
};

export default OutputStyleSelector;