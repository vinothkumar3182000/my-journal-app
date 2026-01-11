import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

// Stub types since we don't import them
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
    handleMapSelect
}: MapContentProps) {
    return (
        <View style={styles.mapContainer}>
            <View style={[styles.header, { marginTop: insets.top, backgroundColor: '#000' }]}>
                <Pressable onPress={onClose} style={styles.headerButton}>
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Pick Location</Text>
                <View style={{ width: 32 }} />
            </View>

            <View style={styles.webPlaceholderSelector}>
                <Ionicons name="map" size={64} color="rgba(255,255,255,0.2)" />
                <Text style={styles.webText}>Map selection is available on mobile app</Text>
                <Pressable style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>Close Map</Text>
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
    webPlaceholderSelector: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    webText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
    },
    closeButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    }
});
