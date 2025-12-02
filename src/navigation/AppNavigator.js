import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import WelcomeScreen from '../screens/WelcomeScreen';
import TripSetupScreen from '../screens/TripSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ExpenseScreen from '../screens/ExpenseScreen';
import PackingScreen from '../screens/PackingScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

function TripTabs({ onBackToHome }) {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.primaryBorder,
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarIcon: ({ focused }) => {
            let emoji = '🏠';
            if (route.name === 'Itinerary') emoji = '🗺️';
            if (route.name === 'Expenses') emoji = '💳';
            if (route.name === 'Budget') emoji = '💰';
            if (route.name === 'Packing') emoji = '🎒';
            return (
              <View style={[
                { padding: 8, borderRadius: 12 },
                focused && { backgroundColor: colors.primaryMuted }
              ]}>
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Dashboard">
          {() => <HomeScreen onBackToHome={onBackToHome} />}
        </Tab.Screen>
        <Tab.Screen name="Itinerary" component={MapScreen} />
        <Tab.Screen name="Expenses" component={ExpenseScreen} />
        <Tab.Screen name="Budget" component={BudgetScreen} />
        <Tab.Screen name="Packing" component={PackingScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  const [screen, setScreen] = useState('welcome');
  const { setTripInfo, setBudget, tripInfo } = useTravelContext();
  const { colors } = useTheme();

  // Check if there's an active trip based on tripInfo
  const hasActiveTrip = !!(tripInfo.destination || tripInfo.startDate || tripInfo.name);

  const handlePlanTrip = () => {
    console.log('Plan trip pressed');
    setScreen('setup');
  };

  const handleJoinTrip = (code) => {
    console.log('Joining trip with code:', code);
    setScreen('trip');
  };

  const handleSetupComplete = (tripData) => {
    console.log('Trip setup complete:', tripData);
    setTripInfo({
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      name: tripData.name,
      participants: tripData.participants || [],
      tripCode: tripData.tripCode,
      tripType: tripData.tripType, // Add this line
    });
    setBudget(prev => ({ ...prev, total: parseFloat(tripData.budget) || 0 }));
    setScreen('trip');
  };

  const handleBackToWelcome = () => {
    console.log('Going back to welcome');
    setScreen('welcome');
  };

  const handleMyTrip = () => {
    console.log('My trip pressed');
    setScreen('trip');
  };

  const handleProfile = () => {
    console.log('Profile pressed - navigating to profile');
    setScreen('profile');
  };

  console.log('Current screen:', screen);

  // Setup screen
  if (screen === 'setup') {
    return (
      <TripSetupScreen 
        onComplete={handleSetupComplete}
        onBack={handleBackToWelcome}
      />
    );
  }

  // Profile screen
  if (screen === 'profile') {
    return (
      <ProfileScreen onBack={handleBackToWelcome} />
    );
  }

  // Trip tabs
  if (screen === 'trip') {
    return <TripTabs onBackToHome={handleBackToWelcome} />;
  }

  // Welcome screen (default)
  return (
    <WelcomeScreen 
      onPlanTrip={handlePlanTrip}
      onJoinTrip={handleJoinTrip}
      onMyTrip={handleMyTrip}
      onProfile={handleProfile}
      hasActiveTrip={hasActiveTrip}
    />
  );
}

const createTabStyles = (colors) => StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg,
    borderTopColor: colors.primaryBorder,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  iconWrap: {
    padding: 8,
    borderRadius: 12,
  },
  iconActive: {
    backgroundColor: colors.primaryMuted,
  },
  icon: {
    fontSize: 22,
  },
});
