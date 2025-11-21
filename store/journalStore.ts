import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface JournalEntry {
    id: string;
    date: string;
    mood: 'amazing' | 'happy' | 'neutral' | 'sad' | 'terrible';
    content: string;
    title?: string;
    photo?: string;
    tags?: string[];
    location?: string;
    weather?: string;
    isFavorite?: boolean;
    createdAt: number;
    updatedAt?: number;
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    targetDays: number;
    completedDays: number;
    isActive: boolean;
    createdAt: number;
    // New fields for enhanced tracking
    startDate: string;
    endDate: string;
    reminderEnabled: boolean;
    reminderTime: string; // HH:MM format
    alarmSound: 'default' | 'bell' | 'chime' | 'gentle' | 'urgent';
    checkInHistory: string[]; // Array of dates (ISO strings)
    currentStreak: number;
    longestStreak: number;
    lastCheckIn: string | null;
}

interface JournalState {
    entries: JournalEntry[];
    goals: Goal[];
    userName: string;
    isDarkMode: boolean;
    isLoading: boolean;
    searchQuery: string;
    selectedTags: string[];

    // Journal actions
    addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => Promise<void>;
    updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;

    // Goal actions
    addGoal: (goal: Partial<Omit<Goal, 'id' | 'createdAt' | 'completedDays' | 'checkInHistory' | 'currentStreak' | 'longestStreak' | 'lastCheckIn'>> & Pick<Goal, 'title' | 'description' | 'targetDays' | 'isActive'>) => Promise<void>;
    updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    checkInGoal: (id: string) => Promise<void>;

    // User actions
    setUserName: (name: string) => Promise<void>;
    toggleTheme: () => Promise<void>;

    // Search & Filter
    setSearchQuery: (query: string) => void;
    setSelectedTags: (tags: string[]) => void;
    getFilteredEntries: () => JournalEntry[];
    getAllTags: () => string[];

    // Data persistence
    loadData: () => Promise<void>;
    saveData: () => Promise<void>;
}

const STORAGE_KEY = '@journal_app_data';

export const useJournalStore = create<JournalState>((set, get) => ({
    entries: [],
    goals: [],
    userName: 'My Journal',
    isDarkMode: true, // Default to dark mode (Mirello theme)
    isLoading: true,
    searchQuery: '',
    selectedTags: [],

    addEntry: async (entry) => {
        const newEntry: JournalEntry = {
            ...entry,
            id: Date.now().toString(),
            createdAt: Date.now(),
        };

        set((state) => ({
            entries: [newEntry, ...state.entries],
        }));

        await get().saveData();
    },

    updateEntry: async (id, updates) => {
        set((state) => ({
            entries: state.entries.map((entry) =>
                entry.id === id ? { ...entry, ...updates, updatedAt: Date.now() } : entry
            ),
        }));

        await get().saveData();
    },

    deleteEntry: async (id) => {
        set((state) => ({
            entries: state.entries.filter((entry) => entry.id !== id),
        }));

        await get().saveData();
    },

    toggleFavorite: async (id) => {
        set((state) => ({
            entries: state.entries.map((entry) =>
                entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
            ),
        }));

        await get().saveData();
    },

    addGoal: async (goal) => {
        const now = new Date();
        const startDate = goal.startDate || now.toISOString();
        const endDate = goal.endDate || new Date(now.getTime() + goal.targetDays * 24 * 60 * 60 * 1000).toISOString();

        const newGoal: Goal = {
            ...goal,
            id: Date.now().toString(),
            completedDays: 0,
            createdAt: Date.now(),
            startDate,
            endDate,
            reminderEnabled: goal.reminderEnabled || false,
            reminderTime: goal.reminderTime || '09:00',
            alarmSound: goal.alarmSound || 'default',
            checkInHistory: [],
            currentStreak: 0,
            longestStreak: 0,
            lastCheckIn: null,
        };

        set((state) => ({
            goals: [newGoal, ...state.goals],
        }));

        await get().saveData();
    },

    updateGoal: async (id, updates) => {
        set((state) => ({
            goals: state.goals.map((goal) =>
                goal.id === id ? { ...goal, ...updates } : goal
            ),
        }));

        await get().saveData();
    },

    deleteGoal: async (id) => {
        set((state) => ({
            goals: state.goals.filter((goal) => goal.id !== id),
        }));

        await get().saveData();
    },

    checkInGoal: async (id) => {
        const today = new Date().toISOString().split('T')[0];

        set((state) => ({
            goals: state.goals.map((goal) => {
                if (goal.id !== id) return goal;

                // Check if already checked in today
                if (goal.lastCheckIn === today) return goal;

                // Calculate streak
                let newStreak = 1;
                if (goal.lastCheckIn) {
                    const lastDate = new Date(goal.lastCheckIn);
                    const todayDate = new Date(today);
                    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        // Consecutive day
                        newStreak = goal.currentStreak + 1;
                    }
                }

                const newLongestStreak = Math.max(newStreak, goal.longestStreak);
                const newCompletedDays = Math.min(goal.completedDays + 1, goal.targetDays);

                return {
                    ...goal,
                    completedDays: newCompletedDays,
                    checkInHistory: [...goal.checkInHistory, today],
                    currentStreak: newStreak,
                    longestStreak: newLongestStreak,
                    lastCheckIn: today,
                };
            }),
        }));

        await get().saveData();
    },

    setUserName: async (name) => {
        set({ userName: name });
        await get().saveData();
    },

    toggleTheme: async () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
        await get().saveData();
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },

    setSelectedTags: (tags) => {
        set({ selectedTags: tags });
    },

    getFilteredEntries: () => {
        const { entries, searchQuery, selectedTags } = get();

        return entries.filter((entry) => {
            // Search filter
            const matchesSearch = !searchQuery ||
                entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.title?.toLowerCase().includes(searchQuery.toLowerCase());

            // Tags filter
            const matchesTags = selectedTags.length === 0 ||
                (entry.tags && entry.tags.some(tag => selectedTags.includes(tag)));

            return matchesSearch && matchesTags;
        });
    },

    getAllTags: () => {
        const { entries } = get();
        const tagsSet = new Set<string>();

        entries.forEach(entry => {
            entry.tags?.forEach(tag => tagsSet.add(tag));
        });

        return Array.from(tagsSet);
    },

    loadData: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                set({
                    entries: parsed.entries || [],
                    goals: parsed.goals || [],
                    userName: parsed.userName || 'My Journal',
                    isDarkMode: parsed.isDarkMode !== undefined ? parsed.isDarkMode : true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Error loading data:', error);
            set({ isLoading: false });
        }
    },

    saveData: async () => {
        try {
            const { entries, goals, userName, isDarkMode } = get();
            const data = JSON.stringify({ entries, goals, userName, isDarkMode });
            await AsyncStorage.setItem(STORAGE_KEY, data);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    },
}));
