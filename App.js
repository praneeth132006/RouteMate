import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { TravelProvider } from './src/context/TravelContext';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  const [tripInfo, setTripInfo] = React.useState({});
  const [budget, setBudget] = React.useState({});

  const handleTripComplete = (tripData) => {
    // Make sure tripType is being set correctly
    setTripInfo({
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      name: tripData.name || `${tripData.destination} Trip`,
      participants: tripData.participants || [],
      tripCode: tripData.tripCode,
      tripType: tripData.tripType, // IMPORTANT: Make sure this is passed
      isCompleted: false,
    });
    
    setBudget({ total: parseFloat(tripData.budget) || 0, categories: {} });
    setCurrentScreen('main');
  };

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
