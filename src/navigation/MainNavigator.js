import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ExpenseScreen from '../screens/ExpenseScreen';
import PackingScreen from '../screens/PackingScreen';
import MapScreen from '../screens/MapScreen';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ route, focused }) => {
  const icons = {
    Home: '🏠',
    Budget: '💰',
    Expenses: '💳',
    Packing: '🎒',
    Map: '🗺️',
  };
  
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={styles.icon}>{icons[route.name]}</Text>
    </View>
  );
};

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#90EE90',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarIcon: ({ focused }) => <TabBarIcon route={route} focused={focused} />,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Budget" component={BudgetScreen} />
        <Tab.Screen name="Expenses" component={ExpenseScreen} />
        <Tab.Screen name="Packing" component={PackingScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D0D0D',
    borderTopColor: '#1F1F3D',
    borderTopWidth: 1,
    height: 65,
    paddingBottom: 5,
    paddingTop: 5,
  },
  iconContainer: {
    padding: 5,
    borderRadius: 8,
  },
  iconFocused: {
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
  },
  icon: {
    fontSize: 20,
  },
});
