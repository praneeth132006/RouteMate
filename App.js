import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import PackingScreen from './src/screens/PackingScreen';
import MapScreen from './src/screens/MapScreen';
import { TravelProvider } from './src/context/TravelContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <TravelProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: '#00FF7F',
              tabBarInactiveTintColor: '#666666',
              tabBarIcon: ({ focused }) => {
                let emoji = '🏠';
                if (route.name === 'Budget') emoji = '💰';
                if (route.name === 'Expenses') emoji = '💳';
                if (route.name === 'Packing') emoji = '🎒';
                if (route.name === 'Map') emoji = '🗺️';
                return (
                  <View style={[styles.iconWrap, focused && styles.iconActive]}>
                    <Text style={styles.icon}>{emoji}</Text>
                  </View>
                );
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Budget" component={BudgetScreen} />
            <Tab.Screen name="Expenses" component={ExpenseScreen} />
            <Tab.Screen name="Packing" component={PackingScreen} />
            <Tab.Screen name="Map" component={MapScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </TravelProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopColor: '#1a1a1a',
    borderTopWidth: 1,
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
  },
  iconWrap: {
    padding: 6,
    borderRadius: 10,
  },
  iconActive: {
    backgroundColor: 'rgba(0, 255, 127, 0.15)',
  },
  icon: {
    fontSize: 20,
  },
});
