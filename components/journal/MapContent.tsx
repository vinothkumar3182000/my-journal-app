import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    handleMapSelect
}: MapContentProps) {
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
            <View style={[styles.map, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A' }]}>
                <Ionicons name="map-outline" size={48} color="#333" />
                <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>Map selection not available on Web</Text>
            </View>
            <View style={styles.mapFooter}>
                <Text style={styles.mapInstruction}>Manual location entry is recommended on Web</Text>
                <Pressable style={styles.confirmLocationButton} onPress={handleMapSelect}>
                    <Text style={styles.confirmLocationText}>Go Back</Text>
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
});
