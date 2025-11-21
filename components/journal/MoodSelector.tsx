import { useJournalStore } from '@/store/journalStore';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface MoodSelectorProps {
    selectedMood: string;
    onSelectMood: (mood: string) => void;
}

const moods = [
    { id: 'amazing', emoji: '😄', label: 'Amazing' },
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'neutral', emoji: '😐', label: 'Neutral' },
    { id: 'sad', emoji: '😔', label: 'Sad' },
    { id: 'terrible', emoji: '😢', label: 'Terrible' },
];

export function MoodSelector({ selectedMood, onSelectMood }: MoodSelectorProps) {
    const { isDarkMode } = useJournalStore();

    return (
        <View style={styles.container}>
            {moods.map((mood) => {
                const isSelected = selectedMood === mood.id;

                return (
                    <Pressable
                        key={mood.id}
                        onPress={() => onSelectMood(mood.id)}
                        style={({ pressed }) => [
                            styles.moodButton,
                            {
                                backgroundColor: isSelected
                                    ? '#E89F3C'
                                    : isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                borderColor: isSelected
                                    ? '#E89F3C'
                                    : isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                                opacity: pressed ? 0.7 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            }
                        ]}
                    >
                        <Text style={styles.emoji}>{mood.emoji}</Text>
                        <Text
                            style={[
                                styles.label,
                                {
                                    color: isSelected
                                        ? '#FFFFFF'
                                        : isDarkMode ? '#B8D0CC' : '#64748B'
                                }
                            ]}
                        >
                            {mood.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    moodButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
    },
});
