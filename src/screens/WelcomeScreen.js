import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Dimensions, 
  Animated, TextInput, Modal, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTravelContext } from '../context/TravelContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onPlanTrip, onJoinTrip, onMyTrip, onProfile, hasActiveTrip }) {
  const { colors } = useTheme();
  const { tripInfo, getTotalExpenses, packingItems, itinerary } = useTravelContext();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [tripCode, setTripCode] = useState('');
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim1 = useState(new Animated.Value(0.8))[0];
  const scaleAnim2 = useState(new Animated.Value(0.8))[0];
  const scaleAnim3 = useState(new Animated.Value(0.8))[0];
  const floatAnim = useState(new Animated.Value(0))[0];
  const rotateAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const glowAnim = useState(new Animated.Value(0.3))[0];
  const starAnim1 = useState(new Animated.Value(0))[0];
  const starAnim2 = useState(new Animated.Value(0))[0];
  const starAnim3 = useState(new Animated.Value(0))[0];

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Calculate trip stats
  const packedCount = packingItems.filter(i => i.packed).length;
  const totalItems = packingItems.length;
  const totalExpenses = getTotalExpenses();
  const activitiesCount = itinerary.length;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim1, { toValue: 1, tension: 50, friction: 7, delay: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim2, { toValue: 1, tension: 50, friction: 7, delay: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim3, { toValue: 1, tension: 50, friction: 7, delay: 700, useNativeDriver: true }),
    ]).start();

    // Continuous float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Rotate animation for orbiting icons
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 15000, useNativeDriver: true })
    ).start();

    // Pulse animation for rings
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Twinkling stars
    const animateStar = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    };
    animateStar(starAnim1, 0);
    animateStar(starAnim2, 500);
    animateStar(starAnim3, 1000);
  }, []);

  const floatTranslate = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -25] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const reverseRotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  const handleJoinTrip = () => {
    if (tripCode.trim()) {
      setShowJoinModal(false);
      setTripCode('');
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
        <Animated.View style={[styles.bgCircle, styles.bgCircle1, { opacity: glowAnim }]} />
        <Animated.View style={[styles.bgCircle, styles.bgCircle2, { opacity: glowAnim }]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* 3D Globe Animation */}
        <Animated.View style={[styles.globeSection, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.globeContainer, { transform: [{ translateY: floatTranslate }] }]}>
            {/* Twinkling stars */}
            <Animated.View style={[styles.star, styles.star1, { opacity: starAnim1 }]}>
              <Text style={styles.starEmoji}>✨</Text>
            </Animated.View>
            <Animated.View style={[styles.star, styles.star2, { opacity: starAnim2 }]}>
              <Text style={styles.starEmoji}>⭐</Text>
            </Animated.View>
            <Animated.View style={[styles.star, styles.star3, { opacity: starAnim3 }]}>
              <Text style={styles.starEmoji}>✨</Text>
            </Animated.View>

            {/* Outer rings with pulse */}
            <Animated.View style={[styles.orbitRing, styles.orbitRing1, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.orbitRing, styles.orbitRing2, { transform: [{ rotate: reverseRotate }] }]} />
            <Animated.View style={[styles.orbitRing, styles.orbitRing3]} />
            
            {/* Glow effect behind globe */}
            <Animated.View style={[styles.globeGlow, { opacity: glowAnim }]} />
            
            {/* Main globe */}
            <View style={styles.globe}>
              <Text style={styles.globeEmoji}>🌍</Text>
            </View>

            {/* Orbiting icons - outer ring */}
            <Animated.View style={[styles.orbitContainer, { transform: [{ rotate }] }]}>
              <View style={[styles.orbitIcon, styles.orbitIcon1]}>
                <Text style={styles.orbitEmoji}>✈️</Text>
              </View>
              <View style={[styles.orbitIcon, styles.orbitIcon2]}>
                <Text style={styles.orbitEmoji}>🏝️</Text>
              </View>
              <View style={[styles.orbitIcon, styles.orbitIcon3]}>
                <Text style={styles.orbitEmoji}>🎒</Text>
              </View>
              <View style={[styles.orbitIcon, styles.orbitIcon4]}>
                <Text style={styles.orbitEmoji}>🗺️</Text>
              </View>
            </Animated.View>

            {/* Inner orbiting icons */}
            <Animated.View style={[styles.innerOrbitContainer, { transform: [{ rotate: reverseRotate }] }]}>
              <View style={[styles.innerOrbitIcon, styles.innerOrbitIcon1]}>
                <Text style={styles.innerOrbitEmoji}>🏨</Text>
              </View>
              <View style={[styles.innerOrbitIcon, styles.innerOrbitIcon2]}>
                <Text style={styles.innerOrbitEmoji}>🍽️</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          {/* Current Trip Card */}
          {hasActiveTrip && (
            <Animated.View style={{ transform: [{ scale: scaleAnim1 }] }}>
              <TouchableOpacity style={styles.currentTripCard} onPress={onMyTrip} activeOpacity={0.9}>
                <View style={styles.currentTripGlow} />
                <View style={styles.currentTripHeader}>
                  <View style={styles.currentTripIconBg}>
                    <Text style={styles.currentTripIcon}>🧳</Text>
                  </View>
                  <View style={styles.currentTripInfo}>
                    <Text style={styles.currentTripLabel}>CURRENT TRIP</Text>
                    <Text style={styles.currentTripName}>{tripInfo.destination || tripInfo.name || 'My Trip'}</Text>
                  </View>
                  <View style={styles.currentTripArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </View>
                {tripInfo.startDate && tripInfo.endDate && (
                  <View style={styles.currentTripDates}>
                    <Text style={styles.currentTripDateIcon}>📅</Text>
                    <Text style={styles.currentTripDateText}>{tripInfo.startDate} - {tripInfo.endDate}</Text>
                  </View>
                )}
                <View style={styles.currentTripStats}>
                  <View style={styles.tripStatItem}>
                    <Text style={styles.tripStatEmoji}>💰</Text>
                    <View>
                      <Text style={styles.tripStatValue}>${totalExpenses}</Text>
                      <Text style={styles.tripStatLabel}>Spent</Text>
                    </View>
                  </View>
                  <View style={styles.tripStatDivider} />
                  <View style={styles.tripStatItem}>
                    <Text style={styles.tripStatEmoji}>🎒</Text>
                    <View>
                      <Text style={styles.tripStatValue}>{packedCount}/{totalItems}</Text>
                      <Text style={styles.tripStatLabel}>Packed</Text>
                    </View>
                  </View>
                  <View style={styles.tripStatDivider} />
                  <View style={styles.tripStatItem}>
                    <Text style={styles.tripStatEmoji}>🗺️</Text>
                    <View>
                      <Text style={styles.tripStatValue}>{activitiesCount}</Text>
                      <Text style={styles.tripStatLabel}>Activities</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Plan a Trip */}
          <Animated.View style={{ transform: [{ scale: hasActiveTrip ? scaleAnim2 : scaleAnim1 }] }}>
            <TouchableOpacity style={styles.optionCard} onPress={onPlanTrip} activeOpacity={0.9}>
              <View style={styles.optionGlow} />
              <View style={styles.optionIconBg}>
                <Text style={styles.optionIcon}>🚀</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{hasActiveTrip ? 'Plan New Trip' : 'Plan a Trip'}</Text>
                <Text style={styles.optionDescription}>Create your perfect journey</Text>
              </View>
              <View style={styles.optionArrow}>
                <Text style={styles.arrowTextSecondary}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Join a Trip */}
          <Animated.View style={{ transform: [{ scale: hasActiveTrip ? scaleAnim3 : scaleAnim2 }] }}>
            <TouchableOpacity style={styles.optionCard} onPress={() => setShowJoinModal(true)} activeOpacity={0.9}>
              <View style={styles.optionIconBg}>
                <Text style={styles.optionIcon}>👥</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Join a Trip</Text>
                <Text style={styles.optionDescription}>Enter code to join friends</Text>
              </View>
              <View style={styles.optionArrow}>
                <Text style={styles.arrowTextSecondary}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Features Section */}
        <Animated.View style={[styles.featuresSection, { opacity: fadeAnim }]}>
          <Text style={styles.featuresTitle}>Everything you need</Text>
          <Text style={styles.featuresSubtitle}>All-in-one travel companion</Text>
          
          <View style={styles.featuresGrid}>
            {[
              { icon: '💰', label: 'Budget', desc: 'Track spending' },
              { icon: '💳', label: 'Expenses', desc: 'Log costs' },
              { icon: '🎒', label: 'Packing', desc: 'Checklist' },
              { icon: '🗺️', label: 'Itinerary', desc: 'Plan days' },
            ].map((feature, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.featureCard,
                  { transform: [{ scale: scaleAnim1 }] }
                ]}
              >
                <View style={styles.featureIconBg}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Why TravelMate Section */}
        <Animated.View style={[styles.whySection, { opacity: fadeAnim }]}>
          <Text style={styles.whyTitle}>Why TravelMate?</Text>
          <View style={styles.whyList}>
            {[
              { icon: '✨', text: 'Easy trip planning' },
              { icon: '🔄', text: 'Real-time sync with friends' },
              { icon: '📊', text: 'Smart budget tracking' },
              { icon: '📱', text: 'Works offline too' },
            ].map((item, index) => (
              <View key={index} style={styles.whyItem}>
                <Text style={styles.whyItemIcon}>{item.icon}</Text>
                <Text style={styles.whyItemText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>✈️</Text>
          <Text style={styles.footerText}>TravelMate</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>

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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoEmoji: { fontSize: 28, marginRight: 8 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  profileButton: { padding: 4 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
  profileEmoji: { fontSize: 22 },

  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  
  // Background
  bgElements: { position: 'absolute', width: '100%', height: '100%' },
  bgCircle: { position: 'absolute', borderRadius: 999, backgroundColor: colors.primary },
  bgCircle1: { width: 400, height: 400, top: -100, right: -150, opacity: 0.05 },
  bgCircle2: { width: 300, height: 300, bottom: 200, left: -150, opacity: 0.03 },
  bgCircle3: { width: 200, height: 200, bottom: 50, right: -50, opacity: 0.02 },

  // Globe Section
  globeSection: { alignItems: 'center', paddingVertical: 20 },
  globeContainer: { width: 250, height: 250, alignItems: 'center', justifyContent: 'center' },
  
  // Stars
  star: { position: 'absolute' },
  star1: { top: 10, left: 30 },
  star2: { top: 40, right: 20 },
  star3: { bottom: 50, left: 20 },
  starEmoji: { fontSize: 16 },

  // Globe glow
  globeGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: colors.primary, opacity: 0.15 },

  // Orbit rings
  orbitRing: { position: 'absolute', borderWidth: 1, borderStyle: 'dashed' },
  orbitRing1: { width: 200, height: 200, borderRadius: 100, borderColor: colors.primary, opacity: 0.5 },
  orbitRing2: { width: 160, height: 160, borderRadius: 80, borderColor: colors.primaryBorder, opacity: 0.4 },
  orbitRing3: { width: 240, height: 240, borderRadius: 120, borderColor: colors.primaryBorder, opacity: 0.2 },
  
  // Globe
  globe: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primaryBorder, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 25, elevation: 15 },
  globeEmoji: { fontSize: 60 },

  // Outer orbit
  orbitContainer: { position: 'absolute', width: 200, height: 200 },
  orbitIcon: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5 },
  orbitIcon1: { top: -12, left: '50%', marginLeft: -22 },
  orbitIcon2: { right: -12, top: '50%', marginTop: -22 },
  orbitIcon3: { bottom: -12, left: '50%', marginLeft: -22 },
  orbitIcon4: { left: -12, top: '50%', marginTop: -22 },
  orbitEmoji: { fontSize: 20 },

  // Inner orbit
  innerOrbitContainer: { position: 'absolute', width: 130, height: 130 },
  innerOrbitIcon: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  innerOrbitIcon1: { top: -6, left: '50%', marginLeft: -16 },
  innerOrbitIcon2: { bottom: -6, left: '50%', marginLeft: -16 },
  innerOrbitEmoji: { fontSize: 14 },

  // Actions Container
  actionsContainer: { paddingHorizontal: 20, gap: 14 },

  // Current Trip Card
  currentTripCard: { backgroundColor: colors.primary, borderRadius: 24, padding: 20, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  currentTripGlow: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, backgroundColor: '#FFFFFF', opacity: 0.15, borderRadius: 75 },
  currentTripHeader: { flexDirection: 'row', alignItems: 'center' },
  currentTripIconBg: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  currentTripIcon: { fontSize: 26 },
  currentTripInfo: { flex: 1, marginLeft: 14 },
  currentTripLabel: { fontSize: 10, color: 'rgba(0,0,0,0.5)', fontWeight: '700', letterSpacing: 1 },
  currentTripName: { fontSize: 20, fontWeight: 'bold', color: colors.bg, marginTop: 2 },
  currentTripArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 18, color: colors.bg, fontWeight: 'bold' },
  currentTripDates: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  currentTripDateIcon: { fontSize: 16, marginRight: 8 },
  currentTripDateText: { fontSize: 14, color: 'rgba(0,0,0,0.6)', fontWeight: '500' },
  currentTripStats: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14 },
  tripStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  tripStatEmoji: { fontSize: 18, marginRight: 8 },
  tripStatValue: { fontSize: 16, fontWeight: 'bold', color: colors.bg },
  tripStatLabel: { fontSize: 10, color: 'rgba(0,0,0,0.5)' },
  tripStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 8 },

  // Option Cards
  optionCard: { backgroundColor: colors.card, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder, overflow: 'hidden' },
  optionGlow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, backgroundColor: colors.primary, opacity: 0.08, borderRadius: 75 },
  optionIconBg: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  optionIcon: { fontSize: 24 },
  optionContent: { flex: 1, marginLeft: 14 },
  optionTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  optionDescription: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  optionArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  arrowTextSecondary: { fontSize: 18, color: colors.primary, fontWeight: 'bold' },

  // Features Section
  featuresSection: { marginTop: 40, paddingHorizontal: 20 },
  featuresTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  featuresSubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: '48%', backgroundColor: colors.card, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.primaryBorder },
  featureIconBg: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureIcon: { fontSize: 28 },
  featureLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  featureDesc: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  // Why Section
  whySection: { marginTop: 30, paddingHorizontal: 20 },
  whyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  whyList: { backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  whyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  whyItemIcon: { fontSize: 20, marginRight: 14 },
  whyItemText: { fontSize: 15, color: colors.text, flex: 1 },

  // Footer
  footer: { alignItems: 'center', marginTop: 40, paddingVertical: 20 },
  footerLogo: { fontSize: 32 },
  footerText: { fontSize: 16, fontWeight: 'bold', color: colors.textMuted, marginTop: 8 },
  footerVersion: { fontSize: 12, color: colors.textLight, marginTop: 4 },

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
