import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

interface JourneyMapProps {
    route: { latitude: number; longitude: number; timestamp: string }[];
    isDarkMode: boolean;
}

export default function JourneyMap({ route, isDarkMode }: JourneyMapProps) {
    if (!route || route.length === 0) return null;

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: route[0].latitude,
                    longitude: route[0].longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                customMapStyle={isDarkMode ? darkMapStyle : []}
            >
                <Polyline
                    coordinates={route}
                    strokeColor="#E89F3C"
                    strokeWidth={4}
                />
                <Marker coordinate={route[0]} title="Start" />
                <Marker coordinate={route[route.length - 1]} title="End" pinColor="#EF4444" />
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    map: {
        flex: 1,
    }
});

const darkMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];
