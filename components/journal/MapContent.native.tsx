import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { EdgeInsets } from 'react-native-safe-area-context';

interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

interface MapContentProps {
    insets: EdgeInsets;
    onClose: () => void;
    mapRegion: Region;
    setMapRegion: (region: Region) => void;
    mapMarker?: { latitude: number; longitude: number };
    setMapMarker: (coordinate: { latitude: number; longitude: number }) => void;
    handleMapSelect: () => void;
}

export function MapContent({
    insets,
    onClose,
    mapRegion,
    setMapRegion,
    mapMarker,
    setMapMarker,
    handleMapSelect
}: MapContentProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

    const fetchSuggestions = async (query: string) => {
        if (query.trim().length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSuggestionsLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
                {
                    headers: {
                        'User-Agent': 'JournalApp/1.0',
                    },
                }
            );
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setIsSuggestionsLoading(false);
        }
    };

    // Debounce manual typing for suggestions
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) fetchSuggestions(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await Location.geocodeAsync(searchQuery);
            if (results.length > 0) {
                const { latitude, longitude } = results[0];
                const newRegion = {
                    ...mapRegion,
                    latitude,
                    longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                };
                setMapRegion(newRegion);
                setMapMarker({ latitude, longitude });
            } else {
                Alert.alert('Location Not Found', 'Try searching for a different address or place name.');
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Error', 'Failed to search for location. Please check your connection.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSuggestion = (item: any) => {
        const latitude = parseFloat(item.lat);
        const longitude = parseFloat(item.lon);
        const newRegion = {
            ...mapRegion,
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);
        setMapMarker({ latitude, longitude });

        // Extract a shorter display name
        const displayName = item.display_name.split(',').slice(0, 3).join(',').trim();
        setSearchQuery(displayName);
        setShowSuggestions(false);
    };

    return (
        <View style={styles.mapContainer}>
            <View style={[styles.header, { marginTop: insets.top, backgroundColor: '#000' }]}>
                <Pressable onPress={onClose} style={styles.headerButton}>
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Pick Location</Text>
                <Pressable onPress={handleMapSelect} style={styles.headerButton}>
                    <Ionicons name="checkmark" size={24} color="#E89F3C" />
                </Pressable>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for a location..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {isSearching || isSuggestionsLoading ? (
                        <ActivityIndicator size="small" color="#E89F3C" style={styles.searchIcon} />
                    ) : searchQuery ? (
                        <Pressable onPress={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
                        </Pressable>
                    ) : null}
                </View>

                {showSuggestions && !isSearching && (
                    <View style={styles.suggestionsList}>
                        {suggestions.map((item, index) => {
                            const mainAddress = item.display_name.split(',')[0];
                            const subAddress = item.display_name.split(',').slice(1, 3).join(',').trim();

                            return (
                                <Pressable
                                    key={item.place_id || index}
                                    style={({ pressed }) => [
                                        styles.suggestionItem,
                                        { backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'transparent' },
                                        index < suggestions.length - 1 && styles.suggestionBorder
                                    ]}
                                    onPress={() => handleSelectSuggestion(item)}
                                >
                                    <Ionicons name="location-outline" size={18} color="#E89F3C" style={{ marginRight: 12 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.suggestionText} numberOfLines={1}>
                                            {mainAddress}
                                        </Text>
                                        {subAddress ? (
                                            <Text style={styles.suggestionSubText} numberOfLines={1}>
                                                {subAddress}
                                            </Text>
                                        ) : null}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>
            <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                onPress={(e) => setMapMarker(e.nativeEvent.coordinate)}
            >
                {mapMarker && (
                    <Marker coordinate={mapMarker} draggable
                        onDragEnd={(e) => setMapMarker(e.nativeEvent.coordinate)}
                    />
                )}
            </MapView>
            <View style={styles.mapFooter}>
                <Text style={styles.mapInstruction}>Tap or drag to select location</Text>
                <Pressable style={styles.confirmLocationButton} onPress={handleMapSelect}>
                    <Text style={styles.confirmLocationText}>Confirm Location</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 0,
    },
    headerButton: {
        padding: 4,
    },
    map: {
        flex: 1,
    },
    mapFooter: {
        backgroundColor: '#0F172A',
        padding: 24,
        paddingBottom: 40,
        gap: 12,
        alignItems: 'center',
    },
    mapInstruction: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    confirmLocationButton: {
        backgroundColor: '#E89F3C',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    confirmLocationText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    searchContainer: {
        position: 'absolute',
        top: 100, // Adjusted based on header
        left: 20,
        right: 20,
        zIndex: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    searchIcon: {
        marginHorizontal: 4,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        paddingVertical: 8,
    },
    suggestionsList: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        marginTop: 8,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    suggestionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    suggestionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    suggestionSubText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 2,
    },
});
