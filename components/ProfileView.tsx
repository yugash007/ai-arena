
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ProfileViewProps {
    onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
    const { currentUser, updateUserProfile, updateUserPassword, deleteUserAccount, logout } = useAuth();
    const { addToast } = useToast();
    
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthError = async (error: any) => {
        if (error.code === 'auth/requires-recent-login') {
            addToast("Security Check: Please sign out and sign in again to perform this sensitive action.", "error");
            // Optional: Auto-logout? 
            // await logout(); 
        } else {
            addToast("Operation failed: " + error.message, "error");
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Firebase prefers null over empty string for photoURL
            const cleanPhotoURL = photoURL.trim() === '' ? undefined : photoURL;
            // Note: updateUserProfile context method might need to handle 'undefined' vs string.
            // Assuming the context wrapper passes it through or we fix it here.
            await updateUserProfile(displayName, cleanPhotoURL || "");
            addToast("Profile updated successfully", "success");
        } catch (error: any) {
            await handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            addToast("Password must be at least 6 characters", "error");
            return;
        }
        setIsLoading(true);
        try {
            await updateUserPassword(newPassword);
            setNewPassword('');
            addToast("Password updated successfully", "success");
        } catch (error: any) {
            await handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
            addToast("Logged out successfully", "success");
            onBack();
        } catch (error: any) {
            addToast("Logout failed: " + error.message, "error");
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure? This action is irreversible and will delete all your saved data.")) {
            setIsLoading(true);
            try {
                await deleteUserAccount();
                onBack(); 
                addToast("Account deleted", "success");
            } catch (error: any) {
                await handleAuthError(error);
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in-up">
            <button onClick={onBack} className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                ← Back to Dashboard
            </button>
            
            <div className="grid gap-8">
                <div className="flex items-center gap-6">
                    <img 
                        src={currentUser?.photoURL || 'https://via.placeholder.com/150'} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full ring-4 ring-border bg-secondary object-cover"
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">{currentUser?.displayName || 'User'}</h1>
                        <p className="text-muted-foreground font-mono text-sm">{currentUser?.email}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* General Settings */}
                    <div className="card-glow rounded-xl p-6 border border-border bg-background/50">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            General Settings
                        </h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Display Name</label>
                                <input 
                                    type="text" 
                                    value={displayName} 
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full mt-1 bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avatar URL</label>
                                <input 
                                    type="url" 
                                    value={photoURL} 
                                    onChange={(e) => setPhotoURL(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full mt-1 bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="px-4 py-2 bg-foreground text-background font-bold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading ? <SpinnerIcon className="w-4 h-4" /> : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Security */}
                    <div className="space-y-8">
                        <div className="card-glow rounded-xl p-6 border border-border bg-background/50">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                Security
                            </h2>
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New Password</label>
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full mt-1 bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !newPassword}
                                    className="px-4 py-2 bg-secondary text-foreground font-bold text-sm rounded-lg hover:bg-border transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading ? <SpinnerIcon className="w-4 h-4" /> : 'Update Password'}
                                </button>
                            </form>
                        </div>

                        <div className="rounded-xl p-6 border border-orange-500/20 bg-orange-500/5">
                            <h2 className="text-lg font-bold text-orange-500 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                Session
                            </h2>
                            <button 
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/30 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <SpinnerIcon className="w-4 h-4" /> : '↗'}
                                Logout
                            </button>
                        </div>

                        <div className="rounded-xl p-6 border border-red-500/20 bg-red-500/5">
                            <h2 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                Danger Zone
                            </h2>
                            <p className="text-xs text-muted-foreground mb-4">
                                Permanently delete your account and all associated data. This cannot be undone.
                            </p>
                            <button 
                                onClick={handleDeleteAccount}
                                disabled={isLoading}
                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 font-bold text-sm rounded-lg transition-all flex items-center gap-2"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
