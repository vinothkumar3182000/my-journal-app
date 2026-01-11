import { useAuthStore } from '@/store/authStore';
import { useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
    const { isDarkMode } = useJournalStore();
    const { signUp, signInWithGoogle, error, isLoading, clearError } = useAuthStore();

    const [request, response, promptAsync] = Google.useAuthRequest({
        // TODO: Replace with your actual client IDs
        iosClientId: 'YOUR_IOS_CLIENT_ID',
        androidClientId: 'YOUR_ANDROID_CLIENT_ID',
        webClientId: 'YOUR_WEB_CLIENT_ID',
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                signInWithGoogle(id_token);
            }
        }
    }, [response]);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleSignup = async () => {
        // Clear previous errors
        clearError();
        setLocalError('');

        // Validation
        if (!name.trim()) {
            setLocalError('Please enter your name');
            return;
        }

        if (!email.trim()) {
            setLocalError('Please enter your email');
            return;
        }

        if (!email.includes('@')) {
            setLocalError('Please enter a valid email address');
            return;
        }

        if (!password) {
            setLocalError('Please enter a password');
            return;
        }

        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        try {
            await signUp(email.trim(), password, name.trim());
            // Navigation will be handled by root layout auth state change
        } catch (err) {
            // Error is already set in the auth store
            console.error('Signup error:', err);
        }
    };

    const navigateToLogin = () => {
        clearError();
        setLocalError('');
        router.back();
    };

    const displayError = localError || error;

    // Dynamic styles  
    const themeStyles = {
        container: {
            backgroundColor: isDarkMode ? '#0A1F1C' : '#F8FAFC',
        },
        cardBg: isDarkMode ? 'rgba(15, 46, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        title: {
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
        },
        subtitle: {
            color: isDarkMode ? '#8BA9A5' : '#64748B',
        },
        inputBg: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
        inputBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
        inputText: {
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
        },
        linkText: {
            color: '#E89F3C',
        },
        hintText: {
            color: isDarkMode ? '#6B8E8A' : '#94A3B8',
        },
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, themeStyles.container]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={isDarkMode ? ['#0A1F1C', '#0F2E2A'] : ['#F8FAFC', '#E2E8F0']}
                style={styles.gradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Close Button */}
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.closeButton}
                        hitSlop={10}
                    >
                        <Ionicons name="close" size={24} color={themeStyles.title.color} />
                    </Pressable>

                    {/* Logo and Title */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={['#E89F3C', '#D68A2E']}
                                style={styles.logoGradient}
                            >
                                <Ionicons name="create" size={40} color="#FFFFFF" />
                            </LinearGradient>
                        </View>
                        <Text style={[styles.title, themeStyles.title]}>Create Account</Text>
                        <Text style={[styles.subtitle, themeStyles.subtitle]}>
                            Start your journaling journey
                        </Text>
                    </View>

                    {/* Signup Form */}
                    <View style={[styles.formCard, { backgroundColor: themeStyles.cardBg }]}>
                        {displayError && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                <Text style={styles.errorText}>{displayError}</Text>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, themeStyles.title]}>Name</Text>
                            <View style={[
                                styles.inputContainer,
                                { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.inputBorder }
                            ]}>
                                <Ionicons name="person-outline" size={20} color="#6B8E8A" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, themeStyles.inputText]}
                                    placeholder="Your Name"
                                    placeholderTextColor="#6B8E8A"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, themeStyles.title]}>Email</Text>
                            <View style={[
                                styles.inputContainer,
                                { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.inputBorder }
                            ]}>
                                <Ionicons name="mail-outline" size={20} color="#6B8E8A" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, themeStyles.inputText]}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#6B8E8A"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    autoComplete="email"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, themeStyles.title]}>Password</Text>
                            <View style={[
                                styles.inputContainer,
                                { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.inputBorder }
                            ]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6B8E8A" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, themeStyles.inputText]}
                                    placeholder="••••••••"
                                    placeholderTextColor="#6B8E8A"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoComplete="password-new"
                                    editable={!isLoading}
                                />
                                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#6B8E8A"
                                    />
                                </Pressable>
                            </View>
                            <Text style={[styles.hint, themeStyles.hintText]}>
                                Minimum 6 characters
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, themeStyles.title]}>Confirm Password</Text>
                            <View style={[
                                styles.inputContainer,
                                { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.inputBorder }
                            ]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6B8E8A" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, themeStyles.inputText]}
                                    placeholder="••••••••"
                                    placeholderTextColor="#6B8E8A"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoComplete="password-new"
                                    editable={!isLoading}
                                />
                                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#6B8E8A"
                                    />
                                </Pressable>
                            </View>
                        </View>

                        <Pressable
                            onPress={handleSignup}
                            disabled={isLoading}
                            style={({ pressed }) => [
                                styles.signupButton,
                                { opacity: pressed ? 0.9 : 1 }
                            ]}
                        >
                            <LinearGradient
                                colors={['#E89F3C', '#D68A2E']}
                                style={styles.signupButtonGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.signupButtonText}>Create Account</Text>
                                )}
                            </LinearGradient>
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: themeStyles.inputBorder }]} />
                            <Text style={[styles.dividerText, themeStyles.subtitle]}>
                                OR
                            </Text>
                            <View style={[styles.dividerLine, { backgroundColor: themeStyles.inputBorder }]} />
                        </View>

                        {/* Google Sign In Button */}
                        <Pressable
                            onPress={() => promptAsync()}
                            disabled={!request || isLoading}
                            style={({ pressed }) => [
                                styles.googleButton,
                                {
                                    opacity: pressed ? 0.9 : 1,
                                    backgroundColor: isDarkMode ? '#FFFFFF' : '#1F2937'
                                }
                            ]}
                        >
                            <Ionicons name="logo-google" size={20} color={isDarkMode ? '#000000' : '#FFFFFF'} style={styles.googleIcon} />
                            <Text style={[styles.googleButtonText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>
                                Sign up with Google
                            </Text>
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: themeStyles.inputBorder }]} />
                            <Text style={[styles.dividerText, themeStyles.subtitle]}>
                                Already have an account?
                            </Text>
                            <View style={[styles.dividerLine, { backgroundColor: themeStyles.inputBorder }]} />
                        </View>

                        <Pressable
                            onPress={navigateToLogin}
                            disabled={isLoading}
                            style={({ pressed }) => [
                                styles.loginButton,
                                {
                                    backgroundColor: themeStyles.inputBg,
                                    borderColor: themeStyles.inputBorder,
                                    opacity: pressed ? 0.8 : 1
                                }
                            ]}
                        >
                            <Text style={[styles.loginButtonText, themeStyles.linkText]}>
                                Sign In
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 60,
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#E89F3C',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 14,
    },
    eyeIcon: {
        padding: 4,
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
    },
    signupButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    signupButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        marginBottom: 0,
    },
    googleIcon: {
        marginRight: 10,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 13,
    },
    loginButton: {
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
