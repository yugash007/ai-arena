
import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { TrashIcon } from './icons/TrashIcon';
import { parseMarkdown } from '../utils/markdownParser';
import type { ChatMessage, SavedCheatSheet } from '../types';
import { chatWithStudyBuddy } from '../services/geminiService';

interface StudyBuddySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeSheet: (Omit<SavedCheatSheet, 'id'> & { id?: string }) | null;
}

const HISTORY_KEY = 'ai_study_buddy_history';

const StudyBuddySidebar: React.FC<StudyBuddySidebarProps> = ({ isOpen, onClose, activeSheet }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load History on Mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) {
                setMessages(JSON.parse(saved));
            } else {
                 setMessages([{ id: 'init', role: 'model', text: "Hi! I'm your Study Buddy. I can explain concepts, quiz you, or just help you stay focused. What are we working on?", timestamp: Date.now() }]);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, []);

    // Save History on Update
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, messages]);

    // Context changes when active sheet changes
    useEffect(() => {
        if (activeSheet) {
            const lastMsg = messages[messages.length - 1];
            // Only add context message if the last message wasn't the same context prompt
            if (lastMsg && !lastMsg.text.includes(activeSheet.filename)) {
                setMessages(prev => [...prev, { 
                    id: `ctx-${Date.now()}`, 
                    role: 'model', 
                    text: `I see you're looking at **${activeSheet.filename}**. I've loaded it into my context. Ask me anything about it!`, 
                    timestamp: Date.now() 
                }]);
            }
        }
    }, [activeSheet?.id]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Prepare context from active sheet
            const context = activeSheet 
                ? JSON.stringify(activeSheet.content) 
                : "No specific document loaded.";

            const responseText = await chatWithStudyBuddy(messages, input, context);
            
            const aiMsg: ChatMessage = { id: uuidv4(), role: 'model', text: responseText, timestamp: Date.now() };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = { id: uuidv4(), role: 'model', text: "I'm having trouble connecting right now. Try again?", timestamp: Date.now() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearHistory = () => {
        const initMsg: ChatMessage = { id: 'init', role: 'model', text: "Memory wiped. I'm ready for a fresh start! What are we studying?", timestamp: Date.now() };
        setMessages([initMsg]);
        localStorage.removeItem(HISTORY_KEY);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Helper UUID generator locally if not imported
    const uuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 h-full w-full md:w-[400px] z-50 bg-[#0B0E14]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b border-white/5 bg-[#0B0E14]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <SparklesIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Study Buddy</h2>
                        <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online & Persisting
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleClearHistory} className="p-2 rounded-full text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors" title="Clear Memory">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f1219]">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-lg' 
                            : 'bg-[#1e232e] text-slate-200 border border-white/5 rounded-bl-none shadow'
                        }`}>
                            <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }} />
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-[#1e232e] rounded-2xl rounded-bl-none p-4 flex gap-1 items-center border border-white/5">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#0B0E14] border-t border-white/5">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your notes..."
                        className="w-full bg-[#1e232e] text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-12 max-h-32 custom-scrollbar border border-white/5 focus:border-indigo-500/50"
                        rows={1}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudyBuddySidebar;
