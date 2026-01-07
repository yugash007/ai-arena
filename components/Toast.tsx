import React, { useState, useEffect } from 'react';
import type { Toast as ToastType } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CloseIcon } from './icons/CloseIcon';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
)

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            const removeTimer = setTimeout(() => onRemove(toast.id), 300); // Wait for animation
            return () => clearTimeout(removeTimer);
        }, 5000);

        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);
    
    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const isError = toast.type === 'error';
    const baseClasses = "relative flex items-center w-full max-w-sm p-4 text-sm font-semibold rounded-xl shadow-lg card-glow";
    const typeClasses = isError 
        ? "bg-red-900/30 text-red-200"
        : "bg-green-900/30 text-green-200";

    return (
        <div className={`${baseClasses} ${typeClasses} toast ${isExiting ? 'exiting' : ''}`} role="alert">
            <div className={`mr-3 ${isError ? 'text-red-500' : 'text-green-500'}`}>
                {isError ? <ErrorIcon /> : <CheckCircleIcon />}
            </div>
            <p className="flex-1">{toast.message}</p>
             <button onClick={handleRemove} className="ml-3 p-1 rounded-full hover:bg-white/10" aria-label="Close notification">
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;