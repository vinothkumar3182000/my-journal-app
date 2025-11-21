import { Goal, useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function GoalsScreen() {
    const { goals, addGoal, updateGoal, deleteGoal, checkInGoal, isDarkMode } = useJournalStore();
    const isDark = isDarkMode;

    const [modalVisible, setModalVisible] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDescription, setNewGoalDescription] = useState('');
    const [newGoalDays, setNewGoalDays] = useState('30');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('09:00');
    const [alarmSound, setAlarmSound] = useState<'default' | 'bell' | 'chime' | 'gentle' | 'urgent'>('default');

    // Filter goals
    const activeGoals = goals.filter(g => g.isActive && g.completedDays < g.targetDays);
    const pausedGoals = goals.filter(g => !g.isActive && g.completedDays < g.targetDays);
    const completedGoals = goals.filter(g => g.completedDays >= g.targetDays);

    const handleAddGoal = async () => {
        if (newGoalTitle.trim() && newGoalDays) {
            const targetDays = parseInt(newGoalDays) || 30;
            const calculatedEndDate = endDate || new Date(new Date(startDate).getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            await addGoal({
                title: newGoalTitle.trim(),
                description: newGoalDescription.trim(),
                targetDays,
                isActive: true,
                startDate,
                endDate: calculatedEndDate,
                reminderEnabled,
                reminderTime,
                alarmSound,
            });

            // Reset form
            setNewGoalTitle('');
            setNewGoalDescription('');
            setNewGoalDays('30');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate('');
            setReminderEnabled(false);
            setReminderTime('09:00');
            setAlarmSound('default');
            setModalVisible(false);
        }
    };

    const handleDeleteGoal = async (id: string, title: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
                await deleteGoal(id);
            }
        } else {
            Alert.alert(
                'Delete Goal',
                `Are you sure you want to delete "${title}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => await deleteGoal(id)
                    },
                ],
                { cancelable: true }
            );
        }
    };

    const handleToggleActive = async (goal: Goal) => {
        await updateGoal(goal.id, { isActive: !goal.isActive });
    };

    const handleCheckIn = async (id: string) => {
        await checkInGoal(id);
    };

    const renderGoalCard = (goal: Goal, index: number) => {
        const progress = (goal.completedDays / goal.targetDays) * 100;
        const isCompleted = goal.completedDays >= goal.targetDays;
        const isPaused = !goal.isActive && !isCompleted;

        return (
            <Animated.View
                key={goal.id}
                entering={FadeInDown.delay(index * 50)}
                style={[
                    styles.goalCard,
                    {
                        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                        opacity: isPaused ? 0.8 : 1
                    }
                ]}
            >
                {/* Header */}
                <View style={styles.goalHeader}>
                    <View style={styles.goalTitleContainer}>
                        <Text style={[styles.goalTitle, { color: isDarkMode ? '#F1F5F9' : '#0F172A' }]}>
                            {goal.title}
                        </Text>
                        {isCompleted && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                <Text style={styles.completedText}>Done!</Text>
                            </View>
                        )}
                        {isPaused && (
                            <View style={[styles.completedBadge, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="pause-circle" size={18} color="#D97706" />
                                <Text style={[styles.completedText, { color: '#D97706' }]}>Paused</Text>
                            </View>
                        )}
                    </View>
                    <Pressable
                        onPress={() => handleDeleteGoal(goal.id, goal.title)}
                        style={styles.deleteIconButton}
                    >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                </View>

                {/* Description */}
                {goal.description && (
                    <Text style={[styles.goalDescription, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                        {goal.description}
                    </Text>
                )}

                {/* Streak & Stats */}
                {goal.currentStreak > 0 && (
                    <View style={styles.streakContainer}>
                        <Text style={styles.streakText}>🔥 {goal.currentStreak} day streak!</Text>
                        {goal.longestStreak > goal.currentStreak && (
                            <Text style={[styles.bestStreakText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                                Best: {goal.longestStreak} days
                            </Text>
                        )}
                    </View>
                )}

                {/* Dates & Info */}
                <View style={styles.goalInfo}>
                    {goal.startDate && goal.endDate && (
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                            <Text style={[styles.infoText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                                {new Date(goal.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(goal.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </View>
                    )}
                    {goal.lastCheckIn && (
                        <View style={styles.infoRow}>
                            <Ionicons name="checkmark-circle-outline" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                            <Text style={[styles.infoText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                                Last: {goal.lastCheckIn === new Date().toISOString().split('T')[0] ? 'Today' : new Date(goal.lastCheckIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                    )}
                    {goal.reminderEnabled && (
                        <View style={styles.infoRow}>
                            <Ionicons name="notifications-outline" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                            <Text style={[styles.infoText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                                {goal.reminderTime}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressInfo}>
                        <Text style={[styles.progressText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                            {goal.completedDays} / {goal.targetDays} days
                        </Text>
                        <Text style={[styles.progressPercent, { color: isCompleted ? '#10B981' : '#8B5CF6' }]}>
                            {Math.round(progress)}%
                        </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        <LinearGradient
                            colors={isCompleted ? ['#10B981', '#059669'] : ['#8B5CF6', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
                        />
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.goalActions}>
                    {!isCompleted && !isPaused && (
                        <Pressable
                            onPress={() => handleCheckIn(goal.id)}
                            style={({ pressed }) => [
                                styles.actionButton,
                                styles.primaryButton,
                                { opacity: pressed ? 0.8 : 1 }
                            ]}
                        >
                            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>Check In Today</Text>
                        </Pressable>
                    )}
                    <Pressable
                        onPress={() => handleToggleActive(goal)}
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.secondaryButton,
                            { opacity: pressed ? 0.8 : 1 }
                        ]}
                    >
                        <Ionicons
                            name={goal.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                            size={18}
                            color="#8B5CF6"
                        />
                        <Text style={[styles.secondaryButtonText, { color: isDarkMode ? '#A78BFA' : '#8B5CF6' }]}>
                            {goal.isActive ? 'Pause' : 'Resume'}
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            {/* Header */}
            <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Goals</Text>
                <Text style={styles.headerSubtitle}>
                    {activeGoals.length} active • {pausedGoals.length} paused • {completedGoals.length} completed
                </Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Active Goals */}
                {activeGoals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                            Active Goals
                        </Text>
                        {activeGoals.map((goal, index) => renderGoalCard(goal, index))}
                    </View>
                )}

                {/* Paused Goals */}
                {pausedGoals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                            Paused Goals
                        </Text>
                        {pausedGoals.map((goal, index) => renderGoalCard(goal, index))}
                    </View>
                )}

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                            Completed 🎉
                        </Text>
                        {completedGoals.map((goal, index) => renderGoalCard(goal, index))}
                    </View>
                )}

                {/* Empty State */}
                {goals.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>🎯</Text>
                        <Text style={[styles.emptyTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                            No goals yet
                        </Text>
                        <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            Tap the + button to create your first goal
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <Pressable
                onPress={() => setModalVisible(true)}
                style={({ pressed }) => [
                    styles.fab,
                    { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
                ]}
            >
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                </LinearGradient>
            </Pressable>

            {/* Add Goal Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                                    New Goal
                                </Text>
                                <Pressable onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                                </Pressable>
                            </View>

                            <ScrollView
                                style={styles.modalBody}
                                showsVerticalScrollIndicator={true}
                            >
                                {/* Goal Title */}
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                    Goal Title
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                            color: isDark ? '#F1F5F9' : '#0F172A',
                                            borderColor: isDark ? '#334155' : '#E2E8F0',
                                        }
                                    ]}
                                    placeholder="e.g., Exercise daily"
                                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                                    value={newGoalTitle}
                                    onChangeText={setNewGoalTitle}
                                />

                                {/* Description */}
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                    Description (optional)
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                        {
                                            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                            color: isDark ? '#F1F5F9' : '#0F172A',
                                            borderColor: isDark ? '#334155' : '#E2E8F0',
                                        }
                                    ]}
                                    placeholder="Add more details..."
                                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                                    value={newGoalDescription}
                                    onChangeText={setNewGoalDescription}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />

                                {/* Days */}
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                    Target Days
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                            color: isDark ? '#F1F5F9' : '#0F172A',
                                            borderColor: isDark ? '#334155' : '#E2E8F0',
                                        }
                                    ]}
                                    placeholder="30"
                                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                                    value={newGoalDays}
                                    onChangeText={setNewGoalDays}
                                    keyboardType="number-pad"
                                />

                                {/* Start Date */}
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                    Start Date
                                </Text>
                                <Pressable
                                    onPress={() => setShowStartDatePicker(true)}
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                            borderColor: isDark ? '#334155' : '#E2E8F0',
                                            justifyContent: 'center',
                                        }
                                    ]}
                                >
                                    <Text style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                                        {startDate}
                                    </Text>
                                </Pressable>
                                {showStartDatePicker && (
                                    <DateTimePicker
                                        value={new Date(startDate)}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowStartDatePicker(false);
                                            if (selectedDate) {
                                                setStartDate(selectedDate.toISOString().split('T')[0]);
                                            }
                                        }}
                                    />
                                )}

                                {/* End Date */}
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                    End Date (Optional)
                                </Text>
                                <Pressable
                                    onPress={() => setShowEndDatePicker(true)}
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                            borderColor: isDark ? '#334155' : '#E2E8F0',
                                            justifyContent: 'center',
                                        }
                                    ]}
                                >
                                    <Text style={{ color: endDate ? (isDark ? '#F1F5F9' : '#0F172A') : (isDark ? '#64748B' : '#94A3B8') }}>
                                        {endDate || 'Select end date (optional)'}
                                    </Text>
                                </Pressable>
                                {showEndDatePicker && (
                                    <DateTimePicker
                                        value={endDate ? new Date(endDate) : new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowEndDatePicker(false);
                                            if (selectedDate) {
                                                setEndDate(selectedDate.toISOString().split('T')[0]);
                                            }
                                        }}
                                    />
                                )}

                                {/* Reminder */}
                                <View style={styles.reminderRow}>
                                    <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                        Daily Reminder
                                    </Text>
                                    <Pressable
                                        onPress={() => setReminderEnabled(!reminderEnabled)}
                                        style={[
                                            styles.toggle,
                                            { backgroundColor: reminderEnabled ? '#10B981' : (isDark ? '#334155' : '#E2E8F0') }
                                        ]}
                                    >
                                        <View style={[
                                            styles.toggleThumb,
                                            {
                                                backgroundColor: '#FFFFFF',
                                                transform: [{ translateX: reminderEnabled ? 20 : 2 }]
                                            }
                                        ]} />
                                    </Pressable>
                                </View>

                                {reminderEnabled && (
                                    <>
                                        <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                            Reminder Time (24h)
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                                    color: isDark ? '#F1F5F9' : '#0F172A',
                                                    borderColor: isDark ? '#334155' : '#E2E8F0',
                                                }
                                            ]}
                                            placeholder="09:00"
                                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                                            value={reminderTime}
                                            onChangeText={setReminderTime}
                                            keyboardType="numbers-and-punctuation"
                                        />

                                        <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                            Alarm Sound
                                        </Text>
                                        <View style={styles.soundSelector}>
                                            {(['default', 'bell', 'chime', 'gentle', 'urgent'] as const).map((sound) => (
                                                <Pressable
                                                    key={sound}
                                                    onPress={() => setAlarmSound(sound)}
                                                    style={[
                                                        styles.soundOption,
                                                        {
                                                            backgroundColor: alarmSound === sound
                                                                ? '#10B981'
                                                                : (isDark ? '#0F172A' : '#F8FAFC'),
                                                            borderColor: alarmSound === sound
                                                                ? '#10B981'
                                                                : (isDark ? '#334155' : '#E2E8F0'),
                                                        }
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.soundOptionText,
                                                        {
                                                            color: alarmSound === sound
                                                                ? '#FFFFFF'
                                                                : (isDark ? '#CBD5E1' : '#475569')
                                                        }
                                                    ]}>
                                                        {sound.charAt(0).toUpperCase() + sound.slice(1)}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </>
                                )}
                            </ScrollView>

                            <View style={styles.modalActions}>
                                <Pressable
                                    onPress={() => setModalVisible(false)}
                                    style={[styles.modalButton, styles.cancelButton]}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleAddGoal}
                                    disabled={!newGoalTitle.trim()}
                                    style={[
                                        styles.modalButton,
                                        styles.createButton,
                                        { opacity: newGoalTitle.trim() ? 1 : 0.5 }
                                    ]}
                                >
                                    <Text style={styles.createButtonText}>Create Goal</Text>
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
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
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#D1FAE5',
    },
    section: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    goalCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    goalTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    deleteIconButton: {
        padding: 4,
    },
    goalDescription: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    streakContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    streakText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    bestStreakText: {
        fontSize: 12,
        fontWeight: '500',
    },
    goalInfo: {
        gap: 6,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    goalActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    primaryButton: {
        backgroundColor: '#10B981',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        borderRadius: 30,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        maxHeight: '90%',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    modalBody: {
        maxHeight: 400,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
    },
    reminderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    soundSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    soundOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    soundOptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E2E8F0',
    },
    cancelButtonText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: '#10B981',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    datePickerText: {
        fontSize: 16,
    },
});
