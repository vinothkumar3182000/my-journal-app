// Authentication Store using Zustand
import { auth } from '@/config/firebaseConfig';
import { useJournalStore } from '@/store/journalStore';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    User
} from 'firebase/auth';
import { create } from 'zustand';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: (idToken: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateDisplayName: (displayName: string) => Promise<void>;
    clearError: () => void;
    setUser: (user: User | null) => void;
    initAuth: () => (() => void) | undefined;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isInitialized: false,
    error: null,

    signUp: async (email: string, password: string, displayName: string) => {
        try {
            set({ isLoading: true, error: null });
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with display name
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(userCredential.user, { displayName });

            // Reload user to get updated profile with displayName
            await userCredential.user.reload();
            const updatedUser = auth.currentUser;

            set({
                user: updatedUser,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            // Sync to journal store
            // Sync to journal store
            if (displayName) {
                useJournalStore.getState().setUserName(displayName);
            }
        } catch (error: any) {
            let errorMessage = 'An error occurred during sign up';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection';
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }

            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    signIn: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            set({
                user: userCredential.user,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            // Sync displayName to journal store
            // Sync displayName to journal store
            if (userCredential.user.displayName) {
                useJournalStore.getState().setUserName(userCredential.user.displayName);
            }
        } catch (error: any) {
            let errorMessage = 'An error occurred during sign in';

            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Invalid email or password';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection';
                    break;
                case 'auth/api-key-not-valid':
                    errorMessage = 'Configuration Error: Invalid API Key';
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }

            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    signInWithGoogle: async (idToken: string) => {
        try {
            set({ isLoading: true, error: null });
            const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            set({
                user: userCredential.user,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            // Sync displayName to journal store
            // Sync displayName to journal store
            if (userCredential.user.displayName) {
                useJournalStore.getState().setUserName(userCredential.user.displayName);
            }
        } catch (error: any) {
            set({ error: error.message || 'Failed to sign in with Google', isLoading: false });
            throw error;
        }
    },

    signOut: async () => {
        try {
            set({ isLoading: true, error: null });
            await firebaseSignOut(auth);

            // Clear journal data from store when signing out
            useJournalStore.getState().clearData();

            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to sign out', isLoading: false });
            throw error;
        }
    },

    updateDisplayName: async (displayName: string) => {
        try {
            set({ isLoading: true, error: null });
            const currentUser = auth.currentUser;

            if (!currentUser) {
                throw new Error('No user is currently signed in');
            }

            const { updateProfile } = await import('firebase/auth');
            await updateProfile(currentUser, { displayName });

            // Reload to get updated profile
            await currentUser.reload();
            const updatedUser = auth.currentUser;

            set({
                user: updatedUser,
                isLoading: false,
                error: null
            });

            // Sync to journal store
            // Sync to journal store
            useJournalStore.getState().setUserName(displayName);

        } catch (error: any) {
            set({ error: error.message || 'Failed to update display name', isLoading: false });
            throw error;
        }
    },

    clearError: () => {
        set({ error: null });
    },

    setUser: (user: User | null) => {
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false
        });
    },

    initAuth: () => {
        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            set({
                user,
                isAuthenticated: !!user,
                isLoading: false,
                isInitialized: true
            });

            // Sync displayName to journal store when user is authenticated
            // Sync displayName to journal store when user is authenticated
            if (user?.displayName) {
                useJournalStore.getState().setUserName(user.displayName);
            }
        });

        // Return unsubscribe function
        return unsubscribe;
    }
}));
