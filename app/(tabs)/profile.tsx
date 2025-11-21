import { useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ProfileScreen() {
    const { entries, isDarkMode, toggleTheme } = useJournalStore();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [userName, setUserName] = useState('Travel Enthusiast');
    const [userBio, setUserBio] = useState('Capturing memories, one journey at a time ✨');
    const [userEmail, setUserEmail] = useState('traveler@example.com');
    const [profileImage, setProfileImage] = useState('https://ui-avatars.com/api/?name=Travel+Enthusiast&size=200&background=E89F3C&color=fff');

    // Settings states
    const [dailyReminders, setDailyReminders] = useState(true);
    const [autoSave, setAutoSave] = useState(true);

    // Calculate stats
    const totalEntries = entries.length;
    const favoriteEntries = entries.filter(e => e.isFavorite).length;
    const entriesThisMonth = entries.filter(e => {
        const date = new Date(e.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const handleImageUpload = () => {
        const randomAvatar = `https://ui-avatars.com/api/?name=${userName}&size=200&background=${Math.random() > 0.5 ? 'E89F3C' : '10B981'}&color=fff`;
        setProfileImage(randomAvatar);
    };

    const handleSaveProfile = () => {
        setEditModalVisible(false);
        // Save to storage
    };

    // Dynamic styles
    const themeStyles = {
        container: {
            backgroundColor: isDarkMode ? '#0A1F1C' : '#F8FAFC',
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
        icon: {
            color: isDarkMode ? '#B8D0CC' : '#94A3B8',
        },
        input: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
        }
    };

    return (
        <View style={[styles.container, themeStyles.container]}>
            {/* Header */}
            <LinearGradient
                colors={isDarkMode ? ['#0F2E2A', '#0A1F1C'] : ['#FFFFFF', '#F1F5F9']}
                style={styles.header}
            >
                <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>Profile</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={[styles.profileCard, themeStyles.card, { borderWidth: 1 }]}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={{ uri: profileImage }}
                            style={styles.profileImage}
                        />
                        <Pressable
                            onPress={handleImageUpload}
                            style={styles.editImageButton}
                        >
                            <Ionicons name="camera" size={18} color="#FFFFFF" />
                        </Pressable>
                    </View>

                    <Text style={[styles.userName, themeStyles.text]}>{userName}</Text>
                    <Text style={[styles.userBio, themeStyles.subText]}>{userBio}</Text>

                    <Pressable
                        onPress={() => setEditModalVisible(true)}
                        style={styles.editProfileButton}
                    >
                        <LinearGradient
                            colors={['#E89F3C', '#D68A2E']}
                            style={styles.editButtonGradient}
                        >
                            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </LinearGradient>
                    </Pressable>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, themeStyles.card]}>
                        <Ionicons name="book" size={24} color="#E89F3C" />
                        <Text style={[styles.statNumber, themeStyles.text]}>{totalEntries}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>Entries</Text>
                    </View>
                    <View style={[styles.statCard, themeStyles.card]}>
                        <Ionicons name="star" size={24} color="#E89F3C" />
                        <Text style={[styles.statNumber, themeStyles.text]}>{favoriteEntries}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>Favorites</Text>
                    </View>
                    <View style={[styles.statCard, themeStyles.card]}>
                        <Ionicons name="calendar" size={24} color="#E89F3C" />
                        <Text style={[styles.statNumber, themeStyles.text]}>{entriesThisMonth}</Text>
                        <Text style={[styles.statLabel, themeStyles.subText]}>This Month</Text>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, themeStyles.text]}>Settings</Text>

                    <View style={[styles.settingItem, themeStyles.card]}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="notifications-outline" size={22} color={themeStyles.icon.color} />
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, themeStyles.text]}>Daily Reminders</Text>
                                <Text style={[styles.settingSubtitle, themeStyles.subText]}>Get notified to write daily</Text>
                            </View>
                        </View>
                        <Switch
                            value={dailyReminders}
                            onValueChange={setDailyReminders}
                            trackColor={{ false: isDarkMode ? '#334155' : '#CBD5E1', true: '#E89F3C' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={[styles.settingItem, themeStyles.card]}>
                        <View style={styles.settingLeft}>
                            <Ionicons name={isDarkMode ? "moon-outline" : "sunny-outline"} size={22} color={themeStyles.icon.color} />
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, themeStyles.text]}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
                                <Text style={[styles.settingSubtitle, themeStyles.subText]}>{isDarkMode ? 'Mirello dark theme' : 'Light theme'}</Text>
                            </View>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#CBD5E1', true: '#E89F3C' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={[styles.settingItem, themeStyles.card]}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="save-outline" size={22} color={themeStyles.icon.color} />
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingTitle, themeStyles.text]}>Auto Save</Text>
                                <Text style={[styles.settingSubtitle, themeStyles.subText]}>Save drafts automatically</Text>
                            </View>
                        </View>
                        <Switch
                            value={autoSave}
                            onValueChange={setAutoSave}
                            trackColor={{ false: isDarkMode ? '#334155' : '#CBD5E1', true: '#E89F3C' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, themeStyles.text]}>Account</Text>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="mail-outline" size={22} color={themeStyles.icon.color} />
                            <Text style={[styles.menuText, themeStyles.text]}>Email</Text>
                        </View>
                        <View style={styles.menuRight}>
                            <Text style={[styles.menuValue, themeStyles.subText]}>{userEmail}</Text>
                            <Ionicons name="chevron-forward" size={20} color={themeStyles.subText.color} />
                        </View>
                    </Pressable>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="lock-closed-outline" size={22} color={themeStyles.icon.color} />
                            <Text style={[styles.menuText, themeStyles.text]}>Change Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={themeStyles.subText.color} />
                    </Pressable>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="shield-checkmark-outline" size={22} color={themeStyles.icon.color} />
                            <Text style={[styles.menuText, themeStyles.text]}>Privacy</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={themeStyles.subText.color} />
                    </Pressable>
                </View>

                {/* Data Management Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, themeStyles.text]}>Data Management</Text>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="download-outline" size={22} color={themeStyles.icon.color} />
                            <Text style={[styles.menuText, themeStyles.text]}>Export Data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={themeStyles.subText.color} />
                    </Pressable>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="cloud-upload-outline" size={22} color={themeStyles.icon.color} />
                            <Text style={[styles.menuText, themeStyles.text]}>Backup & Sync</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={themeStyles.subText.color} />
                    </Pressable>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                            <Text style={[styles.menuText, { color: '#EF4444' }]}>Clear All Data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={themeStyles.subText.color} />
                    </Pressable>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, themeStyles.text]}>About</Text>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="information-circle-outline" size={22} color={themeStyles.icon.color} />
                            <Text style={[styles.menuText, themeStyles.text]}>Version</Text>
                        </View>
                        <Text style={[styles.menuValue, themeStyles.subText]}>1.0.0</Text>
                    </Pressable>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="help-circle-outline" size={22} color={themeStyles.icon.color} />
                            <Text style={[styles.menuText, themeStyles.text]}>Help & Support</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={themeStyles.subText.color} />
                    </Pressable>

                    <Pressable style={[styles.menuItem, themeStyles.card]}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="heart-outline" size={22} color="#E89F3C" />
                            <Text style={[styles.menuText, themeStyles.text]}>Rate App</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={themeStyles.subText.color} />
                    </Pressable>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#0F2E2A' : '#FFFFFF' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, themeStyles.text]}>Edit Profile</Text>
                            <Pressable onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={themeStyles.icon.color} />
                            </Pressable>
                        </View>

                        <ScrollView>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder="Your name"
                                placeholderTextColor={themeStyles.subText.color}
                            />

                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, themeStyles.input]}
                                value={userBio}
                                onChangeText={setUserBio}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={themeStyles.subText.color}
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, themeStyles.input]}
                                value={userEmail}
                                onChangeText={setUserEmail}
                                placeholder="your@email.com"
                                placeholderTextColor={themeStyles.subText.color}
                                keyboardType="email-address"
                            />
                        </ScrollView>

                        <Pressable onPress={handleSaveProfile} style={styles.saveButton}>
                            <LinearGradient
                                colors={['#E89F3C', '#D68A2E']}
                                style={styles.saveButtonGradient}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
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
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    profileCard: {
        margin: 20,
        marginTop: 10,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#E89F3C',
    },
    editImageButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#E89F3C',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0F2E2A',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userBio: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    editProfileButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    editButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 24,
        gap: 8,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 12,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    menuText: {
        fontSize: 15,
        fontWeight: '500',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuValue: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#B8D0CC',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 24,
    },
    saveButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
