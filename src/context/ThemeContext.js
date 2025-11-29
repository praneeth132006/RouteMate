import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(null);

export const THEMES = {
  default: {
    id: 'default',
    name: 'Neon Green',
    preview: ['#000000', '#00FF7F'],
    colors: {
      bg: '#000000',
      card: '#0A0A0A',
      cardLight: '#111111',
      cardDark: '#050505',
      primary: '#00FF7F',
      primaryDark: '#00CC66',
      primaryMuted: 'rgba(0, 255, 127, 0.1)',
      primaryBorder: 'rgba(0, 255, 127, 0.3)',
      text: '#FFFFFF',
      textMuted: '#666666',
      textLight: '#888888',
      accent: '#00FF7F',
      danger: '#FF4444',
    }
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Dream',
    preview: ['#2C2C2C', '#B39CD0'],
    colors: {
      bg: '#2C2C2C',
      card: '#363636',
      cardLight: '#404040',
      cardDark: '#222222',
      primary: '#B39CD0',
      primaryDark: '#9A7FC0',
      primaryMuted: 'rgba(179, 156, 208, 0.15)',
      primaryBorder: 'rgba(179, 156, 208, 0.3)',
      text: '#E4E4E4',
      textMuted: '#A8A8A8',
      textLight: '#BEBEBE',
      accent: '#A8DADC',
      accent2: '#FFC1CC',
      danger: '#FF6B6B',
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    preview: ['#222831', '#DFD0B8'],
    colors: {
      bg: '#222831',
      card: '#393E46',
      cardLight: '#4A5059',
      cardDark: '#1A1F26',
      primary: '#DFD0B8',
      primaryDark: '#C9BAA2',
      primaryMuted: 'rgba(223, 208, 184, 0.15)',
      primaryBorder: 'rgba(223, 208, 184, 0.3)',
      text: '#FFFFFF',
      textMuted: '#948979',
      textLight: '#A9A090',
      accent: '#DFD0B8',
      danger: '#FF6B6B',
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    preview: ['#FAF3E1', '#FF6D1F'],
    colors: {
      bg: '#FAF3E1',
      card: '#FFFFFF',
      cardLight: '#F5E7C6',
      cardDark: '#EDE6D4',
      primary: '#FF6D1F',
      primaryDark: '#E55A10',
      primaryMuted: 'rgba(255, 109, 31, 0.12)',
      primaryBorder: 'rgba(255, 109, 31, 0.25)',
      text: '#222222',
      textMuted: '#666666',
      textLight: '#888888',
      accent: '#FF6D1F',
      danger: '#DC3545',
    }
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
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const changeTheme = async (themeId) => {
    if (THEMES[themeId]) {
      setCurrentTheme(themeId);
      try {
        await AsyncStorage.setItem('appTheme', themeId);
      } catch (error) {
        console.log('Error saving theme:', error);
      }
    }
  };

  const theme = THEMES[currentTheme];
  const colors = theme.colors;

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      changeTheme, 
      theme, 
      colors, 
      themes: THEMES,
      isLoaded 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
