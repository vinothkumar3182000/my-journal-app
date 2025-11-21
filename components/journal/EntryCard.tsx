import { JournalEntry, useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EntryCardProps {
    entry: JournalEntry;
    onPress: () => void;
    onLongPress?: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void;
    onMoodPress?: (mood: string) => void;
    isSelected?: boolean;
    selectionMode?: boolean;
    index: number;
}

const moodEmojis = {
    amazing: '😄',
    happy: '😊',
    neutral: '😐',
    sad: '😔',
    terrible: '😢',
};

export function EntryCard({ entry, onPress, onLongPress, onDelete, onToggleFavorite, onMoodPress, isSelected = false, selectionMode = false, index }: EntryCardProps) {
    const { isDarkMode } = useJournalStore();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Dynamic styles
    const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
    const subTextColor = isDarkMode ? '#B8D0CC' : '#475569';
    const metaTextColor = isDarkMode ? '#8BA9A5' : '#64748B';
    const cardBg = isDarkMode ? '#0F2E2A' : '#FFFFFF';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

    return (
        <Animated.View entering={FadeInDown.delay(index * 50)} style={styles.container}>
            <Pressable
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                    styles.card,
                    {
                        backgroundColor: cardBg,
                        borderColor: isSelected ? '#E89F3C' : borderColor,
                        borderWidth: isSelected ? 2 : 1,
                        opacity: pressed ? 0.95 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                    }
                ]}
            >
                {/* Header: Date, Time, Mood */}
                <View style={styles.header}>
                    {selectionMode && (
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation();
                                onPress();
                            }}
                            style={styles.checkbox}
                        >
                            <View style={[
                                styles.checkboxInner,
                                {
                                    backgroundColor: isSelected ? '#E89F3C' : 'transparent',
                                    borderColor: isSelected ? '#E89F3C' : metaTextColor,
                                }
                            ]}>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                )}
                            </View>
                        </Pressable>
                    )}
                    <View style={styles.dateContainer}>
                        <Text style={[styles.dateText, { color: textColor }]}>{formatDate(entry.date)}</Text>
                        <Text style={[styles.timeText, { color: metaTextColor }]}>{formatTime(entry.date)}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        {onMoodPress && !selectionMode ? (
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onMoodPress(entry.mood);
                                }}
                                hitSlop={8}
                                style={({ pressed }) => ({
                                    opacity: pressed ? 0.7 : 1,
                                    transform: [{ scale: pressed ? 0.95 : 1 }],
                                })}
                            >
                                <Text style={styles.moodEmoji}>{moodEmojis[entry.mood]}</Text>
                            </Pressable>
                        ) : (
                            <Text style={styles.moodEmoji}>{moodEmojis[entry.mood]}</Text>
                        )}
                        {!selectionMode && (
                            <>
                                {onToggleFavorite && (
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite();
                                        }}
                                        hitSlop={8}
                                    >
                                        <Ionicons
                                            name={entry.isFavorite ? 'star' : 'star-outline'}
                                            size={20}
                                            color={entry.isFavorite ? '#E89F3C' : metaTextColor}
                                        />
                                    </Pressable>
                                )}
                                {onDelete && (
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onDelete();
                                        }}
                                        hitSlop={8}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={20}
                                            color="#EF4444"
                                        />
                                    </Pressable>
                                )}
                            </>
                        )}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {entry.title && (
                        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                            {entry.title}
                        </Text>
                    )}
                    <Text style={[styles.contentText, { color: subTextColor }]} numberOfLines={3}>
                        {entry.content}
                    </Text>
                </View>

                {/* Footer: Location, Tags (if any) */}
                {(entry.location || (entry.tags && entry.tags.length > 0)) && (
                    <View style={styles.footer}>
                        {entry.location && (
                            <View style={styles.locationContainer}>
                                <Ionicons name="location-outline" size={14} color={metaTextColor} />
                                <Text style={[styles.locationText, { color: metaTextColor }]}>{entry.location}</Text>
                            </View>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                            <View style={styles.tagsContainer}>
                                {entry.tags.slice(0, 2).map((tag, i) => (
                                    <Text key={i} style={[styles.tag, { color: '#E89F3C' }]}>#{tag}</Text>
                                ))}
                                {entry.tags.length > 2 && (
                                    <Text style={[styles.tag, { color: metaTextColor }]}>+{entry.tags.length - 2}</Text>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    checkbox: {
        marginRight: 12,
    },
    checkboxInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateContainer: {
        gap: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 13,
    },
    moodEmoji: {
        fontSize: 20,
    },
    content: {
        gap: 8,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    contentText: {
        fontSize: 15,
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(139, 169, 165, 0.1)',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    tag: {
        fontSize: 12,
        fontWeight: '500',
    },
});
