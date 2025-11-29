import React, { useState } from 'react';
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
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FloatingFooter from '../components/FloatingFooter';
import { useTravelContext } from '../context/TravelContext';

const Tab = createBottomTabNavigator();

const COLORS = {
  bg: '#000000',
  green: '#00FF7F',
  greenMuted: 'rgba(0, 255, 127, 0.15)',
  textMuted: '#666666',
};

function TripTabs({ onBackToHome }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.green,
          tabBarInactiveTintColor: COLORS.textMuted,
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
  const [activeTab, setActiveTab] = useState('home');
  const { setTripInfo, setBudget } = useTravelContext();

  const handlePlanTrip = () => setScreen('setup');

  const handleJoinTrip = (code) => {
    console.log('Joining trip with code:', code);
    setScreen('trip');
    setActiveTab('trip');
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
    setActiveTab('trip');
  };

  const handleBackToWelcome = () => {
    setScreen('welcome');
    setActiveTab('home');
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') setScreen('welcome');
    else if (tab === 'trip') setScreen('trip');
    else if (tab === 'history') setScreen('history');
    else if (tab === 'profile') setScreen('profile');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onPlanTrip={handlePlanTrip}
            onJoinTrip={handleJoinTrip}
          />
        );
      case 'setup':
        return (
          <TripSetupScreen 
            onComplete={handleSetupComplete}
            onBack={handleBackToWelcome}
          />
        );
      case 'trip':
        return <TripTabs onBackToHome={() => handleTabPress('home')} />;
      case 'history':
        return <HistoryScreen onBack={() => handleTabPress('home')} />;
      case 'profile':
        return <ProfileScreen onBack={() => handleTabPress('home')} />;
      default:
        return null;
    }
  };

  // Only show floating footer on welcome, history, and profile screens
  const showFooter = screen === 'welcome' || screen === 'history' || screen === 'profile';

  return (
    <View style={styles.container}>
      {renderScreen()}
      {showFooter && (
        <FloatingFooter activeTab={activeTab} onTabPress={handleTabPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  tabBar: {
    backgroundColor: '#000000',
    borderTopColor: '#1a1a1a',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  iconWrap: { padding: 8, borderRadius: 12 },
  iconActive: { backgroundColor: COLORS.greenMuted },
  icon: { fontSize: 22 },
});
