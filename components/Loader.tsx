import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface LoaderProps {
    step?: number;
}

const steps = [
    { id: 1, label: "Extracting Context", subtext: "Parsing document structure" },
    { id: 2, label: "Neural Analysis", subtext: "Identifying key patterns & logic" },
    { id: 3, label: "Synthesizing Output", subtext: "Formatting intelligence data" }
];

const Loader: React.FC<LoaderProps> = ({ step = 1 }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 no-print animate-fade-in w-full max-w-md mx-auto">
       <div className="relative w-full max-w-sm">
           {/* Connecting Line */}
           <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-secondary -z-10"></div>
           
           <div className="space-y-8">
               {steps.map((s) => {
                   const isActive = step === s.id;
                   const isCompleted = step > s.id;
                   const isPending = step < s.id;

                   return (
                       <div key={s.id} className={`flex items-start gap-4 transition-all duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                           <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 shrink-0 bg-background
                               ${isActive ? 'border-foreground shadow-[0_0_15px_rgba(var(--foreground),0.3)] scale-110' : ''}
                               ${isCompleted ? 'border-foreground bg-foreground text-background' : ''}
                               ${isPending ? 'border-border' : ''}
                           `}>
                               {isCompleted ? (
                                   <CheckCircleIcon className="w-5 h-5" />
                               ) : isActive ? (
                                   <SpinnerIcon className="w-5 h-5 animate-spin" />
                               ) : (
                                   <span className="text-xs font-bold font-mono text-muted-foreground">{s.id}</span>
                               )}
                           </div>
                           
                           <div className={`pt-1 transition-all duration-500 ${isActive ? 'translate-x-1' : ''}`}>
                               <h3 className={`text-sm font-bold uppercase tracking-widest ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                   {s.label}
                               </h3>
                               <p className="text-xs text-muted-foreground font-mono mt-1">
                                   {isActive ? "Processing..." : s.subtext}
                               </p>
                           </div>
                       </div>
                   );
               })}
           </div>
       </div>

       <div className="mt-12 text-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] animate-pulse">
                AI Engine Active
            </p>
       </div>
    </div>
  );
};

export default Loader;