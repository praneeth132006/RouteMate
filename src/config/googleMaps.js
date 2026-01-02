// Google Maps Configuration
// This file contains the Google Maps API key and configuration

const GOOGLE_MAPS_CONFIG = {
    apiKey: 'AIzaSyANRzgIniwwjDbW31gDIJ38iGpKdLng0yk',
    libraries: ['places', 'geometry'],
    region: 'IN',
    language: 'en',
};

// Map default settings with dark mode styling
export const MAP_DEFAULTS = {
    center: { lat: 20.5937, lng: 78.9629 }, // Center of India
    zoom: 5,
    styles: [
        { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
        {
            featureType: 'administrative',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#3d3d3d' }],
        },
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#3d3d3d' }],
        },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0e3d5e' }],
        },
    ],
};

export default GOOGLE_MAPS_CONFIG;
