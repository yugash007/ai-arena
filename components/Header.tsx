
import React, { useState } from 'react';
import { HistoryIcon } from './icons/HistoryIcon';
import { BookIcon } from './icons/BookIcon';
import { NexusIcon } from './icons/NexusIcon';
import { ChatIcon } from './icons/ChatIcon';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoginModal from './LoginModal';

interface HeaderProps {
    onOpenSavedSheets: () => void;
    onOpenNexus: () => void;
    onToggleStudyBuddy: () => void;
    isDark: boolean;
    toggleTheme: () => void;
    hasSavedSheets: boolean;
    onOpenProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSavedSheets, onOpenNexus, onToggleStudyBuddy, isDark, toggleTheme, hasSavedSheets, onOpenProfile }) => {
  const { currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileMenuOpen(false);
      addToast("Logged out successfully", "success");
    } catch (error: any) {
      addToast("Logout failed: " + error.message, "error");
    }
  };

  return (
    <>
        <header className="sticky top-4 z-40 px-4 md:px-0 mb-8 pointer-events-none">
          <div className="container mx-auto max-w-5xl">
              <div className="h-14 md:h-16 flex items-center justify-between bg-background/60 backdrop-blur-xl border border-border/50 rounded-full px-6 shadow-sm pointer-events-auto transition-all duration-300 hover:shadow-md hover:border-border">
                  
                  {/* Logo Section */}
                  <div className="flex items-center gap-3 group cursor-default">
                      <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <BookIcon className="w-3.5 h-3.5 text-background" />
                      </div>
                      <span className="text-sm font-bold tracking-tight text-foreground hidden sm:block">
                          AI ARENA
                      </span>
                  </div>
                  
                  {/* Actions Section */}
                  <div className="flex items-center gap-1 md:gap-2">
                       <button
                          onClick={onOpenNexus}
                          className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                          title="Open Learning Nexus"
                        >
                          <NexusIcon className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                          <span className="hidden md:inline">Nexus</span>
                          {!hasSavedSheets && <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full ml-1 animate-pulse"></span>}
                       </button>

                       <button
                          onClick={onToggleStudyBuddy}
                          className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                          title="Toggle Study Buddy"
                        >
                          <ChatIcon className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                          <span className="hidden md:inline">Buddy</span>
                       </button>

                       <button
                          onClick={onOpenSavedSheets}
                          className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        >
                          <HistoryIcon className="w-4 h-4" />
                          <span className="hidden md:inline">Library</span>
                        </button>

                       <div className="w-px h-4 bg-border mx-2"></div>
                       
                       <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

                       {currentUser ? (
                          <div className="relative">
                            <button
                              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                              className="flex items-center gap-2 pl-2"
                            >
                              <img 
                                src={currentUser.photoURL || 'https://via.placeholder.com/32'} 
                                alt="User" 
                                className="w-8 h-8 rounded-full ring-2 ring-border grayscale hover:grayscale-0 transition-all cursor-pointer object-cover"
                                title={currentUser.displayName || 'User Profile'}
                              />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Account</p>
                                  <p className="text-sm font-semibold text-foreground mt-1">{currentUser.displayName || 'User'}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{currentUser.email}</p>
                                </div>
                                
                                <button
                                  onClick={() => {
                                    onOpenProfile();
                                    setIsProfileMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors border-b border-border"
                                >
                                  ⚙️ Settings & Profile
                                </button>
                                
                                <button
                                  onClick={handleLogout}
                                  className="w-full text-left px-4 py-2.5 text-sm text-orange-500 hover:bg-orange-500/10 transition-colors font-semibold"
                                >
                                  ↗ Logout
                                </button>
                              </div>
                            )}
                          </div>
                       ) : (
                          <button
                            onClick={() => setIsLoginModalOpen(true)}
                            className="ml-2 bg-foreground text-background hover:opacity-90 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-foreground/10"
                          >
                            Connect
                          </button>
                       )}
                  </div>
              </div>
          </div>
        </header>

        <LoginModal 
            isOpen={isLoginModalOpen} 
            onClose={() => setIsLoginModalOpen(false)} 
        />
    </>
  );
};

export default Header;
