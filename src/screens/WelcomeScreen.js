import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Dimensions, 
  Animated, TextInput, Modal, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#000000',
  card: '#0A0A0A',
  cardLight: '#111111',
  green: '#00FF7F',
  greenDark: '#00CC66',
  greenMuted: 'rgba(0, 255, 127, 0.1)',
  greenBorder: 'rgba(0, 255, 127, 0.3)',
  text: '#FFFFFF',
  textMuted: '#666666',
};

export default function WelcomeScreen({ onPlanTrip, onJoinTrip }) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [tripCode, setTripCode] = useState('');
  
  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim1 = useState(new Animated.Value(0.8))[0];
  const scaleAnim2 = useState(new Animated.Value(0.8))[0];
  const floatAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim1, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim2, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const handleJoinTrip = () => {
    if (tripCode.trim()) {
      setShowJoinModal(false);
      onJoinTrip(tripCode);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Elements */}
      <View style={styles.bgElements}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      {/* Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={styles.logo}>✈️</Text>
          <Text style={styles.appName}>TravelMate</Text>
          <Text style={styles.tagline}>Your journey starts here</Text>
        </Animated.View>

        {/* 3D Globe/World Illustration */}
        <Animated.View 
          style={[
            styles.illustrationContainer,
            { transform: [{ translateY: floatTranslate }] }
          ]}
        >
          <View style={styles.globe}>
            <View style={styles.globeInner}>
              <Text style={styles.globeEmoji}>🌍</Text>
            </View>
            <View style={styles.globeRing} />
            <View style={styles.globeRing2} />
          </View>
          
          {/* Floating Elements */}
          <Animated.View style={[styles.floatingIcon, styles.floatingIcon1, { opacity: fadeAnim }]}>
            <Text style={styles.floatingEmoji}>✈️</Text>
          </Animated.View>
          <Animated.View style={[styles.floatingIcon, styles.floatingIcon2, { opacity: fadeAnim }]}>
            <Text style={styles.floatingEmoji}>🏝️</Text>
          </Animated.View>
          <Animated.View style={[styles.floatingIcon, styles.floatingIcon3, { opacity: fadeAnim }]}>
            <Text style={styles.floatingEmoji}>🗺️</Text>
          </Animated.View>
          <Animated.View style={[styles.floatingIcon, styles.floatingIcon4, { opacity: fadeAnim }]}>
            <Text style={styles.floatingEmoji}>🎒</Text>
          </Animated.View>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Plan a Trip Card */}
          <Animated.View style={{ transform: [{ scale: scaleAnim1 }] }}>
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={onPlanTrip}
              activeOpacity={0.9}
            >
              <View style={styles.optionGlow} />
              <View style={styles.optionIconContainer}>
                <View style={styles.optionIconBg}>
                  <Text style={styles.optionIcon}>🚀</Text>
                </View>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Plan a Trip</Text>
                <Text style={styles.optionDescription}>
                  Create your perfect journey with budget planning, packing lists & itinerary
                </Text>
              </View>
              <View style={styles.optionArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Join a Trip Card */}
          <Animated.View style={{ transform: [{ scale: scaleAnim2 }] }}>
            <TouchableOpacity 
              style={[styles.optionCard, styles.optionCardSecondary]}
              onPress={() => setShowJoinModal(true)}
              activeOpacity={0.9}
            >
              <View style={styles.optionIconContainer}>
                <View style={[styles.optionIconBg, styles.optionIconBgSecondary]}>
                  <Text style={styles.optionIcon}>👥</Text>
                </View>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Join a Trip</Text>
                <Text style={styles.optionDescription}>
                  Enter a trip code to join your friends' adventure
                </Text>
              </View>
              <View style={styles.optionArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Features Preview */}
        <Animated.View style={[styles.featuresContainer, { opacity: fadeAnim }]}>
          <Text style={styles.featuresTitle}>Everything you need</Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: '💰', label: 'Budget' },
              { icon: '💳', label: 'Expenses' },
              { icon: '🎒', label: 'Packing' },
              { icon: '🗺️', label: 'Itinerary' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIconBg}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Spacer View */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Join Trip Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showJoinModal}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconBg}>
                <Text style={styles.modalIcon}>🔗</Text>
              </View>
            </View>
            
            <Text style={styles.modalTitle}>Join a Trip</Text>
            <Text style={styles.modalDescription}>
              Enter the trip code shared by your travel buddy
            </Text>
            
            <TextInput
              style={styles.codeInput}
              placeholder="Enter trip code"
              placeholderTextColor={COLORS.textMuted}
              value={tripCode}
              onChangeText={setTripCode}
              autoCapitalize="characters"
              maxLength={8}
            />
            
            <TouchableOpacity 
              style={[styles.joinButton, !tripCode.trim() && styles.joinButtonDisabled]}
              onPress={handleJoinTrip}
              disabled={!tripCode.trim()}
            >
              <Text style={styles.joinButtonText}>Join Trip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowJoinModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Add padding for footer
  },
  bgElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.green,
    opacity: 0.03,
  },
  bgCircle1: {
    width: 400,
    height: 400,
    top: -100,
    right: -150,
  },
  bgCircle2: {
    width: 300,
    height: 300,
    bottom: 100,
    left: -150,
  },
  bgCircle3: {
    width: 200,
    height: 200,
    bottom: -50,
    right: -50,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginVertical: 20,
  },
  globe: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.greenBorder,
  },
  globeEmoji: {
    fontSize: 64,
  },
  globeRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    opacity: 0.5,
  },
  globeRing2: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    opacity: 0.3,
  },
  floatingIcon: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  floatingIcon1: { top: 10, left: width * 0.15 },
  floatingIcon2: { top: 30, right: width * 0.15 },
  floatingIcon3: { bottom: 20, left: width * 0.2 },
  floatingIcon4: { bottom: 10, right: width * 0.2 },
  floatingEmoji: {
    fontSize: 24,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.green,
    overflow: 'hidden',
  },
  optionCardSecondary: {
    borderColor: COLORS.greenBorder,
  },
  optionGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: COLORS.green,
    opacity: 0.1,
    borderRadius: 75,
  },
  optionIconContainer: {
    marginRight: 16,
  },
  optionIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconBgSecondary: {
    backgroundColor: COLORS.greenMuted,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  optionIcon: {
    fontSize: 28,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  optionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 20,
    color: COLORS.green,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
    marginBottom: 24,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.greenBorder,
  },
  modalIcon: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  codeInput: {
    width: '100%',
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    padding: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: COLORS.greenBorder,
    marginBottom: 20,
  },
  joinButton: {
    width: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.bg,
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
