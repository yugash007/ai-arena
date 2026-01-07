
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Determine current theme for Mermaid configuration
    const isDark = document.documentElement.classList.contains('dark');
    
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: {
         darkMode: isDark,
         background: 'transparent', // Allow container bg to show through
         
         // Student-Friendly Palette
         // Root / Primary Nodes
         primaryColor: isDark ? '#4f46e5' : '#6366f1', // Indigo
         primaryTextColor: isDark ? '#f8fafc' : '#0f172a', // Slate-50/900
         primaryBorderColor: isDark ? '#818cf8' : '#4338ca', // Indigo-400/700
         
         // Secondary Nodes / Branches
         secondaryColor: isDark ? '#059669' : '#10b981', // Emerald
         secondaryTextColor: isDark ? '#f8fafc' : '#0f172a',
         secondaryBorderColor: isDark ? '#34d399' : '#059669',
         
         // Tertiary Nodes
         tertiaryColor: isDark ? '#d97706' : '#f59e0b', // Amber
         tertiaryTextColor: isDark ? '#f8fafc' : '#0f172a',
         tertiaryBorderColor: isDark ? '#fbbf24' : '#d97706',

         // Connectors
         lineColor: isDark ? '#94a3b8' : '#64748b', // Slate-400/500
         
         // Mindmap specific overrides (if supported by renderer)
         mindmapShapeColor: isDark ? '#1e293b' : '#ffffff',
         fontSize: '14px'
      }
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current || !chart || typeof chart !== 'string') return;
      
      try {
        setError(null);
        let cleanChart = chart
            // Remove markdown code fences
            .replace(/```mermaid/g, '')
            .replace(/```/g, '')
            // Convert literal string newlines to actual newlines (handles JSON escape issues)
            .replace(/\\n/g, '\n')
            .trim();
            
        // Robustly find the start of the diagram to ignore any AI preamble
        const typeMatch = cleanChart.match(/^(graph|flowchart|mindmap|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|gantt|pie|timeline|journey|gitGraph)/m);
        if (typeMatch && typeMatch.index !== undefined) {
             cleanChart = cleanChart.substring(typeMatch.index);
        }

        // Fix: Ensure 'graph TD' and 'classDef' are separated by a newline if they got squashed
        cleanChart = cleanChart.replace(/^(graph\s+[A-Za-z0-9\-_]+)\s+(classDef)/gmi, '$1\n$2');
        
        // Fix: Ensure space between graph and direction (e.g. graphTD -> graph TD)
        cleanChart = cleanChart.replace(/^graph([A-Za-z0-9]+)/gmi, 'graph $1');

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: svgContent } = await mermaid.render(id, cleanChart);
        setSvg(svgContent);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError("Diagram structure invalid.");
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
        <div className="p-4 rounded border border-destructive/20 text-destructive text-xs font-mono text-center">
            {error}
        </div>
    );
  }

  const containerClass = className 
    ? className 
    : "my-6 overflow-x-auto rounded-lg bg-secondary/30 border border-border p-6 flex justify-center";

  return (
    <div className={containerClass}>
      <div 
        ref={containerRef} 
        dangerouslySetInnerHTML={{ __html: svg }} 
        className="mermaid-container w-full h-full flex justify-center items-center"
      />
    </div>
  );
};

export default MermaidDiagram;
