import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import * as DB from '../services/databaseService';

const ThemeContext = createContext(null);

// Custom Dark Theme - Charcoal & Light Green
const darkColors = {
  bg: '#0A0A0A',                    // Pure dark black
  card: '#1A1A1A',                  // Dark gray card
  cardLight: '#2A2A2A',             // Lighter gray
  primary: '#90EE90',               // Light green (LightGreen)
  primaryMuted: 'rgba(144, 238, 144, 0.12)',
  primaryBorder: 'rgba(144, 238, 144, 0.25)',
  secondary: '#98FB98',             // Pale green accent
  text: '#FAFAFA',                  // Pure white
  textMuted: '#888888',             // Medium gray
  textLight: '#555555',             // Dark gray
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
};

// Sunrise Light Theme - Warm & Inviting
const lightColors = {
  bg: '#FFF8F0',                    // Warm cream white
  card: '#FFFFFF',                  // Pure white cards
  cardLight: '#FFF1E6',             // Soft peach tint
  primary: '#FF6B35',               // Sunrise orange
  primaryMuted: 'rgba(255, 107, 53, 0.12)',
  primaryBorder: 'rgba(255, 107, 53, 0.25)',
  secondary: '#004E89',             // Deep ocean blue
  text: '#1A1A2E',                  // Dark navy text
  textMuted: '#6B7280',             // Warm gray
  textLight: '#9CA3AF',             // Light warm gray
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// Warm Dark Theme - Cozy & Premium
const warmDarkColors = {
  bg: '#111111',                    // Background
  card: '#191919',                  // Card
  cardLight: '#222222',             // Muted
  primary: '#ffe0c2',               // Primary
  primaryMuted: 'rgba(255, 224, 194, 0.12)',
  primaryBorder: 'rgba(255, 224, 194, 0.25)',
  secondary: '#393028',             // Secondary
  text: '#eeeeee',                  // Foreground
  textMuted: '#b4b4b4',             // Muted Foreground
  textLight: '#888888',             // Lighter muted
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#e54d2e',                 // Destructive
  accent: '#2a2a2a',                // Accent
  accentForeground: '#eeeeee',      // Accent Foreground
  border: '#201e18',                // Border
  input: '#484848',                 // Input
  ring: '#ffe0c2',                  // Ring
  // Sidebar colors
  sidebarBg: '#18181b',
  sidebarForeground: '#f4f4f5',
  sidebarPrimary: '#1d4ed8',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#27272a',
  sidebarAccentForeground: '#f4f4f5',
  sidebarBorder: '#27272a',
  sidebarRing: '#d4d4d8',
};

// Theme definitions with metadata
export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark Green',
    description: 'Charcoal & Light Green',
    icon: '🌙',
    colors: darkColors,
  },
  light: {
    id: 'light',
    name: 'Sunrise Light',
    description: 'Warm & Inviting',
    icon: '☀️',
    colors: lightColors,
  },
  warmDark: {
    id: 'warmDark',
    name: 'Warm Dark',
    description: 'Cozy & Premium',
    icon: '🔥',
    colors: warmDarkColors,
  },
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, [user]); // Reload when user changes

  const loadTheme = async () => {
    try {
      // 1. Try to load from Firebase if logged in
      if (user) {
        const settings = await DB.getUserSettings();
        if (settings?.theme && THEMES[settings.theme]) {
          setCurrentTheme(settings.theme);
          await AsyncStorage.setItem('theme', settings.theme); // Sync local
          setIsLoaded(true);
          return;
        }
      }

      // 2. Fallback to local storage
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setTheme = async (themeName) => {
    try {
      if (THEMES[themeName]) {
        setCurrentTheme(themeName);
        await AsyncStorage.setItem('theme', themeName);

        // Save to Firebase if logged in
        if (user) {
          await DB.saveUserSettings({ theme: themeName });
        }
      }
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  // Legacy support for toggleTheme
  const toggleTheme = async () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  const theme = THEMES[currentTheme];
  const colors = theme.colors;
  const isDark = currentTheme !== 'light';

  const value = {
    currentTheme,
    theme,
    isDark,
    toggleTheme,
    setTheme,
    colors,
    isLoaded,
    availableThemes: Object.values(THEMES),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
