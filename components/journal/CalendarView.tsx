import { useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = width - 40;
const DAY_SIZE = CALENDAR_WIDTH / 7;

interface CalendarViewProps {
    onClose: () => void;
    onDateSelect: (date: Date) => void;
    onMoodSelect?: (mood: string) => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ onClose, onDateSelect, onMoodSelect }: CalendarViewProps) {
    const { entries, isDarkMode } = useJournalStore();
    const isDark = isDarkMode;

    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get entry counts by date
    const getEntryCountForDate = (date: Date) => {
        const dateStr = date.toDateString();
        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.toDateString() === dateStr;
        }).length;
    };

    // Get mood for date (most recent entry)
    const getMoodForDate = (date: Date) => {
        const dateStr = date.toDateString();
        const dayEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.toDateString() === dateStr;
        });
        return dayEntries.length > 0 ? dayEntries[0].mood : null;
    };

    // Generate calendar days
    const getDaysInMonth = () => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty slots for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const moodColors: { [key: string]: string } = {
        amazing: '#10B981',
        happy: '#3B82F6',
        neutral: '#8B5CF6',
        sad: '#F59E0B',
        terrible: '#EF4444',
    };

    const days = getDaysInMonth();

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            {/* Header */}
            <LinearGradient
                colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Calendar</Text>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </Pressable>
                </View>

                <View style={styles.monthSelector}>
                    <Pressable onPress={goToPreviousMonth} style={styles.monthButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <Text style={styles.monthText}>
                        {MONTHS[month]} {year}
                    </Text>
                    <Pressable onPress={goToNextMonth} style={styles.monthButton}>
                        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                    </Pressable>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.calendarContainer}>
                    {/* Day Headers */}
                    <View style={styles.dayHeaders}>
                        {DAYS.map((day, index) => (
                            <View key={index} style={styles.dayHeader}>
                                <Text style={[styles.dayHeaderText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                    {day}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                        {days.map((date, index) => {
                            if (!date) {
                                return <View key={`empty-${index}`} style={styles.dayCell} />;
                            }

                            const entryCount = getEntryCountForDate(date);
                            const mood = getMoodForDate(date);
                            const hasEntries = entryCount > 0;
                            const isTodayDate = isToday(date);

                            return (
                                <Pressable
                                    key={index}
                                    onPress={() => {
                                        onDateSelect(date);
                                        onClose();
                                    }}
                                    style={({ pressed }) => [
                                        styles.dayCell,
                                        hasEntries && styles.dayCellWithEntry,
                                        isTodayDate && styles.todayCell,
                                        {
                                            backgroundColor: hasEntries && mood
                                                ? moodColors[mood] + '20'
                                                : isDark ? '#1E293B' : '#FFFFFF',
                                            opacity: pressed ? 0.7 : 1,
                                        }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.dayNumber,
                                            { color: isDark ? '#F1F5F9' : '#0F172A' },
                                            isTodayDate && styles.todayNumber,
                                        ]}
                                    >
                                        {date.getDate()}
                                    </Text>
                                    {hasEntries && (
                                        <View style={styles.entryIndicators}>
                                            {mood && (
                                                <View
                                                    style={[
                                                        styles.moodDot,
                                                        { backgroundColor: moodColors[mood] }
                                                    ]}
                                                />
                                            )}
                                            {entryCount > 1 && (
                                                <Text style={styles.entryCount}>+{entryCount - 1}</Text>
                                            )}
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Legend */}
                <View style={[styles.legend, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <Text style={[styles.legendTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                        Mood Legend (Tap to filter)
                    </Text>
                    <View style={styles.legendItems}>
                        {Object.entries(moodColors).map(([mood, color]) => (
                            <Pressable
                                key={mood}
                                onPress={() => {
                                    if (onMoodSelect) {
                                        onMoodSelect(mood);
                                        onClose();
                                    }
                                }}
                                style={({ pressed }) => [
                                    styles.legendItem,
                                    {
                                        opacity: pressed ? 0.7 : 1,
                                        transform: [{ scale: pressed ? 0.95 : 1 }],
                                    }
                                ]}
                            >
                                <View style={[styles.legendDot, { backgroundColor: color }]} />
                                <Text style={[styles.legendText, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Stats */}
                <View style={[styles.stats, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                            {entries.filter(e => new Date(e.date).getMonth() === month).length}
                        </Text>
                        <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            This Month
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                            {entries.length}
                        </Text>
                        <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            Total Entries
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthButton: {
        padding: 8,
    },
    monthText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    calendarContainer: {
        padding: 20,
    },
    dayHeaders: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    dayHeader: {
        width: DAY_SIZE,
        alignItems: 'center',
        paddingVertical: 8,
    },
    dayHeaderText: {
        fontSize: 12,
        fontWeight: '600',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: DAY_SIZE,
        height: DAY_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 4,
        position: 'relative',
    },
    dayCellWithEntry: {
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    todayCell: {
        borderWidth: 2,
        borderColor: '#8B5CF6',
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: '500',
    },
    todayNumber: {
        fontWeight: 'bold',
        color: '#8B5CF6',
    },
    entryIndicators: {
        position: 'absolute',
        bottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    moodDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    entryCount: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    legend: {
        margin: 20,
        marginTop: 10,
        padding: 16,
        borderRadius: 16,
    },
    legendTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    legendItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 13,
    },
    stats: {
        margin: 20,
        marginTop: 0,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20,
    },
});
