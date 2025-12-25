import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTravelContext } from '../context/TravelContext';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import ExpenseScreen from '../screens/ExpenseScreen';
import PackingScreen from '../screens/PackingScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TripSetupScreen from '../screens/TripSetupScreen';
import BudgetScreen from '../screens/BudgetScreen';

const Tab = createBottomTabNavigator();

// Tab Bar Icon Component
function TabIcon({ emoji, focused, color }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.6 }]}>{emoji}</Text>
    </View>
  );
}

// Main Tab Navigator
function TabNavigator({ onBackToHome }) {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.primaryBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🏠" focused={focused} color={color} />,
        }}
      >
        {(props) => <HomeScreen {...props} onBackToHome={onBackToHome} />}
      </Tab.Screen>
      <Tab.Screen
        name="Itinerary"
        component={MapScreen}
        options={{
          tabBarLabel: 'Itinerary',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🗺️" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseScreen}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="💳" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Budget',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="💰" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Packing"
        component={PackingScreen}
        options={{
          tabBarLabel: 'Packing',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🎒" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Main Navigator
export default function MainNavigator() {
  const [currentScreen, setCurrentScreen] = React.useState('Welcome');
  const { setTripInfo, setBudget, tripInfo, saveCurrentTripToList, joinTripByCode, switchToTrip } = useTravelContext();

  // Check if there's an active trip
  const hasActiveTrip = !!(tripInfo.destination || tripInfo.startDate || tripInfo.name);

  const handlePlanTrip = () => {
    console.log('Plan trip pressed - navigating to TripSetup');
    setCurrentScreen('TripSetup');
  };

  const handleJoinTrip = async (code) => {
    console.log('Join trip with code:', code);

    // Attempt to join trip
    const result = await joinTripByCode(code);

    if (result.success) {
      // Set as active trip info
      if (result.trip) {
        if (switchToTrip) {
          switchToTrip(result.trip);
        } else {
          setTripInfo(result.trip);
        }
      }
      // Navigate to dashboard
      setCurrentScreen('TripDashboard');
    } else {
      // Show error (would be better to pass back to WelcomeScreen, but Alert works for now)
      // Note: WelcomeScreen might have closed the modal already.
      // Ideally we pass a callback or return promise. 
      // But WelcomeScreen calls onJoinTrip and doesn't wait.
      // We'll rely on Alert from here.
      Alert.alert('Error', `Could not join trip: ${result.error}`);
    }
  };

  const handleMyTrip = (trip, index) => {
    console.log('Open trip:', trip?.destination);
    setCurrentScreen('TripDashboard');
  };

  const handleProfile = () => {
    setCurrentScreen('Profile');
  };

  const handleBackToHome = () => {
    setCurrentScreen('Welcome');
  };

  const handleTripSetupComplete = (tripData) => {
    console.log('Trip setup complete:', tripData);

    // Save trip data to context
    setTripInfo({
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      name: tripData.name || `${tripData.destination} Trip`,
      participants: tripData.participants || [],
      tripCode: tripData.tripCode,
      tripType: tripData.tripType,
    });

    // Set budget
    setBudget(prev => ({ ...prev, total: parseFloat(tripData.budget) || 0 }));

    // Save to allTrips list after a small delay to ensure tripInfo is updated
    setTimeout(() => {
      if (saveCurrentTripToList) {
        saveCurrentTripToList();
      }
    }, 100);

    // Navigate to dashboard
    setCurrentScreen('TripDashboard');
  };

  const handleTripSetupBack = () => {
    setCurrentScreen('Welcome');
  };

  console.log('MainNavigator - currentScreen:', currentScreen);

  // Render based on current screen
  if (currentScreen === 'TripSetup') {
    return (
      <TripSetupScreen
        onComplete={handleTripSetupComplete}
        onBack={handleTripSetupBack}
      />
    );
  }

  if (currentScreen === 'Profile') {
    return <ProfileScreen onBack={handleBackToHome} />;
  }

  if (currentScreen === 'TripDashboard') {
    return <TabNavigator onBackToHome={handleBackToHome} />;
  }

  // Default: Welcome screen
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

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 24,
  },
});
