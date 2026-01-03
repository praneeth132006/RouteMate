import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import GOOGLE_MAPS_CONFIG, { MAP_DEFAULTS } from '../config/googleMaps';

/**
 * TripMap Component
 * Visualizes the trip Start, Visit, and End points on a read-only map.
 */
const TripMap = ({ start, visit, end, stops, mode, style }) => {
    const { colors } = useTheme();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markers = useRef([]);
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
                    suppressMarkers: true,
                    preserveViewport: false,
                    polylineOptions: {
                        strokeColor: '#FFD2AD',
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                    }
                });
            }
        };

        setTimeout(initMap, 500);

    }, []);

    // Update markers and route when points change
    useEffect(() => {
        if (!mapInstance.current || !window.google) return;

        // Clear existing markers
        markers.current.forEach(m => m.setMap(null));
        markers.current = [];

        bounds.current = new window.google.maps.LatLngBounds();
        let validLocations = [];

        // Determine points to show based on mode
        if (stops && stops.length > 0) {
            stops.forEach((stop, index) => {
                if (stop && stop.latitude && stop.longitude) {
                    const position = { lat: stop.latitude, lng: stop.longitude };
                    validLocations.push(position);

                    const marker = new window.google.maps.Marker({
                        position,
                        map: mapInstance.current,
                        label: (index + 1).toString(),
                        title: stop.name || `Stop ${index + 1}`,
                    });
                    markers.current.push(marker);
                    bounds.current.extend(position);
                }
            });
        } else {
            // Fallback to start, visit, end for single-base or legacy
            const pointsData = [
                { p: start, label: 'A', title: 'Start' },
                { p: visit, label: 'B', title: 'Visit' },
                { p: end, label: 'C', title: 'End' }
            ];

            pointsData.forEach(item => {
                if (item.p && item.p.latitude && item.p.longitude) {
                    const position = { lat: item.p.latitude, lng: item.p.longitude };
                    validLocations.push(position);
                    const marker = new window.google.maps.Marker({
                        position,
                        map: mapInstance.current,
                        label: item.label,
                        title: item.p.name || item.title,
                    });
                    markers.current.push(marker);
                    bounds.current.extend(position);
                }
            });
        }

        // Calculate Route
        if (directionsService.current && directionsRenderer.current) {
            if (validLocations.length >= 2) {
                const origin = validLocations[0];
                const destination = validLocations[validLocations.length - 1];
                const waypoints = validLocations.length > 2
                    ? validLocations.slice(1, -1).map(loc => ({ location: loc, stopover: true }))
                    : [];

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
                        mapInstance.current.fitBounds(bounds.current);
                    }
                });
            } else {
                directionsRenderer.current.setDirections({ routes: [] });
                if (validLocations.length > 0) {
                    mapInstance.current.fitBounds(bounds.current);
                    if (bounds.current.getNorthEast().equals(bounds.current.getSouthWest())) {
                        mapInstance.current.setZoom(10);
                    }
                }
            }
        }
    }, [start, visit, end, stops]);

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
