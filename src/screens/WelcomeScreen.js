import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Dimensions, 
  Animated, TextInput, Modal, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ onPlanTrip, onJoinTrip, onMyTrip, onProfile, hasActiveTrip }) {
  const { colors } = useTheme();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [tripCode, setTripCode] = useState('');
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim1 = useState(new Animated.Value(0.8))[0];
  const scaleAnim2 = useState(new Animated.Value(0.8))[0];
  const scaleAnim3 = useState(new Animated.Value(0.8))[0];
  const floatAnim = useState(new Animated.Value(0))[0];

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim1, { toValue: 1, tension: 50, friction: 7, delay: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim2, { toValue: 1, tension: 50, friction: 7, delay: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim3, { toValue: 1, tension: 50, friction: 7, delay: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatTranslate = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

  const handleJoinTrip = () => {
    if (tripCode.trim()) {
      setShowJoinModal(false);
      onJoinTrip(tripCode);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Profile */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>✈️</Text>
          <Text style={styles.logoText}>TravelMate</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={onProfile} activeOpacity={0.8}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Background Elements */}
      <View style={styles.bgElements}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.greeting}>Welcome back! 👋</Text>
          <Text style={styles.headline}>Where to next?</Text>
          <Text style={styles.subheadline}>Plan, organize, and enjoy your perfect trip</Text>
        </Animated.View>

        {/* Globe Illustration */}
        <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatTranslate }] }]}>
          <View style={styles.globe}>
            <View style={styles.globeInner}>
              <Text style={styles.globeEmoji}>🌍</Text>
            </View>
            <View style={styles.globeRing} />
            <View style={styles.globeRing2} />
          </View>
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

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          {/* My Trip - Only show if there's an active trip */}
          {hasActiveTrip && (
            <Animated.View style={{ transform: [{ scale: scaleAnim1 }] }}>
              <TouchableOpacity style={styles.myTripCard} onPress={onMyTrip} activeOpacity={0.9}>
                <View style={styles.myTripGlow} />
                <View style={styles.myTripIconContainer}>
                  <View style={styles.myTripIconBg}>
                    <Text style={styles.myTripIcon}>🧳</Text>
                  </View>
                </View>
                <View style={styles.myTripContent}>
                  <Text style={styles.myTripTitle}>Continue Trip</Text>
                  <Text style={styles.myTripDescription}>Resume planning your adventure</Text>
                </View>
                <View style={styles.myTripArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Plan a Trip */}
          <Animated.View style={{ transform: [{ scale: hasActiveTrip ? scaleAnim2 : scaleAnim1 }] }}>
            <TouchableOpacity style={styles.optionCard} onPress={onPlanTrip} activeOpacity={0.9}>
              <View style={styles.optionGlow} />
              <View style={styles.optionIconContainer}>
                <View style={styles.optionIconBg}>
                  <Text style={styles.optionIcon}>🚀</Text>
                </View>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Plan a Trip</Text>
                <Text style={styles.optionDescription}>Create your perfect journey with budget, packing & itinerary</Text>
              </View>
              <View style={styles.optionArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Join a Trip */}
          <Animated.View style={{ transform: [{ scale: hasActiveTrip ? scaleAnim3 : scaleAnim2 }] }}>
            <TouchableOpacity style={[styles.optionCard, styles.optionCardSecondary]} onPress={() => setShowJoinModal(true)} activeOpacity={0.9}>
              <View style={styles.optionIconContainer}>
                <View style={[styles.optionIconBg, styles.optionIconBgSecondary]}>
                  <Text style={styles.optionIcon}>👥</Text>
                </View>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Join a Trip</Text>
                <Text style={styles.optionDescription}>Enter a code to join your friends' adventure</Text>
              </View>
              <View style={styles.optionArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Features */}
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Join Trip Modal */}
      <Modal animationType="slide" transparent visible={showJoinModal} onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconBg}>
                <Text style={styles.modalIcon}>🔗</Text>
              </View>
            </View>
            <Text style={styles.modalTitle}>Join a Trip</Text>
            <Text style={styles.modalDescription}>Enter the trip code shared by your travel buddy</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter trip code"
              placeholderTextColor={colors.textMuted}
              value={tripCode}
              onChangeText={setTripCode}
              autoCapitalize="characters"
              maxLength={8}
            />
            <TouchableOpacity style={[styles.joinButton, !tripCode.trim() && styles.joinButtonDisabled]} onPress={handleJoinTrip} disabled={!tripCode.trim()}>
              <Text style={styles.joinButtonText}>Join Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowJoinModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  
  // Top Bar
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoEmoji: { fontSize: 28, marginRight: 8 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  profileButton: { padding: 4 },
  profileAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.card, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileEmoji: { fontSize: 22 },

  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  bgElements: { position: 'absolute', width: '100%', height: '100%' },
  bgCircle: { position: 'absolute', borderRadius: 999, backgroundColor: colors.primary, opacity: 0.03 },
  bgCircle1: { width: 400, height: 400, top: -100, right: -150 },
  bgCircle2: { width: 300, height: 300, bottom: 100, left: -150 },
  bgCircle3: { width: 200, height: 200, bottom: -50, right: -50 },
  
  // Hero Section
  heroSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  greeting: { fontSize: 16, color: colors.textMuted },
  headline: { fontSize: 34, fontWeight: 'bold', color: colors.text, marginTop: 8 },
  subheadline: { fontSize: 15, color: colors.textMuted, marginTop: 8 },

  // Illustration
  illustrationContainer: { alignItems: 'center', justifyContent: 'center', height: 180, marginVertical: 10 },
  globe: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  globeInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primaryBorder },
  globeEmoji: { fontSize: 54 },
  globeRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: colors.primaryBorder, opacity: 0.5 },
  globeRing2: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: colors.primaryBorder, opacity: 0.3 },
  floatingIcon: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  floatingIcon1: { top: 5, left: width * 0.15 },
  floatingIcon2: { top: 20, right: width * 0.15 },
  floatingIcon3: { bottom: 15, left: width * 0.2 },
  floatingIcon4: { bottom: 5, right: width * 0.2 },
  floatingEmoji: { fontSize: 20 },

  // Actions Container
  actionsContainer: { paddingHorizontal: 20, gap: 14 },

  // My Trip Card (Highlighted)
  myTripCard: { 
    backgroundColor: colors.primary, 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  myTripGlow: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, backgroundColor: '#FFFFFF', opacity: 0.15, borderRadius: 60 },
  myTripIconContainer: { marginRight: 14 },
  myTripIconBg: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  myTripIcon: { fontSize: 26 },
  myTripContent: { flex: 1 },
  myTripTitle: { fontSize: 18, fontWeight: 'bold', color: colors.bg },
  myTripDescription: { fontSize: 13, color: 'rgba(0,0,0,0.6)', marginTop: 4 },
  myTripArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },

  // Option Cards
  optionCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder, overflow: 'hidden' },
  optionCardSecondary: { borderColor: colors.primaryBorder },
  optionGlow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, backgroundColor: colors.primary, opacity: 0.08, borderRadius: 75 },
  optionIconContainer: { marginRight: 14 },
  optionIconBg: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  optionIconBgSecondary: { backgroundColor: colors.cardLight },
  optionIcon: { fontSize: 26 },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  optionDescription: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  optionArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  arrowText: { fontSize: 18, color: colors.primary, fontWeight: 'bold' },

  // Features
  featuresContainer: { marginTop: 30, paddingHorizontal: 20 },
  featuresTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  featuresGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  featureItem: { alignItems: 'center' },
  featureIconBg: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: 8 },
  featureIcon: { fontSize: 26 },
  featureLabel: { fontSize: 12, color: colors.textMuted },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, alignItems: 'center' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, marginBottom: 24 },
  modalIconContainer: { marginBottom: 20 },
  modalIconBg: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primaryBorder },
  modalIcon: { fontSize: 40 },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  modalDescription: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  codeInput: { width: '100%', backgroundColor: colors.cardLight, borderRadius: 16, padding: 20, fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center', letterSpacing: 8, borderWidth: 2, borderColor: colors.primaryBorder, marginBottom: 20 },
  joinButton: { width: '100%', backgroundColor: colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 },
  joinButtonDisabled: { opacity: 0.5 },
  joinButtonText: { fontSize: 18, fontWeight: 'bold', color: colors.bg },
  cancelButton: { padding: 16 },
  cancelButtonText: { fontSize: 16, color: colors.textMuted },
});
