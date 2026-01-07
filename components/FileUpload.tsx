import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { useToast } from '../contexts/ToastContext';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const SUPPORTED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'video/mp4',
  'video/webm'
];
const MAX_FILE_SIZE_MB = 50; 
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (file) {
      if (!SUPPORTED_TYPES.includes(file.type)) {
        addToast("Unsupported format.", "error");
        setFileName(null);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        addToast(`File too large.`, "error");
        setFileName(null);
      } else {
        setIsScanning(true);
        setTimeout(() => {
            setFileName(file.name);
            onFileSelect(file);
            setIsScanning(false);
        }, 1200); // Fake scan delay for effect
      }
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, [onFileSelect, addToast]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); };

  return (
    <div className="relative group w-full">
      {!fileName ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative h-64 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden border border-dashed ${
            isDragging 
              ? 'border-foreground bg-secondary/50 scale-[1.01]' 
              : 'border-border bg-background/50 hover:bg-secondary/30 hover:border-foreground/50'
          }`}
        >
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 grid-pattern opacity-[0.03] pointer-events-none"></div>
          
          {/* Scan Line Effect on Drag */}
          {(isDragging || isScanning) && <div className="scan-line z-10"></div>}

          <input type="file" ref={fileInputRef} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" accept={SUPPORTED_TYPES.join(',')} />
          
          <div className={`mb-6 transition-all duration-300 p-4 rounded-full bg-secondary border border-border group-hover:scale-110 ${isDragging ? 'scale-110 bg-foreground text-background border-transparent' : 'text-foreground'}`}>
            <UploadIcon className="w-6 h-6" />
          </div>
          
          <div className="text-center z-10 space-y-2">
              <p className="text-lg font-bold text-foreground tracking-tight">
                {isScanning ? "Analyzing Structure..." : isDragging ? "Drop Data Stream" : "Initialize Input"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {isScanning ? "Please wait" : "PDF • DOCX • AUDIO • VIDEO"}
              </p>
          </div>
        </div>
      ) : (
         <div className="relative overflow-hidden p-6 bg-background/50 border border-foreground/20 rounded-2xl flex items-center justify-between group animate-fade-in">
             {/* Subtle success glow */}
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex items-center gap-4 relative z-10 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shrink-0">
                    <CheckCircleIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Ready for Analysis</p>
                    <span className="text-sm font-bold text-foreground truncate block">{fileName}</span>
                </div>
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); setFileName(null); }}
                className="relative z-10 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
                Reset
            </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;