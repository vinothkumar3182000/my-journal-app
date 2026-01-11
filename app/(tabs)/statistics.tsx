import JourneyMap from '@/components/journey/JourneyMap';
import { Journey, JourneySummary, useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function JourneyScreen() {
    const insets = useSafeAreaInsets();
    const {
        journeys,
        activeJourneyId,
        startJourney,
        addSnapshot,
        endJourney,
        deleteJourney,
        isDarkMode,
        journeySearchQuery,
        setJourneySearchQuery
    } = useJournalStore();
    const activeJourney = useMemo(() => journeys.find(j => j.id === activeJourneyId), [journeys, activeJourneyId]);

    // UI state
    const [showStartModal, setShowStartModal] = useState(false);
    const [journeyTheme, setJourneyTheme] = useState('');
    const [isTracking, setIsTracking] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showStopModal, setShowStopModal] = useState(false);
    const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

    // Active tracking state
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState('');
    const [moodRating, setMoodRating] = useState(5);
    const [note, setNote] = useState('');

    // Timer logic
    useEffect(() => {
        let interval: any;
        if (activeJourneyId && activeJourney) {
            const start = new Date(activeJourney.startTime).getTime();
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeJourneyId]); // Only restart timer if the journey itself changes

    // Location logic
    useEffect(() => {
        let isMounted = true;
        let locationSubscription: Location.LocationSubscription | null = null;

        const startWatching = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                if (!isMounted) return;

                // Immediately get current location to avoid "Identifying..." lag
                const initialLoc = await detectLocation();
                if (initialLoc && isMounted) {
                    setCurrentLocation(initialLoc);
                    reverseGeocode(initialLoc.coords.latitude, initialLoc.coords.longitude);

                    // Add initial point to route
                    useJournalStore.getState().addRoutePoint({
                        latitude: initialLoc.coords.latitude,
                        longitude: initialLoc.coords.longitude,
                    });
                } else if (!initialLoc && isMounted) {
                    setAddress('LOCATION UNAVAILABLE');
                }

                locationSubscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 }, // More sensitive (50m instead of 100m)
                    (location) => {
                        if (!isMounted) return;
                        setCurrentLocation(location);
                        reverseGeocode(location.coords.latitude, location.coords.longitude);

                        // Track route history
                        useJournalStore.getState().addRoutePoint({
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        });
                    }
                );
            } catch (error) {
                console.warn('Error in location subscription:', error);
            }
        };

        if (activeJourneyId) {
            startWatching();
        }

        return () => {
            isMounted = false;
            if (locationSubscription) {
                try {
                    locationSubscription.remove();
                } catch (e) {
                    console.warn('Error removing location subscription:', e);
                }
            }
        };
    }, [activeJourneyId]); // Only restart watcher if the journey itself changes

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
                    data.address.state
                ].filter(Boolean);
                return parts.length > 0 ? parts.join(', ').toUpperCase() : null;
            }
        } catch (e) {
            console.error("Nominatim geocoding failed:", e);
        }
        return null;
    };

    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
            if (result.length > 0) {
                const p = result[0];
                const parts = [
                    p.street,
                    p.district || p.city,
                    p.region
                ].filter(Boolean);

                if (parts.length > 0) {
                    setAddress(parts.join(', ').toUpperCase());
                    return;
                }
            }

            // Fallback to Nominatim if native geocoder returns nothing useful
            const fallbackAddr = await reverseGeocodeNominatim(lat, lon);
            if (fallbackAddr) {
                setAddress(fallbackAddr);
            }
        } catch (e) {
            const fallbackAddr = await reverseGeocodeNominatim(lat, lon);
            if (fallbackAddr) {
                setAddress(fallbackAddr);
            }
        }
    };

    const detectLocation = async (): Promise<Location.LocationObject | null> => {
        try {
            // Check if services are enabled
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                console.warn('Location services are disabled');
                return null;
            }

            // Check permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Location permission not granted');
                return null;
            }

            // Try standard accuracy first
            try {
                return await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    // timeout: 5000 
                });
            } catch (e) {
                // If failed, try low accuracy/last known
                try {
                    return await Location.getLastKnownPositionAsync();
                } catch (innerE) {
                    return null;
                }
            }
        } catch (error) {
            console.error('Error detecting location:', error);
            return null;
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartJourney = async () => {
        if (!journeyTheme.trim()) return;

        // Show start modal loading state if we want, but for now just start
        await startJourney(journeyTheme.trim());
        setJourneyTheme('');
        setNote('');
        setMoodRating(5);
        setShowStartModal(false);

        // Try to capture initial point immediately to ensure map visibility
        const loc = await detectLocation();
        if (loc) {
            useJournalStore.getState().addRoutePoint({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
            setCurrentLocation(loc);
            reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        } else {
            setAddress('LOCATION UNAVAILABLE');
        }
    };

    const handleAddSnapshot = async () => {
        if (!currentLocation) return;

        await addSnapshot({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            address,
            moodRating,
            note: note.trim() || undefined,
        });

        setNote('');
        Alert.alert('Snapshot Recorded', 'Your progress has been tracked.');
    };

    const handleEndJourney = async () => {
        if (!activeJourney) return;

        let snapshots = activeJourney.snapshots;
        let route = [...activeJourney.route];

        // If route is empty, try to get one last location before ending
        if (route.length === 0) {
            try {
                const lastLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const newPoint = {
                    latitude: lastLoc.coords.latitude,
                    longitude: lastLoc.coords.longitude,
                    timestamp: new Date().toISOString()
                };
                route = [newPoint];
                // Update the store too so it's saved
                await useJournalStore.getState().addRoutePoint(newPoint);
            } catch (e) { }
        }
        // Get start and end addresses
        let startLoc = 'Unknown Location';
        let endLoc = 'Unknown Location';

        // Try to get geocoded addresses from snapshots first
        const snapshotAddresses = snapshots.filter(s => s.address).map(s => s.address);

        if (snapshotAddresses.length > 0) {
            startLoc = snapshotAddresses[0] || 'Unknown Location';
            endLoc = snapshotAddresses[snapshotAddresses.length - 1] || 'Unknown Location';
        } else if (route.length > 0) {
            // Fallback to geocoding the first and last route points if no snapshots have addresses
            try {
                const startPoint = route[0];
                const endPoint = route[route.length - 1];

                const fetchAddr = async (pt: { latitude: number, longitude: number }) => {
                    const res = await Location.reverseGeocodeAsync(pt);
                    if (res[0]) {
                        const p = res[0];
                        const parts = [p.street, p.district || p.city, p.region].filter(Boolean);
                        if (parts.length > 0) return parts.join(', ').toUpperCase();
                    }
                    // Try Nominatim fallback
                    const nomRes = await reverseGeocodeNominatim(pt.latitude, pt.longitude);
                    return nomRes || 'UNKNOWN LOCATION';
                };

                startLoc = await fetchAddr(startPoint);
                endLoc = await fetchAddr(endPoint);
            } catch (e) {
                console.error("End journey geocoding error:", e);
            }
        }

        const notes = snapshots.filter(s => s.note).map(s => s.note);

        const startTime = new Date(activeJourney.startTime);
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const summary: JourneySummary = {
            physicality: `Started: ${startLoc}\nEnded: ${endLoc}\nDuration: ${durationStr}`,
            mindset: '',
            memory: notes.join('; '),
            values: '',
            reflectiveQuestions: [],
            narrative: '' // Removed
        };

        await endJourney(summary);
        setNote('');
        setMoodRating(5);
        setShowStopModal(false);
    };

    const themeStyles = {
        container: { backgroundColor: isDarkMode ? '#0A1F1C' : '#F8FAFC' },
        card: { backgroundColor: isDarkMode ? '#0F2E2A' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0' },
        text: { color: isDarkMode ? '#FFFFFF' : '#0F172A' },
        subText: { color: isDarkMode ? '#8BA9A5' : '#64748B' },
        accent: { color: '#E89F3C' }
    };

    return (
        <View style={[styles.container, themeStyles.container]}>
            <LinearGradient
                colors={isDarkMode ? ['#0F2E2A', '#0A1F1C'] : ['#FFFFFF', '#F1F5F9']}
                style={[styles.header, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.headerContent}>
                    {/* Search Bar - Mirello Style */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color="#6B8E8A" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search journeys..."
                            placeholderTextColor="#6B8E8A"
                            value={journeySearchQuery}
                            onChangeText={setJourneySearchQuery}
                        />
                        {journeySearchQuery.length > 0 && (
                            <Pressable onPress={() => setJourneySearchQuery('')}>
                                <Ionicons name="close-circle" size={22} color="#6B8E8A" />
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.headerTop}>
                        <View>
                            <Text style={[styles.headerTitle, themeStyles.text]}>Journeys</Text>
                            <Text style={[styles.headerSubtitle, themeStyles.subText]}>Track your life in motion</Text>
                        </View>
                        {!activeJourney && (
                            <Pressable onPress={() => setShowStartModal(true)} style={styles.startButton}>
                                <Ionicons name="play" size={20} color="#FFFFFF" />
                                <Text style={styles.startButtonText}>New Journey</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeJourney ? (
                    <View style={[styles.activeCard, themeStyles.card]}>
                        <View style={styles.activeHeader}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text style={styles.activeLabel}>ONGOING JOURNEY</Text>
                                <Text style={[styles.activeTheme, themeStyles.text]} numberOfLines={2} ellipsizeMode="tail">{activeJourney.theme}</Text>
                            </View>
                            <View style={styles.timerContainer}>
                                <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
                            </View>
                        </View>

                        <View style={styles.locationInfo}>
                            <Ionicons name="location" size={16} color="#E89F3C" />
                            <Text style={[styles.locationText, themeStyles.subText]}>{address || 'Identifying location...'}</Text>
                        </View>

                        {activeJourney.route && activeJourney.route.length > 0 && (
                            <View style={styles.activeMapContainer}>
                                <JourneyMap route={activeJourney.route} isDarkMode={isDarkMode} />
                            </View>
                        )}

                        <View style={styles.inputSection}>
                            <Text style={[styles.inputLabel, themeStyles.text]}>Record a Memory</Text>

                            <TextInput
                                style={[styles.snapshotInput, themeStyles.card, themeStyles.text]}
                                placeholder="What's happening right now?..."
                                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.3)' : '#94A3B8'}
                                value={note}
                                onChangeText={setNote}
                                multiline
                            />

                            <Pressable onPress={handleAddSnapshot} style={styles.snapshotButton}>
                                <Ionicons name="camera" size={18} color="#FFFFFF" />
                                <Text style={styles.snapshotButtonText}>Take Snapshot</Text>
                            </Pressable>
                        </View>

                        <Pressable onPress={() => setShowStopModal(true)} style={styles.stopButton}>
                            <Ionicons name="stop" size={20} color="#FFFFFF" />
                            <Text style={styles.stopButtonText}>End Journey</Text>
                        </Pressable>
                    </View>
                ) : null}

                <View style={styles.historySection}>
                    <Text style={[styles.sectionTitle, themeStyles.text]}>Journey History</Text>
                    {journeys.filter(j => !j.isActive).filter(j =>
                        !journeySearchQuery ||
                        j.theme.toLowerCase().includes(journeySearchQuery.toLowerCase()) ||
                        j.summary?.narrative.toLowerCase().includes(journeySearchQuery.toLowerCase())
                    ).length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <Ionicons name="map-outline" size={48} color={isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0'} />
                            <Text style={[styles.emptyHistoryText, themeStyles.subText]}>
                                {journeySearchQuery ? 'No journeys match your search.' : 'No journeys recorded yet. Start one above!'}
                            </Text>
                        </View>
                    ) : (
                        journeys.filter(j => !j.isActive)
                            .filter(j =>
                                !journeySearchQuery ||
                                j.theme.toLowerCase().includes(journeySearchQuery.toLowerCase()) ||
                                j.summary?.narrative.toLowerCase().includes(journeySearchQuery.toLowerCase())
                            ).map((journey) => (
                                <Pressable
                                    key={journey.id}
                                    style={[styles.historyCard, themeStyles.card]}
                                    onPress={() => setSelectedJourney(journey)}
                                >
                                    <View style={styles.historyHeader}>
                                        <Text style={[styles.historyTheme, themeStyles.text, { flex: 1, marginRight: 8 }]} numberOfLines={1} ellipsizeMode="tail">{journey.theme}</Text>
                                        <Text style={styles.historyDate}>
                                            {new Date(journey.startTime).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.historyPreview, themeStyles.subText]} numberOfLines={2}>
                                        {journey.summary?.narrative}
                                    </Text>
                                    <View style={styles.historyFooter}>
                                        <View style={styles.historyStat}>
                                            <Ionicons name="images-outline" size={14} color="#E89F3C" />
                                            <Text style={styles.historyStatText}>{journey.snapshots.length} moments</Text>
                                        </View>
                                        <Pressable onPress={() => deleteJourney(journey.id)}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </Pressable>
                                    </View>
                                </Pressable>
                            ))
                    )}
                </View>
            </ScrollView>

            {/* Start Modal */}
            <Modal visible={showStartModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, themeStyles.card]}>
                        <Text style={[styles.modalTitle, themeStyles.text]}>Start New Journey</Text>
                        <Text style={[styles.modalSubtitle, themeStyles.subText]}>What is the theme of your adventure today?</Text>
                        <TextInput
                            style={[styles.modalInput, themeStyles.card, themeStyles.text, { borderColor: '#E89F3C' }]}
                            placeholder="e.g. Weekend Hike, Morning Commute"
                            placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.2)' : '#94A3B8'}
                            value={journeyTheme}
                            onChangeText={setJourneyTheme}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setShowStartModal(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={handleStartJourney} style={[styles.confirmButton, !journeyTheme.trim() && { opacity: 0.5 }]}>
                                <Text style={styles.confirmButtonText}>Start</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Stop Confirmation Modal */}
            <Modal visible={showStopModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, themeStyles.card]}>
                        <Ionicons name="flag" size={48} color="#E89F3C" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={[styles.modalTitle, themeStyles.text, { textAlign: 'center' }]}>End Journey?</Text>
                        <Text style={[styles.modalSubtitle, themeStyles.subText, { textAlign: 'center' }]}>
                            This will finish your tracking and generate your reflective master summary.
                        </Text>
                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setShowStopModal(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Continue</Text>
                            </Pressable>
                            <Pressable onPress={handleEndJourney} style={[styles.confirmButton, { backgroundColor: '#E89F3C' }]}>
                                <Text style={styles.confirmButtonText}>End & Summarize</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Summary Detail Modal */}
            <Modal visible={!!selectedJourney} animationType="slide" statusBarTranslucent={true}>
                <View style={[styles.detailContainer, themeStyles.container]}>
                    <View style={[styles.detailHeader, { paddingTop: insets.top + 20 }]}>
                        <Pressable onPress={() => setSelectedJourney(null)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={isDarkMode ? '#FFF' : '#000'} />
                        </Pressable>
                        <Text style={[styles.detailHeaderTitle, themeStyles.text, { flex: 1, marginRight: 44 }]} numberOfLines={1} ellipsizeMode="tail">{selectedJourney?.theme}</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.detailScroll}>
                        {selectedJourney && (
                            <>
                                {selectedJourney.route && selectedJourney.route.length > 0 ? (
                                    <JourneyMap route={selectedJourney.route} isDarkMode={isDarkMode} />
                                ) : (
                                    <View style={styles.emptyMapPlaceholder}>
                                        <Ionicons name="map-outline" size={40} color={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                                        <Text style={[styles.emptyMapText, themeStyles.subText]}>No route data available</Text>
                                    </View>
                                )}


                                <View style={[styles.summaryBlock, { marginBottom: 30 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <Ionicons name="time-outline" size={14} color={isDarkMode ? '#8BA9A5' : '#64748B'} />
                                        <Text style={[styles.historyDate, themeStyles.subText]}>
                                            {new Date(selectedJourney.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {selectedJourney.endTime ? new Date(selectedJourney.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                                        </Text>
                                        <Text style={[styles.historyDate, themeStyles.subText]}>•</Text>
                                        <Text style={[styles.historyDate, themeStyles.subText]}>
                                            {new Date(selectedJourney.startTime).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>


                                <View style={styles.statsSection}>
                                    <View style={styles.summaryBlock}>
                                        <Text style={styles.summaryLabel}>JOURNEY LOG</Text>
                                        <Text style={[styles.summaryValue, themeStyles.text, { whiteSpace: 'pre-line' } as any]}>{selectedJourney.summary?.physicality}</Text>
                                        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Ionicons name="camera-outline" size={16} color="#E89F3C" />
                                            <Text style={[styles.summaryValue, themeStyles.text, { fontWeight: 'bold' }]}>{selectedJourney.snapshots.length} Records</Text>
                                        </View>
                                    </View>

                                    {selectedJourney.summary?.memory ? (
                                        <View style={styles.summaryBlock}>
                                            <Text style={styles.summaryLabel}>RECORDS</Text>
                                            <Text style={[styles.summaryValue, themeStyles.text]}>{selectedJourney.summary?.memory}</Text>
                                        </View>
                                    ) : null}
                                </View>

                                {selectedJourney.snapshots.filter(s => s.note).length > 0 && (
                                    <View style={styles.snapshotTimeline}>
                                        <Text style={[styles.questionsTitle, themeStyles.text]}>Your Captured Moments</Text>
                                        {selectedJourney.snapshots.filter(s => s.note).map((s, i) => (
                                            <View key={i} style={[styles.snapshotItem, themeStyles.card]}>
                                                <View style={styles.snapshotItemHeader}>
                                                    <Text style={styles.snapshotTime}>
                                                        {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                    {s.address && <Text style={styles.snapshotLoc}>{s.address}</Text>}
                                                </View>
                                                <Text style={[styles.snapshotNote, themeStyles.text]}>{s.note}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 24, paddingHorizontal: 20 },
    headerContent: {},
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
    },
    headerTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
    headerSubtitle: { fontSize: 15 },
    startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E89F3C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 },
    startButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    activeCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    activeLabel: { fontSize: 11, fontWeight: 'bold', color: '#E89F3C', letterSpacing: 1, marginBottom: 4 },
    activeTheme: { fontSize: 22, fontWeight: 'bold' },
    timerContainer: { backgroundColor: 'rgba(232, 159, 60, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    timerText: { fontSize: 18, fontWeight: 'bold', color: '#E89F3C', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    locationText: { fontSize: 13, fontWeight: '500' },
    inputSection: { gap: 16 },
    inputLabel: { fontSize: 16, fontWeight: 'bold' },
    moodSelector: { flexDirection: 'row', gap: 10 },
    moodOption: { flex: 1, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    moodText: { fontSize: 16, fontWeight: 'bold', color: '#8BA9A5' },
    snapshotInput: { borderRadius: 16, padding: 16, borderWidth: 1, fontSize: 15, minHeight: 80 },
    snapshotButton: { backgroundColor: '#E89F3C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 16, gap: 8 },
    snapshotButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
    stopButton: { marginTop: 20, height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', gap: 8 },
    stopButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
    historySection: {},
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    historyCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    historyTheme: { fontSize: 17, fontWeight: 'bold' },
    historyDate: { fontSize: 12, color: '#8BA9A5' },
    historyPreview: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
    historyStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    historyStatText: { fontSize: 12, color: '#8BA9A5', fontWeight: '500' },
    emptyHistory: { alignItems: 'center', gap: 12, paddingTop: 40 },
    emptyHistoryText: { fontSize: 14, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 24, borderRadius: 24, borderWidth: 1 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    modalSubtitle: { fontSize: 15, marginBottom: 20 },
    modalInput: { borderRadius: 16, padding: 16, borderWidth: 1, fontSize: 16, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelButton: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
    cancelButtonText: { color: '#8BA9A5', fontWeight: '600' },
    confirmButton: { flex: 2, height: 50, backgroundColor: '#E89F3C', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    confirmButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    detailContainer: { flex: 1 },
    detailHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
    closeButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    detailHeaderTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    detailScroll: { padding: 20 },
    narrativeCard: { padding: 30, borderRadius: 24, marginBottom: 30 },
    narrativeText: { color: '#FFFFFF', fontSize: 18, lineHeight: 28, fontWeight: '600', fontStyle: 'italic', marginVertical: 20 },
    narrativeTheme: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    narrativeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    narrativeDate: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
    statsSection: { gap: 24, marginBottom: 40 },
    summaryBlock: { gap: 8 },
    summaryLabel: { fontSize: 12, fontWeight: '900', color: '#E89F3C', letterSpacing: 1 },
    summaryValue: { fontSize: 15, lineHeight: 24 },
    questionsSection: { gap: 16 },
    questionsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    questionCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
    questionText: { fontSize: 15, lineHeight: 22 },
    mapContainer: { height: 200, borderRadius: 24, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    map: { flex: 1 },
    snapshotTimeline: { gap: 16 },
    snapshotItem: { padding: 16, borderRadius: 20, borderWidth: 1 },
    snapshotItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    snapshotTime: { fontSize: 12, color: '#E89F3C', fontWeight: 'bold' },
    snapshotNote: { fontSize: 15, lineHeight: 22 },
    snapshotLoc: { fontSize: 12, color: '#8BA9A5' },
    subText: { color: '#8BA9A5' },
    emptyMapPlaceholder: {
        height: 200,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    emptyMapText: {
        fontSize: 14,
        marginTop: 8,
    },
    activeMapContainer: {
        height: 150,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
});

