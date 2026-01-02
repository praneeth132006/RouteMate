import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import GOOGLE_MAPS_CONFIG, { MAP_DEFAULTS } from '../config/googleMaps';

/**
 * TripMap Component
 * Visualizes the trip Start, Visit, and End points on a read-only map.
 */
const TripMap = ({ start, visit, end, style }) => {
    const { colors } = useTheme();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const startMarker = useRef(null);
    const visitMarker = useRef(null);
    const endMarker = useRef(null);
    const bounds = useRef(null);
    const directionsService = useRef(null);
    const directionsRenderer = useRef(null);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const initMap = () => {
            if (window.google && window.google.maps && mapRef.current && !mapInstance.current) {
                mapInstance.current = new window.google.maps.Map(mapRef.current, {
                    ...MAP_DEFAULTS,
                    disableDefaultUI: true,
                    zoomControl: true,
                    gestureHandling: 'cooperative',
                    keyboardShortcuts: false,
                    clickableIcons: false,
                });

                bounds.current = new window.google.maps.LatLngBounds();

                // Initialize Directions Service
                directionsService.current = new window.google.maps.DirectionsService();
                directionsRenderer.current = new window.google.maps.DirectionsRenderer({
                    map: mapInstance.current,
                    suppressMarkers: true, // Keep our custom A/B/C markers
                    preserveViewport: false, // Let the route dictate viewport if valid
                    polylineOptions: {
                        strokeColor: '#FFD2AD', // Match theme primary color
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                    }
                });

                console.log('TripMap initialized with Directions');
            }
        };

        setTimeout(initMap, 500);

    }, []);

    // Update markers and route when points change
    useEffect(() => {
        if (!mapInstance.current || !window.google) return;

        // Clear existing bounds
        bounds.current = new window.google.maps.LatLngBounds();
        let hasPoints = false;
        const points = [];

        // Helper to handle marker logic
        const updateMarker = (point, markerRef, label, title) => {
            if (point && point.latitude && point.longitude) {
                const position = { lat: point.latitude, lng: point.longitude };
                points.push({ location: position });

                if (!markerRef.current) {
                    markerRef.current = new window.google.maps.Marker({
                        position,
                        map: mapInstance.current,
                        label,
                        title,
                    });
                } else {
                    markerRef.current.setPosition(position);
                    markerRef.current.setMap(mapInstance.current);
                }
                bounds.current.extend(position);
                hasPoints = true;
                return position;
            } else if (markerRef.current) {
                markerRef.current.setMap(null);
                return null;
            }
        };

        const startPos = updateMarker(start, startMarker, 'A', 'Start Location');
        const visitPos = updateMarker(visit, visitMarker, 'B', 'Visit Location');
        const endPos = updateMarker(end, endMarker, 'C', 'End Location');

        // Calculate Route if we have at least 2 points
        if (directionsService.current && directionsRenderer.current) {
            // Determine origin and destination based on what is available
            const validPoints = [startPos, visitPos, endPos].filter(p => p !== null);

            if (validPoints.length >= 2) {
                const origin = validPoints[0];
                const destination = validPoints[validPoints.length - 1];
                const waypoints = validPoints.length > 2 ? [{ location: validPoints[1], stopover: true }] : [];

                directionsService.current.route({
                    origin,
                    destination,
                    waypoints,
                    optimizeWaypoints: false,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                }, (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        directionsRenderer.current.setDirections(result);
                    } else {
                        console.warn('Directions request failed due to ' + status);
                        // Fallback to bounds if route fails
                        if (hasPoints) mapInstance.current.fitBounds(bounds.current);
                    }
                });
            } else {
                directionsRenderer.current.setDirections({ routes: [] }); // Clear route
                if (hasPoints) {
                    mapInstance.current.fitBounds(bounds.current);
                    if (bounds.current.getNorthEast().equals(bounds.current.getSouthWest())) {
                        mapInstance.current.setZoom(10);
                    }
                }
            }
        } else if (hasPoints) {
            // Fallback if directions service not ready
            mapInstance.current.fitBounds(bounds.current);
            if (bounds.current.getNorthEast().equals(bounds.current.getSouthWest())) {
                mapInstance.current.setZoom(10);
            }
        }
    }, [start, visit, end]);

    const styles = createStyles(colors);

    if (Platform.OS !== 'web') return null;

    return (
        <View style={[styles.container, style]}>
            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '16px'
                }}
            />
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        height: 250,
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.primaryBorder,
        backgroundColor: colors.cardLight,
    },
});

export default TripMap;
