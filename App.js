import React from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TravelProvider } from './src/context/TravelContext';
import MainNavigator from './src/navigation/MainNavigator';
import AuthScreen from './src/screens/AuthScreen';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>⚠️</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>{this.state.error?.message || 'Unknown error'}</Text>
          <Text style={errorStyles.hint}>Please restart the app</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' },
  emoji: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#EF4444', marginBottom: 12 },
  message: { fontSize: 14, color: '#D1D5DB', textAlign: 'center', marginBottom: 8 },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 16 },
});

function AppContent() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <Text style={styles.loadingEmoji}>📍</Text>
        <Text style={[styles.loadingText, { color: colors.text }]}>RouteMate</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        <Text style={[styles.loadingHint, { color: colors.textMuted }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />
      {isAuthenticated ? <MainNavigator /> : <AuthScreen />}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthProvider>
            <ThemeProvider>
              <TravelProvider>
                <AppContent />
              </TravelProvider>
            </ThemeProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  loadingHint: {
    fontSize: 14,
    marginTop: 12,
  },
});
