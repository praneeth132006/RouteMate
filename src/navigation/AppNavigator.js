import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import WelcomeScreen from '../screens/WelcomeScreen';
import TripSetupScreen from '../screens/TripSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ExpenseScreen from '../screens/ExpenseScreen';
import PackingScreen from '../screens/PackingScreen';
import MapScreen from '../screens/MapScreen';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

function TripTabs({ onBackToHome }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createTabStyles(colors), [colors]);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarIcon: ({ focused }) => {
            let emoji = '🏠';
            if (route.name === 'Budget') emoji = '💰';
            if (route.name === 'Expenses') emoji = '💳';
            if (route.name === 'Packing') emoji = '🎒';
            if (route.name === 'Itinerary') emoji = '🗺️';
            return (
              <View style={[styles.iconWrap, focused && styles.iconActive]}>
                <Text style={styles.icon}>{emoji}</Text>
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Dashboard">
          {() => <HomeScreen onBackToHome={onBackToHome} />}
        </Tab.Screen>
        <Tab.Screen name="Budget" component={BudgetScreen} />
        <Tab.Screen name="Expenses" component={ExpenseScreen} />
        <Tab.Screen name="Packing" component={PackingScreen} />
        <Tab.Screen name="Itinerary" component={MapScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  const [screen, setScreen] = useState('welcome');
  const { setTripInfo, setBudget } = useTravelContext();
  const { colors } = useTheme();

  const handlePlanTrip = () => setScreen('setup');

  const handleJoinTrip = (code) => {
    console.log('Joining trip with code:', code);
    setScreen('trip');
  };

  const handleSetupComplete = (tripData) => {
    setTripInfo({
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      name: tripData.name,
      participants: tripData.participants,
    });
    setBudget(prev => ({ ...prev, total: parseFloat(tripData.budget) || 0 }));
    setScreen('trip');
  };

  const handleBackToWelcome = () => {
    setScreen('welcome');
  };

  if (screen === 'welcome') {
    return (
      <WelcomeScreen 
        onPlanTrip={handlePlanTrip}
        onJoinTrip={handleJoinTrip}
      />
    );
  }

  if (screen === 'setup') {
    return (
      <TripSetupScreen 
        onComplete={handleSetupComplete}
        onBack={handleBackToWelcome}
      />
    );
  }

  return <TripTabs onBackToHome={handleBackToWelcome} />;
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
