import { JournalEntry, useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EntryCardProps {
    entry: JournalEntry;
    onPress: () => void;
    onLongPress?: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void;
    isSelected?: boolean;
    selectionMode?: boolean;
    index: number;
}

export function EntryCard({ entry, onPress, onLongPress, onDelete, onToggleFavorite, isSelected = false, selectionMode = false, index }: EntryCardProps) {
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
    const hasPhoto = !!entry.photo;
    const textColor = hasPhoto ? '#FFFFFF' : (isDarkMode ? '#FFFFFF' : '#0F172A');
    const subTextColor = hasPhoto ? 'rgba(255, 255, 255, 0.9)' : (isDarkMode ? '#B8D0CC' : '#475569');
    const metaTextColor = hasPhoto ? 'rgba(255, 255, 255, 0.7)' : (isDarkMode ? '#8BA9A5' : '#64748B');
    // Use the primary dark color '#0F2E2A' if no photo is present (or kept standard if light mode is strictly required, but user seems to imply a specific "default primary color")
    // Assuming the user wants the dark teal look from the screenshot as the default "primary color" background
    const cardBg = hasPhoto ? 'transparent' : (isDarkMode ? '#0F2E2A' : '#FFFFFF');
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

    const CardContent = () => (
        <View style={styles.cardContent}>
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
                    <View style={styles.recordInfo}>
                        <Text style={[styles.timeText, { color: metaTextColor }]}>
                            {entry.time ? (() => {
                                const [hours, minutes] = entry.time.split(':').map(Number);
                                const period = hours >= 12 ? 'PM' : 'AM';
                                const hours12 = hours % 12 || 12;
                                return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                            })() : formatTime(entry.date)}
                        </Text>
                        {entry.weather && (
                            <>
                                <View style={styles.separator} />
                                <Ionicons name="sunny-outline" size={12} color={metaTextColor} />
                                <Text style={[styles.timeText, { color: metaTextColor }]}>{entry.weather}</Text>
                            </>
                        )}
                    </View>
                </View>
                <View style={styles.headerRight}>
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

            {/* Footer: Location */}
            {entry.location && (
                <View style={[styles.footer, { borderTopColor: hasPhoto ? 'rgba(255,255,255,0.2)' : 'rgba(139, 169, 165, 0.1)' }]}>
                    <View style={styles.footerLeft}>
                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={14} color={metaTextColor} />
                            <Text style={[styles.locationText, { color: metaTextColor, flex: 1 }]} numberOfLines={1}>
                                {entry.location}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

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
                        overflow: 'hidden', // Ensure image respects radius
                        padding: 0, // Reset padding for ImageBackground
                    }
                ]}
            >
                {hasPhoto ? (
                    <ImageBackground
                        source={{ uri: entry.photo }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                    >
                        <LinearGradient
                            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={{ padding: 20 }}>
                            <CardContent />
                        </View>
                    </ImageBackground>
                ) : (
                    <View style={{ padding: 20 }}>
                        <CardContent />
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
        flex: 1,
    },
    recordInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    separator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 2,
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

    cardContent: {
        flexDirection: 'column',
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
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: 12,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
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
