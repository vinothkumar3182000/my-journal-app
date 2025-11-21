import { useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { MoodSelector } from './MoodSelector';

interface AddEntryModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        content: string;
        mood: string;
        date: string;
        title?: string;
        tags?: string[];
    }) => void;
    initialData?: {
        content: string;
        mood: string;
        date: string;
        title?: string;
        tags?: string[];
    } | null;
}

export function AddEntryModal({ visible, onClose, onSave, initialData }: AddEntryModalProps) {
    const { isDarkMode } = useJournalStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mood, setMood] = useState<string>('happy');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setContent(initialData.content);
            setMood(initialData.mood);
            setTags(initialData.tags || []);
        } else {
            setTitle('');
            setContent('');
            setMood('happy');
            setTags([]);
            setTagInput('');
        }
    }, [initialData, visible]);

    const handleSave = () => {
        if (content.trim()) {
            onSave({
                content: content.trim(),
                mood,
                date: new Date().toISOString(),
                title: title.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
            });
            setTitle('');
            setContent('');
            setMood('happy');
            setTags([]);
            setTagInput('');
            onClose();
        }
    };

    const handleClose = () => {
        setTitle('');
        setContent('');
        setMood('happy');
        setTags([]);
        setTagInput('');
        onClose();
    };

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // Dynamic styles
    const themeStyles = {
        modalContent: {
            backgroundColor: isDarkMode ? '#0F2E2A' : '#FFFFFF',
        },
        handle: {
            backgroundColor: isDarkMode ? '#1A3B36' : '#E2E8F0',
        },
        text: {
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
        },
        subText: {
            color: isDarkMode ? '#8BA9A5' : '#64748B',
        },
        label: {
            color: isDarkMode ? '#B8D0CC' : '#475569',
        },
        input: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
        },
        placeholder: isDarkMode ? '#6B8E8A' : '#94A3B8',
        cancelButton: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F1F5F9',
        },
        cancelButtonText: {
            color: isDarkMode ? '#B8D0CC' : '#64748B',
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={handleClose} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.modalContent, themeStyles.modalContent]}>
                        <View style={[styles.handle, themeStyles.handle]} />

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, themeStyles.text]}>
                                    {initialData ? 'Edit Memory' : 'New Memory'}
                                </Text>
                                <Text style={[styles.dateText, themeStyles.subText]}>
                                    {new Date().toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>

                            {/* Mood Selector */}
                            <Text style={[styles.label, themeStyles.label]}>How are you feeling?</Text>
                            <MoodSelector selectedMood={mood} onSelectMood={setMood} />

                            {/* Title Input */}
                            <Text style={[styles.label, themeStyles.label]}>Title</Text>
                            <TextInput
                                style={[styles.titleInput, themeStyles.input]}
                                placeholder="Give your memory a title..."
                                placeholderTextColor={themeStyles.placeholder}
                                value={title}
                                onChangeText={setTitle}
                            />

                            {/* Content Input */}
                            <Text style={[styles.label, themeStyles.label]}>Your Story</Text>
                            <TextInput
                                style={[styles.textInput, themeStyles.input]}
                                placeholder="Write about your experience..."
                                placeholderTextColor={themeStyles.placeholder}
                                value={content}
                                onChangeText={setContent}
                                multiline
                                numberOfLines={8}
                                textAlignVertical="top"
                            />

                            {/* Tags */}
                            <Text style={[styles.label, themeStyles.label]}>Tags</Text>
                            <View style={styles.tagInputContainer}>
                                <TextInput
                                    style={[styles.tagInput, themeStyles.input]}
                                    placeholder="Add a tag..."
                                    placeholderTextColor={themeStyles.placeholder}
                                    value={tagInput}
                                    onChangeText={setTagInput}
                                    onSubmitEditing={handleAddTag}
                                />
                                <Pressable
                                    onPress={handleAddTag}
                                    style={[styles.addTagButton, { opacity: tagInput.trim() ? 1 : 0.5 }]}
                                    disabled={!tagInput.trim()}
                                >
                                    <Ionicons name="add-circle" size={24} color="#E89F3C" />
                                </Pressable>
                            </View>

                            {/* Tag List */}
                            {tags.length > 0 && (
                                <View style={styles.tagList}>
                                    {tags.map((tag, index) => (
                                        <View key={index} style={styles.tagChip}>
                                            <Text style={styles.tagChipText}>#{tag}</Text>
                                            <Pressable onPress={() => handleRemoveTag(tag)}>
                                                <Ionicons name="close-circle" size={18} color="#8BA9A5" />
                                            </Pressable>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                <Pressable
                                    onPress={handleClose}
                                    style={({ pressed }) => [
                                        styles.button,
                                        styles.cancelButton,
                                        themeStyles.cancelButton,
                                        { opacity: pressed ? 0.7 : 1 }
                                    ]}
                                >
                                    <Text style={[styles.cancelButtonText, themeStyles.cancelButtonText]}>Cancel</Text>
                                </Pressable>

                                <Pressable
                                    onPress={handleSave}
                                    disabled={!content.trim()}
                                    style={({ pressed }) => [
                                        styles.button,
                                        { opacity: pressed || !content.trim() ? 0.7 : 1 }
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#E89F3C', '#D68A2E']}
                                        style={styles.saveButtonGradient}
                                    >
                                        <Text style={styles.saveButtonText}>
                                            {initialData ? 'Update' : 'Save'}
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    keyboardView: {
        maxHeight: '90%',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '100%',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 12,
    },
    titleInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 160,
        marginBottom: 12,
    },
    tagInputContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    tagInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
    },
    addTagButton: {
        padding: 4,
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(232, 159, 60, 0.2)',
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(232, 159, 60, 0.3)',
    },
    tagChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E89F3C',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    cancelButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
