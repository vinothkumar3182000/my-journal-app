import { useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

export default function StatisticsScreen() {
    const { entries, goals, isDarkMode } = useJournalStore();

    const stats = useMemo(() => {
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        // Mood distribution
        const moodCounts: Record<string, number> = {
            amazing: 0,
            happy: 0,
            neutral: 0,
            sad: 0,
            terrible: 0,
        };

        entries.forEach(entry => {
            if (moodCounts[entry.mood] !== undefined) {
                moodCounts[entry.mood]++;
            }
        });

        // This month entries
        const thisMonthEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date as string);
            return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
        });

        // Streak calculation
        let currentStreak = 0;
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
        );

        if (sortedEntries.length > 0) {
            const dates = new Set();
            sortedEntries.forEach(entry => {
                dates.add(new Date(entry.date as string).toDateString());
            });

            const sortedDates = Array.from(dates).sort((a, b) =>
                new Date(b as string).getTime() - new Date(a as string).getTime()
            );

            let checkDate = new Date(today);
            // Check if today has an entry, if not check yesterday to start streak
            const todayStr = checkDate.toDateString();
            const hasToday = sortedDates.includes(todayStr);

            if (!hasToday) {
                checkDate.setDate(checkDate.getDate() - 1);
            }

            for (const dateStr of sortedDates) {
                if (checkDate.toDateString() === dateStr) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else if (new Date(checkDate.getTime() - 86400000).toDateString() === dateStr) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    if (dateStr === todayStr) continue;
                    break;
                }
            }
        }

        // Average words per entry
        const totalWords = entries.reduce((sum, entry) => {
            return sum + (entry.content?.split(' ').length || 0);
        }, 0);
        const avgWords = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

        // Favorites count
        const favoritesCount = entries.filter(e => e.isFavorite).length;

        // Tags count
        const allTags = new Set<string>();
        entries.forEach(entry => {
            entry.tags?.forEach(tag => allTags.add(tag));
        });

        return {
            moodCounts,
            thisMonthEntries: thisMonthEntries.length,
            currentStreak,
            avgWords,
            favoritesCount,
            tagsCount: allTags.size,
            totalEntries: entries.length,
            activeGoals: goals.filter(g => g.isActive).length,
        };
    }, [entries, goals]);

    const moodData = [
        { mood: 'amazing', emoji: '😄', label: 'Amazing', color: '#10B981', count: stats.moodCounts.amazing },
        { mood: 'happy', emoji: '😊', label: 'Happy', color: '#3B82F6', count: stats.moodCounts.happy },
        { mood: 'neutral', emoji: '😐', label: 'Neutral', color: '#8B5CF6', count: stats.moodCounts.neutral },
        { mood: 'sad', emoji: '😔', label: 'Sad', color: '#F59E0B', count: stats.moodCounts.sad },
        { mood: 'terrible', emoji: '😢', label: 'Terrible', color: '#EF4444', count: stats.moodCounts.terrible },
    ];

    const maxMoodCount = Math.max(...Object.values(stats.moodCounts), 1);

    const { width } = useWindowDimensions();

    // Responsive layout calculation
    const getLayout = () => {
        const padding = 20;
        const gap = 12;

        // Determine columns based on screen width
        let numColumns = 2;
        if (width >= 1024) numColumns = 4;      // Desktop/Large Tablet
        else if (width >= 768) numColumns = 3;   // Tablet Portrait

        const totalGap = gap * (numColumns - 1);
        const totalPadding = padding * 2;
        const cardWidth = (width - totalPadding - totalGap) / numColumns;

        return { cardWidth, numColumns };
    };

    const { cardWidth } = getLayout();

    // Dynamic styles
    const themeStyles = {
        container: {
            backgroundColor: isDarkMode ? '#0A1F1C' : '#F8FAFC',
        },
        headerTitle: {
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
        },
        headerSubtitle: {
            color: isDarkMode ? '#8BA9A5' : '#64748B',
        },
        card: {
            backgroundColor: isDarkMode ? '#0F2E2A' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
        },
        text: {
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
        },
        subText: {
            color: isDarkMode ? '#8BA9A5' : '#64748B',
        },
        chartBarBg: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
        }
    };

    return (
        <View style={[styles.container, themeStyles.container]}>
            {/* Header */}
            <LinearGradient
                colors={isDarkMode ? ['#0F2E2A', '#0A1F1C'] : ['#FFFFFF', '#F1F5F9']}
                style={styles.header}
            >
                <Text style={[styles.headerTitle, themeStyles.headerTitle]}>Statistics</Text>
                <Text style={[styles.headerSubtitle, themeStyles.headerSubtitle]}>Your journaling insights</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, themeStyles.card, { width: cardWidth }]}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <Ionicons name="book" size={24} color="#3B82F6" />
                        </View>
                        <Text style={[styles.statValue, themeStyles.text]}>{stats.totalEntries}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>Total Entries</Text>
                    </View>

                    <View style={[styles.statCard, themeStyles.card, { width: cardWidth }]}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                            <Ionicons name="flame" size={24} color="#F59E0B" />
                        </View>
                        <Text style={[styles.statValue, themeStyles.text]}>{stats.currentStreak}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>Day Streak</Text>
                    </View>

                    <View style={[styles.statCard, themeStyles.card, { width: cardWidth }]}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                            <Ionicons name="calendar" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.statValue, themeStyles.text]}>{stats.thisMonthEntries}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>This Month</Text>
                    </View>

                    <View style={[styles.statCard, themeStyles.card, { width: cardWidth }]}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(232, 159, 60, 0.15)' }]}>
                            <Ionicons name="star" size={24} color="#E89F3C" />
                        </View>
                        <Text style={[styles.statValue, themeStyles.text]}>{stats.favoritesCount}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>Favorites</Text>
                    </View>

                    <View style={[styles.statCard, themeStyles.card, { width: cardWidth }]}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                            <Ionicons name="pricetag" size={24} color="#EC4899" />
                        </View>
                        <Text style={[styles.statValue, themeStyles.text]}>{stats.tagsCount}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>Unique Tags</Text>
                    </View>

                    <View style={[styles.statCard, themeStyles.card, { width: cardWidth }]}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                            <Ionicons name="text" size={24} color="#06B6D4" />
                        </View>
                        <Text style={[styles.statValue, themeStyles.text]}>{stats.avgWords}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>Avg Words</Text>
                    </View>
                </View>

                {/* Mood Distribution Chart */}
                <View style={[styles.section, themeStyles.card]}>
                    <Text style={[styles.sectionTitle, themeStyles.text]}>Mood Distribution</Text>
                    <View style={styles.moodChart}>
                        {moodData.map((item, index) => {
                            const percentage = stats.totalEntries > 0
                                ? (item.count / stats.totalEntries) * 100
                                : 0;
                            const barWidth = (item.count / maxMoodCount) * 100;

                            return (
                                <View key={index} style={styles.moodRow}>
                                    <View style={styles.moodLabelContainer}>
                                        <Text style={styles.moodEmoji}>{item.emoji}</Text>
                                        <Text style={[styles.moodLabel, themeStyles.subText]}>{item.label}</Text>
                                    </View>
                                    <View style={[styles.moodBarContainer, themeStyles.chartBarBg]}>
                                        <View
                                            style={[
                                                styles.moodBar,
                                                { width: `${barWidth}%`, backgroundColor: item.color }
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.moodCount, themeStyles.text]}>{item.count}</Text>
                                    <Text style={[styles.moodPercentage, themeStyles.subText]}>{percentage.toFixed(0)}%</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Goals Progress */}
                {stats.activeGoals > 0 && (
                    <View style={[styles.section, themeStyles.card]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, themeStyles.text]}>Active Goals</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{stats.activeGoals}</Text>
                            </View>
                        </View>
                        <Text style={[styles.sectionSubtitle, themeStyles.subText]}>
                            Keep up the great work on your goals!
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
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
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 20,
        gap: 12,
    },
    statCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    section: {
        margin: 20,
        marginTop: 8,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    badge: {
        backgroundColor: 'rgba(232, 159, 60, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(232, 159, 60, 0.3)',
    },
    badgeText: {
        color: '#E89F3C',
        fontSize: 12,
        fontWeight: '600',
    },
    moodChart: {
        gap: 16,
    },
    moodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    moodLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
        gap: 8,
    },
    moodEmoji: {
        fontSize: 20,
    },
    moodLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    moodBarContainer: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    moodBar: {
        height: '100%',
        borderRadius: 4,
    },
    moodCount: {
        fontSize: 16,
        fontWeight: '600',
        width: 35,
        textAlign: 'right',
    },
    moodPercentage: {
        fontSize: 13,
        width: 45,
        textAlign: 'right',
    },
});
