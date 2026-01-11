import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface JourneyMapProps {
    route: { latitude: number; longitude: number; timestamp: string }[];
    isDarkMode: boolean;
}

export default function JourneyMap({ isDarkMode }: JourneyMapProps) {
    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F1F5F9' }]}>
            <Ionicons name="map-outline" size={32} color={isDarkMode ? '#333' : '#CCC'} />
            <Text style={[styles.text, { color: isDarkMode ? '#8BA9A5' : '#64748B' }]}>
                Map preview not available on Web
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 200,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    text: {
        fontSize: 12,
        marginTop: 8,
    }
});
