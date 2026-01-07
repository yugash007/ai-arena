import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CloseIcon } from './icons/CloseIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CopyIcon } from './icons/CopyIcon';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signup, login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<{title: string, message: string, steps?: string[], domain?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleError = (err: any) => {
    console.error("Auth Error:", err);
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      setIsLoading(false);
      return;
    }

    const isUnauthorizedDomain = err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain');
    if (isUnauthorizedDomain) {
      const domain = window.location.hostname || window.location.host || 'localhost';
      setError({
        title: 'Authorization Required',
        message: `The domain "${domain}" is not whitelisted in the Firebase project.`,
        domain: domain,
        steps: [
          '1. Open Firebase Console > Authentication > Settings.',
          '2. Go to "Authorized Domains".',
          '3. Click "Add Domain" and paste the domain below.',
        ]
      });
      return;
    }

    let title = "Authentication Failed";
    let message = err.message || 'An unexpected error occurred.';

    if (err?.code === 'auth/email-already-in-use') message = "That email is already in use.";
    if (err?.code === 'auth/wrong-password') message = "Incorrect password.";
    if (err?.code === 'auth/user-not-found') message = "No account found with this email.";
    if (err?.code === 'auth/weak-password') message = "Password should be at least 6 characters.";

    setError({ title, message });
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && password !== confirmPassword) {
      setError({ title: "Validation Error", message: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDomain = () => {
      if (error?.domain) {
          navigator.clipboard.writeText(error.domain);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetState();
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print" aria-modal="true" role="dialog">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-fade-in">
        
        <header className="flex justify-between items-center px-6 py-4 border-b border-border">
          <div>
              <h2 className="text-lg font-bold text-foreground">Authentication</h2>
              <p className="text-xs text-muted-foreground font-mono">Secure Access Gateway</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6">
            {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 mb-6">
                    <h3 className="text-red-500 font-bold text-xs mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {error.title}
                    </h3>
                    <p className="text-foreground text-xs mb-3 font-medium">{error.message}</p>
                    
                    {error.domain && (
                        <div className="flex items-center gap-2 bg-secondary border border-border rounded p-2 mb-3 group">
                            <code className="flex-1 font-mono text-[10px] text-foreground px-2 truncate">
                                {error.domain}
                            </code>
                            <button 
                                onClick={handleCopyDomain}
                                className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy Domain"
                            >
                                {copied ? <CheckCircleIcon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                            </button>
                        </div>
                    )}

                    {error.steps && (
                        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                            <ul className="text-[10px] text-muted-foreground space-y-1.5 font-mono">
                                {error.steps.map((step, i) => <li key={i}>{step}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Email</label>
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors">
                      <MailIcon />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="user@example.com"
                      className="w-full bg-secondary/30 border border-border text-foreground text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-foreground focus:bg-background transition-all placeholder-muted-foreground/50"
                    />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Password</label>
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors">
                      <LockIcon />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-secondary/30 border border-border text-foreground text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-foreground focus:bg-background transition-all placeholder-muted-foreground/50"
                    />
                 </div>
              </div>

              {isSignUp && (
                <div className="space-y-1 animate-fade-in">
                   <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Confirm Password</label>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors">
                        <LockIcon />
                      </div>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-secondary/30 border border-border text-foreground text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-foreground focus:bg-background transition-all placeholder-muted-foreground/50"
                      />
                   </div>
                </div>
              )}

              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-foreground text-background font-bold py-2.5 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed mt-2 transition-all"
              >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
                          <SpinnerIcon className="w-4 h-4 animate-spin" />
                      ) : (
                          <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      )}
                  </div>
              </button>
            </form>
            
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-bold">Or continue with</span>
                </div>
            </div>

            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-secondary text-foreground font-bold py-2.5 rounded-lg transition-all hover:bg-border disabled:opacity-70 disabled:cursor-not-allowed border border-border"
            >
                 <GoogleIcon />
                 <span>Google</span>
            </button>

            <div className="mt-6 text-center">
                <button 
                  onClick={toggleMode}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium underline underline-offset-4"
                >
                  {isSignUp 
                    ? "Already have an account? Login." 
                    : "New here? Create an account."}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;