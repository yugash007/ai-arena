
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { NetworkIcon } from './icons/NetworkIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { SaveIcon } from './icons/SaveIcon';
import MermaidDiagram from './MermaidDiagram';

interface ConceptMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    mapData: string | null;
    isLoading: boolean;
}

const ConceptMapModal: React.FC<ConceptMapModalProps> = ({ isOpen, onClose, mapData, isLoading }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Reset view when data changes or modal opens
    useEffect(() => {
        if (isOpen && mapData) {
            setScale(0.8); // Start slightly zoomed out to see structure
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen, mapData]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.2, scale + scaleAmount), 5);
        setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.2));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleDownload = () => {
        const svg = contentRef.current?.querySelector('svg');
        if (svg) {
            // Clone the SVG to modify it for export without affecting the display
            const clone = svg.cloneNode(true) as SVGElement;
            
            // Ensure size attributes are set for the file
            const bbox = svg.getBoundingClientRect();
            clone.setAttribute('width', bbox.width.toString());
            clone.setAttribute('height', bbox.height.toString());
            // Use the soft slate background for export
            clone.style.backgroundColor = '#0f172a'; 

            const svgData = new XMLSerializer().serializeToString(clone);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `concept-map-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex justify-center items-center p-0 md:p-6 no-print backdrop-blur-xl" aria-modal="true" role="dialog">
            <div className="relative w-full h-full md:rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-700/50 flex flex-col group">
                
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30 pointer-events-none">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center backdrop-blur-md shadow-lg shadow-indigo-500/10">
                            <NetworkIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Concept Topology</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-xs text-indigo-300/80 font-mono tracking-wider uppercase">Live Neural Map</p>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose} 
                        className="pointer-events-auto p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-all backdrop-blur-md"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Main Canvas */}
                <div 
                    ref={containerRef}
                    className="flex-grow relative overflow-hidden bg-slate-900 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    {/* Dynamic Grid Background - Lighter/Softer */}
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, #94a3b8 1px, transparent 1px),
                                linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px',
                            transform: `translate(${position.x % 40}px, ${position.y % 40}px) scale(${scale})`,
                            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                        }}
                    ></div>

                    {isLoading ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-3 border-r-4 border-purple-500 rounded-full animate-spin-reverse"></div>
                                <div className="absolute inset-6 border-b-4 border-cyan-500 rounded-full animate-spin"></div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Synthesizing Network</h3>
                            <p className="text-slate-400 font-mono text-sm animate-pulse">Mapping semantic relationships...</p>
                         </div>
                    ) : mapData ? (
                        <div 
                            ref={contentRef}
                            style={{ 
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
                                transformOrigin: 'center',
                                transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0,0,0.2,1)'
                            }} 
                            className="w-full h-full flex items-center justify-center min-h-full min-w-full p-20"
                        >
                            <MermaidDiagram chart={mapData} className="pointer-events-none select-none filter drop-shadow-xl" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
                            <p className="font-mono text-sm border border-dashed border-slate-700 p-4 rounded-lg">No map data generated.</p>
                        </div>
                    )}
                </div>

                {/* Floating Command Palette */}
                {!isLoading && mapData && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-2 rounded-2xl bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl animate-fade-in-up">
                        <div className="flex items-center gap-1 pr-2 border-r border-slate-700/50 mr-2">
                             <span className="text-xs font-mono font-bold text-indigo-400 px-3 min-w-[4rem] text-center">
                                {Math.round(scale * 100)}%
                             </span>
                        </div>
                        
                        <button onClick={handleZoomOut} className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors tooltip-trigger" title="Zoom Out">
                            <ZoomOutIcon className="w-5 h-5" />
                        </button>
                        
                        {/* Range Slider for Zoom */}
                        <div className="w-24 px-2 hidden sm:block">
                            <input 
                                type="range" 
                                min="0.2" 
                                max="5" 
                                step="0.1" 
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        <button onClick={handleZoomIn} className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors tooltip-trigger" title="Zoom In">
                            <ZoomInIcon className="w-5 h-5" />
                        </button>
                        
                        <button onClick={handleReset} className="p-2.5 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors tooltip-trigger" title="Reset View">
                            <RefreshIcon className="w-5 h-5" />
                        </button>

                        <div className="w-px h-6 bg-slate-700/50 mx-1"></div>

                        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                            <SaveIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                .animate-spin-reverse { animation: spin-reverse 3s linear infinite; }
                @keyframes spin-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: #6366f1;
                    cursor: pointer;
                    margin-top: -4px;
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 4px;
                    cursor: pointer;
                    background: #334155;
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
};

export default ConceptMapModal;
