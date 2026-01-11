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
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GoalsScreen() {
    const insets = useSafeAreaInsets();
    const {
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        checkInGoal,
        isDarkMode,
        goalSearchQuery,
        setGoalSearchQuery
    } = useJournalStore();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
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
    const filteredGoals = goals.filter(g =>
        !goalSearchQuery ||
        g.title.toLowerCase().includes(goalSearchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(goalSearchQuery.toLowerCase())
    );

    const activeGoals = filteredGoals.filter(g => g.isActive && g.completedDays < g.targetDays);
    const pausedGoals = filteredGoals.filter(g => !g.isActive && g.completedDays < g.targetDays);
    const completedGoals = filteredGoals.filter(g => g.completedDays >= g.targetDays);

    const handleSaveGoal = async () => {
        if (newGoalTitle.trim() && newGoalDays) {
            const targetDays = parseInt(newGoalDays) || 30;
            const calculatedEndDate = endDate || new Date(new Date(startDate).getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            if (editingGoalId) {
                await updateGoal(editingGoalId, {
                    title: newGoalTitle.trim(),
                    description: newGoalDescription.trim(),
                    targetDays,
                    startDate,
                    endDate: calculatedEndDate,
                    reminderEnabled,
                    reminderTime,
                    alarmSound,
                });
            } else {
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
            }

            closeModal();
        }
    };

    const handleEditGoal = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setNewGoalTitle(goal.title);
        setNewGoalDescription(goal.description);
        setNewGoalDays(goal.targetDays.toString());
        setStartDate(goal.startDate);
        setEndDate(goal.endDate);
        setReminderEnabled(goal.reminderEnabled);
        setReminderTime(goal.reminderTime);
        setAlarmSound(goal.alarmSound);
        setModalVisible(true);
    };

    const closeModal = () => {
        setNewGoalTitle('');
        setNewGoalDescription('');
        setNewGoalDays('30');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setReminderEnabled(false);
        setReminderTime('09:00');
        setAlarmSound('default');
        setEditingGoalId(null);
        setModalVisible(false);
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
                    isDarkMode ? styles.goalCardDark : styles.goalCardLight,
                    { opacity: isPaused ? 0.7 : 1 }
                ]}
            >
                {/* Header */}
                <View style={styles.goalHeader}>
                    <View style={styles.goalTitleContainer}>
                        <Text style={[styles.goalTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                            {goal.title}
                        </Text>
                        {isCompleted && (
                            <View style={styles.completedBadge}>
                                <Ionicons name="trophy" size={14} color="#E89F3C" />
                                <Text style={styles.completedText}>Target Reached</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable
                            onPress={() => handleEditGoal(goal)}
                            style={styles.editIconButton}
                        >
                            <Ionicons name="pencil-outline" size={18} color={isDarkMode ? '#8BA9A5' : '#64748B'} />
                        </Pressable>
                        <Pressable
                            onPress={() => handleDeleteGoal(goal.id, goal.title)}
                            style={styles.deleteIconButton}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </Pressable>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                    <View style={styles.progressInfo}>
                        <Text style={[styles.progressLabel, isDarkMode ? styles.subTextLight : styles.subTextDark]}>
                            Progress
                        </Text>
                        <Text style={[styles.progressValue, isDarkMode ? styles.textLight : styles.textDark]}>
                            {goal.completedDays} / {goal.targetDays} Days ({Math.round(progress)}%)
                        </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <LinearGradient
                            colors={isCompleted ? ['#10B981', '#059669'] : ['#E89F3C', '#CC841D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]}
                        />
                    </View>
                </View>

                {/* Footer Stats */}
                <View style={styles.goalFooter}>
                    <View style={styles.statItem}>
                        <Ionicons name="flame" size={16} color="#E89F3C" />
                        <Text style={[styles.statText, isDarkMode ? styles.textLight : styles.textDark]}>
                            {goal.currentStreak} Day Streak
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={16} color="#8BA9A5" />
                        <Text style={[styles.statText, isDarkMode ? styles.subTextLight : styles.subTextDark]}>
                            Ends {new Date(goal.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                    {!isCompleted && !isPaused && (
                        <Pressable
                            onPress={() => handleCheckIn(goal.id)}
                            style={[styles.actionButton, styles.checkInButton]}
                        >
                            <Ionicons name="footsteps" size={18} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Check In</Text>
                        </Pressable>
                    )}
                    <Pressable
                        onPress={() => handleToggleActive(goal)}
                        style={[styles.actionButton, styles.pauseButton]}
                    >
                        <Ionicons
                            name={isPaused ? "play" : "pause"}
                            size={18}
                            color={isDarkMode ? "#8BA9A5" : "#6B8E8A"}
                        />
                        <Text style={[styles.actionButtonText, { color: isDarkMode ? "#8BA9A5" : "#6B8E8A" }]}>
                            {isPaused ? "Resume" : "Pause"}
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, isDarkMode ? styles.bgDark : styles.bgLight]}>
            {/* Header */}
            <LinearGradient
                colors={isDarkMode ? ['#0F2E2A', '#0A1F1C'] : ['#FFFFFF', '#F1F5F9']}
                style={[styles.header, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.headerContent}>
                    {/* Search Bar */}
                    <View style={[styles.searchContainer, isDarkMode ? styles.searchDark : styles.searchLight]}>
                        <Ionicons name="search" size={18} color="#6B8E8A" style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, isDarkMode ? styles.textLight : styles.textDark]}
                            placeholder="Search your goals..."
                            placeholderTextColor="#6B8E8A"
                            value={goalSearchQuery}
                            onChangeText={setGoalSearchQuery}
                        />
                        {goalSearchQuery.length > 0 && (
                            <Pressable onPress={() => setGoalSearchQuery('')}>
                                <Ionicons name="close-circle" size={22} color="#6B8E8A" />
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.headerTop}>
                        <View>
                            <Text style={[styles.headerTitle, isDarkMode ? styles.textLight : styles.textDark]}>Goals</Text>
                            <Text style={[styles.headerSubtitle, isDarkMode ? styles.subTextLight : styles.subTextDark]}>
                                {activeGoals.length} Active • {completedGoals.length} Completed
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => setModalVisible(true)}
                            style={styles.addButton}
                        >
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Sections */}
                {activeGoals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDarkMode ? styles.textLight : styles.textDark]}>In Progress</Text>
                        {activeGoals.map((goal, index) => renderGoalCard(goal, index))}
                    </View>
                )}

                {pausedGoals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDarkMode ? styles.textLight : styles.textDark]}>Paused</Text>
                        {pausedGoals.map((goal, index) => renderGoalCard(goal, index))}
                    </View>
                )}

                {completedGoals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDarkMode ? styles.textLight : styles.textDark]}>Completed</Text>
                        {completedGoals.map((goal, index) => renderGoalCard(goal, index))}
                    </View>
                )}

                {filteredGoals.length === 0 && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="flag-outline" size={64} color="#8BA9A5" />
                        </View>
                        <Text style={[styles.emptyTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                            {goalSearchQuery ? 'No matching goals' : 'No goals found'}
                        </Text>
                        <Text style={[styles.emptySubtitle, isDarkMode ? styles.subTextLight : styles.subTextDark]}>
                            {goalSearchQuery ? 'Try a different search term' : 'Start tracking your personal milestones today.'}
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* New Goal Modal - Refined to match image */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={closeModal} />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalWrapper}
                    >
                        <View style={[styles.modalContent, isDarkMode ? styles.modalDark : styles.modalLight, { paddingTop: insets.top + 20 }]}>
                            <View style={styles.modalHeaderInner}>
                                <Text style={[styles.modalTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                                    {editingGoalId ? 'Edit Goal' : 'New Goal'}
                                </Text>
                                <Pressable onPress={closeModal} style={styles.modalCloseButton}>
                                    <Ionicons name="close" size={28} color={isDarkMode ? '#8BA9A5' : '#64748B'} />
                                </Pressable>
                            </View>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDarkMode ? styles.textLight : styles.textDark]}>What is your goal?</Text>
                                    <TextInput
                                        style={[styles.textInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                                        placeholder="e.g., Read for 30 mins"
                                        placeholderTextColor="#6B8E8A"
                                        value={newGoalTitle}
                                        onChangeText={setNewGoalTitle}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDarkMode ? styles.textLight : styles.textDark]}>Description</Text>
                                    <TextInput
                                        style={[styles.textInput, styles.textArea, isDarkMode ? styles.inputDark : styles.inputLight]}
                                        placeholder="Add more details..."
                                        placeholderTextColor="#6B8E8A"
                                        value={newGoalDescription}
                                        onChangeText={setNewGoalDescription}
                                        multiline
                                    />
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={[styles.inputLabel, isDarkMode ? styles.textLight : styles.textDark]}>Target Days</Text>
                                        <TextInput
                                            style={[styles.textInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                                            placeholder="30"
                                            placeholderTextColor="#6B8E8A"
                                            value={newGoalDays}
                                            onChangeText={setNewGoalDays}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                        <Text style={[styles.inputLabel, isDarkMode ? styles.textLight : styles.textDark]}>Start Date</Text>
                                        <Pressable
                                            onPress={() => setShowStartDatePicker(true)}
                                            style={[styles.dateButton, isDarkMode ? styles.inputDark : styles.inputLight]}
                                        >
                                            <Text style={isDarkMode ? styles.textLight : styles.textDark}>{startDate}</Text>
                                        </Pressable>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDarkMode ? styles.textLight : styles.textDark]}>End Date (Optional)</Text>
                                    <Pressable
                                        onPress={() => setShowEndDatePicker(true)}
                                        style={[styles.dateButton, isDarkMode ? styles.inputDark : styles.inputLight]}
                                    >
                                        <Text style={endDate ? (isDarkMode ? styles.textLight : styles.textDark) : styles.placeholderText}>
                                            {endDate || 'Select end date (optional)'}
                                        </Text>
                                    </Pressable>
                                </View>

                                <View style={styles.reminderContainer}>
                                    <View>
                                        <Text style={[styles.inputLabel, isDarkMode ? styles.textLight : styles.textDark]}>Daily Reminder</Text>
                                        <Text style={[styles.reminderSub, isDarkMode ? styles.subTextLight : styles.subTextDark]}>Get notified to check in</Text>
                                    </View>
                                    <Switch
                                        value={reminderEnabled}
                                        onValueChange={setReminderEnabled}
                                        trackColor={{ false: '#334155', true: '#10B981' }}
                                        thumbColor="#FFFFFF"
                                    />
                                </View>

                                {reminderEnabled && (
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, isDarkMode ? styles.textLight : styles.textDark]}>Reminder Time</Text>
                                        <TextInput
                                            style={[styles.textInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                                            placeholder="09:00"
                                            placeholderTextColor="#6B8E8A"
                                            value={reminderTime}
                                            onChangeText={setReminderTime}
                                        />
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <Pressable
                                    onPress={closeModal}
                                    style={[styles.footerButton, styles.cancelButton]}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleSaveGoal}
                                    style={[styles.footerButton, styles.createButton]}
                                >
                                    <Text style={styles.createText}>
                                        {editingGoalId ? 'Update Goal' : 'Create Goal'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Date Pickers */}
            {showStartDatePicker && (
                <DateTimePicker
                    value={new Date(startDate)}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowStartDatePicker(false);
                        if (date) setStartDate(date.toISOString().split('T')[0]);
                    }}
                />
            )}
            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate ? new Date(endDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowEndDatePicker(false);
                        if (date) setEndDate(date.toISOString().split('T')[0]);
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgDark: { backgroundColor: '#0F172A' },
    bgLight: { backgroundColor: '#F8FAFC' },
    textLight: { color: '#FFFFFF' },
    textDark: { color: '#0F172A' },
    subTextLight: { color: '#8BA9A5' },
    subTextDark: { color: '#64748B' },

    header: { paddingBottom: 24, paddingHorizontal: 20 },
    headerContent: {},
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 32, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 15 },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        marginBottom: 20,
    },
    searchDark: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.05)' },
    searchLight: { backgroundColor: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.05)' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15 },

    addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },

    scrollContent: { padding: 20 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },

    goalCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
    goalCardDark: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' },
    goalCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },

    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    goalTitleContainer: { flex: 1, marginRight: 8 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    goalTitle: { fontSize: 18, fontWeight: 'bold' },
    editIconButton: { padding: 8, marginRight: 8 },
    completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    completedText: { fontSize: 12, color: '#E89F3C', fontWeight: 'bold' },
    deleteIconButton: { padding: 8 },

    progressSection: { marginBottom: 16 },
    progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progressLabel: { fontSize: 13 },
    progressValue: { fontSize: 13, fontWeight: 'bold' },
    progressBarBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },

    goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 12, fontWeight: 'bold' },

    actionRow: { flexDirection: 'row', gap: 10 },
    actionButton: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    checkInButton: { backgroundColor: '#10B981' },
    pauseButton: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },

    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(139, 169, 165, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },

    modalOverlay: { flex: 1 },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalWrapper: { flex: 1 },
    modalContent: { flex: 1, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalDark: { backgroundColor: '#1E293B' },
    modalLight: { backgroundColor: '#FFFFFF' },
    modalHeaderInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    modalTitle: { fontSize: 28, fontWeight: 'bold' },
    modalCloseButton: { padding: 4 },
    modalBody: { flex: 1 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    textInput: { borderRadius: 12, padding: 14, fontSize: 16 },
    inputDark: { backgroundColor: '#0F172A', color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    inputLight: { backgroundColor: '#F1F5F9', color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    dateButton: { height: 50, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 14 },
    placeholderText: { color: '#6B8E8A' },
    reminderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
    reminderSub: { fontSize: 12 },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
    footerButton: { flex: 1, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    cancelButton: { backgroundColor: '#F1F5F9' },
    createButton: { backgroundColor: '#10B981' },
    cancelText: { color: '#475569', fontWeight: 'bold' },
    createText: { color: '#FFFFFF', fontWeight: 'bold' },
});

