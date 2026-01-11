import { useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapContent } from './MapContent';

interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

interface AddEntryModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: {
        content: string;
        mood: 'amazing' | 'happy' | 'neutral' | 'sad' | 'terrible';
        date: string;
        time?: string;
        title?: string;
        location?: string;
        latitude?: number;
        longitude?: number;
        weather?: string;
        photo?: string;
    }) => void;
    initialData?: {
        content: string;
        mood: 'amazing' | 'happy' | 'neutral' | 'sad' | 'terrible';
        date: string;
        time?: string;
        title?: string;
        location?: string;
        latitude?: number;
        longitude?: number;
        weather?: string;
        photo?: string;
    } | null;
}

// Beautiful nature placeholder images
const BACKGROUND_IMAGES = [
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop', // Nature landscape
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop', // Yosemite
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1887&auto=format&fit=crop', // Forest
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1948&auto=format&fit=crop', // Foggy mountains
];
export function AddEntryModal({ visible, onClose, onSave, initialData }: AddEntryModalProps) {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useJournalStore();

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [location, setLocation] = useState('');
    const [mood, setMood] = useState<'amazing' | 'happy' | 'neutral' | 'sad' | 'terrible'>('happy');
    const [photo, setPhoto] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [time, setTime] = useState(new Date());
    const [temperature, setTemperature] = useState('24°C');

    // UI State
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isLocationManuallyEdited, setIsLocationManuallyEdited] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Map State
    const [showMap, setShowMap] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [mapMarker, setMapMarker] = useState<{ latitude: number; longitude: number } | undefined>(undefined);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                // ... existing initialData logic ...
                setTitle(initialData.title || '');
                setContent(initialData.content);
                setMood(initialData.mood);
                setLocation(initialData.location || '');
                setLatitude(initialData.latitude);
                setLongitude(initialData.longitude);
                setPhoto(initialData.photo || null);
                if (initialData.photo) {
                    setBackgroundImage(initialData.photo);
                }
                setIsLocationManuallyEdited(true);
                setTemperature(initialData.weather || '24°C');

                // Parse time if exists, else current
                if (initialData.time) {
                    const [hours, minutes] = initialData.time.split(':').map(Number);
                    const date = new Date();
                    date.setHours(hours, minutes);
                    setTime(date);
                } else {
                    setTime(new Date());
                }

            } else {
                // ... reset logic ...
                setTitle('');
                setContent('');
                setMood('happy');
                setLocation('');
                setLatitude(undefined);
                setLongitude(undefined);
                setPhoto(null);
                setBackgroundImage(null);
                setIsLocationManuallyEdited(false);
                setTime(new Date()); // Reset time
                setTemperature('24°C');

                detectLocation();
            }
        }
    }, [visible, initialData]);

    const fetchWeather = async (lat: number, lon: number) => {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            const data = await response.json();
            if (data && data.current_weather) {
                const temp = Math.round(data.current_weather.temperature);
                setTemperature(`${temp}°C`);
                return `${temp}°C`;
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
        }
        return null;
    };

    // ... existing functions ...

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setTime(selectedTime);
        }
    };

    const handleSave = () => {
        if (content.trim()) {
            const formattedTime = time.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false // Store as 24h format for consistency "HH:mm"
            });

            onSave({
                content: content.trim(),
                mood,
                date: new Date().toISOString(),
                time: formattedTime,
                title: title.trim() || undefined,
                location: location.trim() || undefined,
                latitude,
                longitude,
                weather: temperature,
                photo: photo || backgroundImage || (initialData?.photo ? initialData.photo : undefined),
            });
            onClose();
        }
    };

    const handleTemperaturePress = () => {
        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Update Temperature',
                'Enter current temperature (e.g., 28°C)',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'OK',
                        onPress: (val?: string) => {
                            if (val) {
                                const formatted = val.includes('°') ? val : `${val}°C`;
                                setTemperature(formatted.toUpperCase());
                            }
                        }
                    },
                ],
                'plain-text',
                temperature
            );
        } else {
            // Android/Web fallback - keep it simple for now or use a custom prompt if needed
            // For now, let's just use a simple alert with one option or nothing to avoid complex UI changes
            Alert.alert('Temperature Edit', 'Manual temperature editing is being optimized for Android. Currently using: ' + temperature);
        }
    };

    // ... existing render ...

    {/* Info Badges */ }
    <View style={styles.infoRow}>
        <View style={styles.infoBadge}>
            <Ionicons name="sunny" size={14} color="#FFD700" />
            <Text style={styles.infoText}>24°C</Text>
        </View>
        <View style={styles.infoBadge}>
            <Text style={styles.infoText}>
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}
            </Text>
        </View>
        <Pressable
            style={[styles.infoBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={() => setShowTimePicker(true)}
        >
            <Ionicons name="time-outline" size={14} color="#FFFFFF" />
            <Text style={styles.infoText}>
                {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toUpperCase()}
            </Text>
        </Pressable>
    </View>

    {/* ... Rest of UI ... */ }

    {
        showTimePicker && (
            <DateTimePicker
                value={time}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={onTimeChange}
            />
        )
    }

    const reverseGeocodeNominatim = async (lat: number, lon: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
                headers: {
                    'User-Agent': 'JournalApp/1.0'
                }
            });
            const data = await response.json();
            if (data && data.address) {
                const parts = [
                    data.address.road || data.address.pedestrian,
                    data.address.city || data.address.town || data.address.village || data.address.county,
                    data.address.state || data.address.country
                ].filter(Boolean);
                return parts.length > 0 ? parts.join(', ').toUpperCase() : 'UNKNOWN LOCATION';
            }
        } catch (e) {
            console.error("Nominatim geocoding failed:", e);
        }
        return null;
    };

    const detectLocation = async () => {
        if (isLocationManuallyEdited) return;

        try {
            setIsLoadingLocation(true);

            // Check if services are enabled
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                Alert.alert('Location Disabled', 'Please enable location services in your device settings.');
                setIsLoadingLocation(false);
                return;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to fetch your current position.');
                setIsLoadingLocation(false);
                return;
            }

            let currentLoc: Location.LocationObject | null = null;
            try {
                // Try high accuracy briefly
                currentLoc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            } catch (e) {
                // Fallback to last known position if current is unavailable
                currentLoc = await Location.getLastKnownPositionAsync();
            }

            if (!currentLoc) {
                Alert.alert('Location Unavailable', 'Could not determine your current location. Please check your signal or try again.');
                setIsLoadingLocation(false);
                return;
            }

            // Update map region to current location
            setMapRegion({
                latitude: currentLoc.coords.latitude,
                longitude: currentLoc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
            setMapMarker({
                latitude: currentLoc.coords.latitude,
                longitude: currentLoc.coords.longitude,
            });
            setLatitude(currentLoc.coords.latitude);
            setLongitude(currentLoc.coords.longitude);

            let address: string | null = null;
            try {
                const place = await Location.reverseGeocodeAsync({
                    latitude: currentLoc.coords.latitude,
                    longitude: currentLoc.coords.longitude,
                });

                if (place && place.length > 0) {
                    const parts = [
                        place[0].street,
                        place[0].city,
                        place[0].region
                    ].filter(Boolean);
                    address = parts.length > 0 ? parts.join(', ').toUpperCase() : (place[0].city?.toUpperCase() || 'UNKNOWN LOCATION');
                }
            } catch (err) {
                console.log("Native geocode failed, trying Nominatim fallback...");
                address = await reverseGeocodeNominatim(currentLoc.coords.latitude, currentLoc.coords.longitude);
            }

            if (address && !isLocationManuallyEdited) {
                setLocation(address);
                fetchWeather(currentLoc.coords.latitude, currentLoc.coords.longitude);
            }

        } catch (error) {
            console.error('Error fetching location:', error);
            Alert.alert('Error', 'An unexpected error occurred while fetching location.');
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handleMapSelect = async () => {
        if (mapMarker) {
            let address: string | null = "UNKNOWN LOCATION";
            try {
                const place = await Location.reverseGeocodeAsync({
                    latitude: mapMarker.latitude,
                    longitude: mapMarker.longitude,
                });

                if (place && place.length > 0) {
                    // detailed address
                    const parts = [
                        place[0].street,
                        place[0].city,
                        place[0].region
                    ].filter(Boolean);

                    address = parts.length > 0 ? parts.join(', ').toUpperCase() : (place[0].city?.toUpperCase() || 'UNKNOWN LOCATION');
                }
            } catch (error) {
                console.log("Native geocode failed (map select), trying Nominatim fallback...");
                const fallbackAddress = await reverseGeocodeNominatim(mapMarker.latitude, mapMarker.longitude);
                if (fallbackAddress) address = fallbackAddress;
            }

            if (address) {
                setLocation(address);
                fetchWeather(mapMarker.latitude, mapMarker.longitude);
            }
            setLatitude(mapMarker.latitude);
            setLongitude(mapMarker.longitude);
            setIsLocationManuallyEdited(true);
            setShowMap(false);
        }
    };

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
            setBackgroundImage(result.assets[0].uri);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
            presentationStyle="fullScreen"
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                {/* Background Layer */}
                {/* Background Layer */}
                {backgroundImage ? (
                    <>
                        <ImageBackground
                            source={{ uri: backgroundImage }}
                            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
                            resizeMode="cover"
                        />
                        {/* Gradient Overlay for Images - Lighter to show content but keep text readable */}
                        <LinearGradient
                            colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
                            style={StyleSheet.absoluteFill}
                        />
                    </>
                ) : (
                    // Rich Gradient for Default State - No overlay needed, clean look
                    <LinearGradient
                        colors={['#0F172A', '#1E293B', '#0F172A']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={[styles.header, { marginTop: insets.top }]}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.headerButton,
                                pressed && styles.headerButtonPressed
                            ]}
                        >
                            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                        </Pressable>

                        <View style={styles.headerRight}>
                            <Pressable
                                onPress={pickImage}
                                style={({ pressed }) => [
                                    styles.changeCoverButton,
                                    pressed && styles.headerButtonPressed
                                ]}
                            >
                                <Ionicons name="image-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.changeCoverText}>Change Cover</Text>
                            </Pressable>

                            <Pressable
                                onPress={handleSave}
                                disabled={!content.trim()}
                                style={({ pressed }) => [
                                    styles.saveButton,
                                    !content.trim() && { opacity: 0.5 },
                                    pressed && content.trim() && styles.headerButtonPressed
                                ]}
                            >
                                <Text style={styles.saveButtonText}>
                                    {initialData ? 'UPDATE' : 'NEXT'}
                                </Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Main Title Area */}
                        <View style={styles.mainContent}>
                            <TextInput
                                style={styles.titleInput}
                                placeholder="Title"
                                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                                value={title}
                                onChangeText={setTitle}
                                multiline
                            />

                            <View style={styles.locationContainer}>
                                <Pressable
                                    onPress={() => setShowMap(true)}
                                    style={({ pressed }) => [{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        opacity: pressed ? 0.7 : 1
                                    }]}
                                >
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 8 }}>
                                        <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                                    </View>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setIsLocationManuallyEdited(false);
                                        detectLocation();
                                    }}
                                    style={({ pressed }) => [{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        padding: 6,
                                        borderRadius: 8,
                                        opacity: pressed ? 0.7 : 1
                                    }]}
                                >
                                    <Ionicons name="compass-outline" size={18} color="#FFFFFF" />
                                </Pressable>

                                <Ionicons name="location-sharp" size={16} color="rgba(255, 255, 255, 0.8)" />
                                <TextInput
                                    style={styles.locationInput}
                                    placeholder={isLoadingLocation ? "LOCATING..." : "ADD LOCATION"}
                                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                                    value={location}
                                    onChangeText={(text) => {
                                        setLocation(text.toUpperCase());
                                        setIsLocationManuallyEdited(true);
                                    }}
                                />
                                {isLoadingLocation && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 8 }} />}
                            </View>
                        </View>

                        {/* Info Badges */}
                        <View style={styles.infoRow}>
                            <Pressable
                                style={styles.infoBadge}
                                onPress={handleTemperaturePress}
                            >
                                <Ionicons name="sunny" size={14} color="#FFD700" />
                                <Text style={styles.infoText}>{temperature || '24°C'}</Text>
                            </Pressable>
                            <View style={styles.infoBadge}>
                                <Text style={styles.infoText}>
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                                </Text>
                            </View>
                            <Pressable
                                style={styles.infoBadge}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Ionicons name="time-sharp" size={14} color="#FFFFFF" />
                                <Text style={styles.infoText}>
                                    {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toUpperCase()}
                                </Text>
                            </Pressable>
                        </View>

                        {/* Story Input Area */}
                        <View style={styles.storyContainer}>
                            <TextInput
                                style={styles.storyInput}
                                placeholder="Write your story..."
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={content}
                                onChangeText={setContent}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {showTimePicker && (
                    <DateTimePicker
                        value={time}
                        mode="time"
                        is24Hour={false}
                        display="default"
                        onChange={onTimeChange}
                    />
                )}

                {/* Map Modal */}
                <Modal
                    visible={showMap}
                    animationType="slide"
                    onRequestClose={() => setShowMap(false)}
                >
                    <MapContent
                        insets={insets}
                        onClose={() => setShowMap(false)}
                        mapRegion={mapRegion}
                        setMapRegion={setMapRegion}
                        mapMarker={mapMarker}
                        setMapMarker={setMapMarker}
                        handleMapSelect={handleMapSelect}
                    />
                </Modal>

                <StatusBar barStyle="light-content" />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        marginBottom: 10,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    changeCoverButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 23,
        backgroundColor: 'transparent',
        gap: 6,
        height: 46,
    },
    changeCoverText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    iconCircle: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        borderRadius: 23,
        gap: 6,
        height: 46,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    mainContent: {
        marginBottom: 40,
        marginTop: 10,
    },
    titleInput: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    infoText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    storyContainer: {
        minHeight: 200,
    },
    storyInput: {
        fontSize: 18,
        color: '#FFFFFF',
        lineHeight: 28,
        fontWeight: '400',
        minHeight: 400,
    },
});
