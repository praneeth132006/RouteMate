import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { TravelProvider } from './src/context/TravelContext';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TravelProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </TravelProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
