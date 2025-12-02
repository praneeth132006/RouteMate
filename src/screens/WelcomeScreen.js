import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Dimensions, 
  Animated, TextInput, Modal, ScrollView, Pressable, Share, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTravelContext } from '../context/TravelContext';
import { isValidTripCode } from '../utils/tripCodeGenerator';

const { width } = Dimensions.get('window');

const TRIP_TYPES = [
  { key: 'solo', label: 'Solo Trip', emoji: '🧑', description: 'Just me, exploring the world', color: '#3B82F6' },
  { key: 'friends', label: 'With Friends', emoji: '👥', description: 'Adventure with my buddies', color: '#10B981' },
  { key: 'family', label: 'Family Trip', emoji: '👨‍👩‍👧‍👦', description: 'Quality time with family', color: '#F59E0B' },
  { key: 'couple', label: 'Couple Trip', emoji: '💑', description: 'Romantic getaway for two', color: '#EC4899' },
  { key: 'business', label: 'Business Trip', emoji: '💼', description: 'Work travel with leisure', color: '#8B5CF6' },
];

export default function WelcomeScreen({ onPlanTrip, onJoinTrip, onMyTrip, onProfile, hasActiveTrip }) {
  const { colors } = useTheme();
  const { 
    tripInfo, 
    getTotalExpenses, 
    packingItems, 
    expenses, 
    currency, 
    allTrips = [],
    saveCurrentTripToList,
    switchToTrip, // Add this
  } = useTravelContext();
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTripTypeModal, setShowTripTypeModal] = useState(false);
  const [tripCode, setTripCode] = useState('');
  const [showAllTrips, setShowAllTrips] = useState(false); // Default to collapsed
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim1 = useState(new Animated.Value(0.8))[0];
  const scaleAnim2 = useState(new Animated.Value(0.8))[0];
  const scaleAnim3 = useState(new Animated.Value(0.8))[0];
  const floatAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  const styles = useMemo(() => createStyles(colors), [colors]);

  const packedCount = packingItems.filter(i => i.packed).length;
  const totalItems = packingItems.length;
  const totalExpenses = getTotalExpenses();
  const lastExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;

  // Get trip type info - make it accept a tripType parameter
  const getTripTypeInfo = (tripType) => {
    const type = TRIP_TYPES.find(t => t.key === tripType);
    return type || { key: 'solo', label: 'Solo', emoji: '🧑', color: '#3B82F6' };
  };

  // Calculate trip days - make it accept trip dates as parameters
  const calculateTripDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    try {
      const parts1 = startDate.split(' ');
      const parts2 = endDate.split(' ');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const start = new Date(parseInt(parts1[2]), months.indexOf(parts1[1]), parseInt(parts1[0]));
      const end = new Date(parseInt(parts2[2]), months.indexOf(parts2[1]), parseInt(parts2[0]));
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  // Helper function to parse date string to Date object
  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      const parts = dateString.split(' ');
      if (parts.length < 3) return null;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = months.indexOf(parts[1]);
      if (monthIndex === -1) return null;
      const date = new Date(parseInt(parts[2]), monthIndex, parseInt(parts[0]));
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  // Helper function to get days until trip starts (negative if trip has started/passed)
  const getDaysUntilStart = (startDateString) => {
    const startDate = parseDate(startDateString);
    if (!startDate) return Infinity; // Put trips without dates at the end
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get current total expenses for memoization
  const currentTotalExpenses = getTotalExpenses();

  // Build the display trips list - SORTED BY NEAREST START DATE
  const allDisplayTrips = useMemo(() => {
    let trips = [];
    
    // Add all trips from allTrips
    if (allTrips && allTrips.length > 0) {
      allTrips.forEach(trip => {
        if (trip && trip.destination) {
          const exists = trips.some(t => t.id === trip.id);
          if (!exists) {
            trips.push({
              ...trip,
              totalExpenses: trip.totalExpenses || 0,
            });
          }
        }
      });
    }
    
    // Also check current tripInfo if it has a destination but isn't in trips yet
    if (hasActiveTrip && tripInfo && tripInfo.destination) {
      const currentExists = trips.some(t => t.id === tripInfo.id || 
        (t.destination === tripInfo.destination && t.startDate === tripInfo.startDate));
      if (!currentExists) {
        trips.unshift({
          ...tripInfo,
          id: tripInfo.id || 'current',
          tripCode: tripInfo.tripCode || null,
          totalExpenses: getTotalExpenses(),
        });
      }
    }
    
    // Sort trips by start date - nearest to current date first
    if (trips.length > 1) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      trips.sort((a, b) => {
        const startA = parseDate(a.startDate);
        const startB = parseDate(b.startDate);
        const endA = parseDate(a.endDate);
        const endB = parseDate(b.endDate);
        
        // Handle null dates - put them at the end
        if (!startA && !startB) return 0;
        if (!startA) return 1;
        if (!startB) return -1;
        
        // Check if trips are ongoing (started but not ended)
        const isOngoingA = startA <= today && endA && endA >= today;
        const isOngoingB = startB <= today && endB && endB >= today;
        
        // Ongoing trips come first
        if (isOngoingA && !isOngoingB) return -1;
        if (!isOngoingA && isOngoingB) return 1;
        
        // Calculate days until start
        const daysUntilA = getDaysUntilStart(a.startDate);
        const daysUntilB = getDaysUntilStart(b.startDate);
        
        // For upcoming trips (positive days), sort ascending (soonest first)
        // For past trips (negative days), sort descending (most recent first)
        if (daysUntilA >= 0 && daysUntilB >= 0) {
          return daysUntilA - daysUntilB;
        } else if (daysUntilA < 0 && daysUntilB < 0) {
          return daysUntilB - daysUntilA;
        } else {
          return daysUntilA >= 0 ? -1 : 1;
        }
      });
    }
    
    return trips;
  }, [hasActiveTrip, tripInfo, allTrips, getTotalExpenses]);
  
  // Separate current trip from upcoming trips
  const currentTrip = allDisplayTrips.length > 0 ? allDisplayTrips[0] : null;
  const upcomingTrips = allDisplayTrips.length > 1 ? allDisplayTrips.slice(1) : [];

  const tripTypeInfo = getTripTypeInfo(tripInfo.tripType);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim1, { toValue: 1, tension: 50, friction: 7, delay: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim2, { toValue: 1, tension: 50, friction: 7, delay: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim3, { toValue: 1, tension: 50, friction: 7, delay: 700, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatTranslate = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  // Add missing handleProfilePress function
  const handleProfilePress = () => {
    if (onProfile) {
      onProfile();
    }
  };

  // Add missing handleTripTypeSelect function
  const handleTripTypeSelect = (tripType) => {
    setShowTripTypeModal(false);
    onPlanTrip(tripType);
  };

  const handleJoinTrip = () => {
    if (tripCode.trim()) {
      if (!isValidTripCode(tripCode)) {
        Alert.alert('Invalid Code', 'Please enter a valid trip code (6-8 characters)');
        return;
      }
      setShowJoinModal(false);
      setTripCode('');
      onJoinTrip(tripCode.toUpperCase());
    }
  };

  // Share trip code function
  const handleShareTripCode = async (code, destination) => {
    try {
      await Share.share({
        message: `Join my trip to ${destination}! 🌍✈️\n\nUse this code in TravelMate: ${code}`,
        title: 'Share Trip Code',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share trip code');
    }
  };

  // Copy trip code to clipboard
  const handleCopyTripCode = (code) => {
    // Note: You may need to import Clipboard from @react-native-clipboard/clipboard
    Alert.alert('Trip Code', `Code: ${code}\n\nShare this code with friends to let them join your trip!`, [
      { text: 'OK' }
    ]);
  };

  // Handle trip card press - switch to that trip first
  const handleTripPress = (trip, index) => {
    console.log('Trip pressed:', trip.id, trip.destination);
    
    // Switch to the selected trip's data
    if (switchToTrip) {
      switchToTrip(trip);
    }
    
    // Then navigate to the trip
    onMyTrip(trip, index);
  };

  // Render Current Trip Card - Updated with trip code
  const renderCurrentTripCard = (trip) => {
    const tripTypeData = getTripTypeInfo(trip.tripType);
    const tripDays = calculateTripDays(trip.startDate, trip.endDate);
    const tripExpenses = trip.totalExpenses || getTotalExpenses();

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim3 }] }}>
        <Pressable 
          style={({ pressed }) => [
            styles.currentTripCard, 
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]} 
          onPress={() => handleTripPress(trip, 0)}
        >
          <View style={styles.currentTripGlow} />
          
          {/* Header Row */}
          <View style={styles.currentTripHeader}>
            <View style={styles.currentTripIconBg}>
              <Text style={styles.currentTripIcon}>🧳</Text>
            </View>
            <View style={styles.currentTripInfo}>
              <View style={styles.currentTripBadge}>
                <Text style={styles.currentTripBadgeText}>CURRENT TRIP</Text>
              </View>
              <Text style={styles.currentTripName}>{trip.destination || trip.name || 'My Trip'}</Text>
            </View>
            <View style={styles.currentTripArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </View>

          {/* Trip Code Section */}
          {trip.tripCode && (
            <Pressable 
              style={({ pressed }) => [styles.tripCodeSection, pressed && { opacity: 0.8 }]}
              onPress={() => handleShareTripCode(trip.tripCode, trip.destination)}
            >
              <View style={styles.tripCodeLeft}>
                <Text style={styles.tripCodeLabel}>Trip Code</Text>
                <Text style={styles.tripCodeValue}>{trip.tripCode}</Text>
              </View>
              <View style={styles.tripCodeActions}>
                <Pressable 
                  style={styles.shareBtn}
                  onPress={() => handleShareTripCode(trip.tripCode, trip.destination)}
                >
                  <Text style={styles.shareBtnText}>📤 Share</Text>
                </Pressable>
              </View>
            </Pressable>
          )}

          {/* Dates */}
          {trip.startDate && trip.endDate && (
            <View style={styles.currentTripDates}>
              <View style={styles.dateChip}>
                <Text style={styles.dateChipEmoji}>📅</Text>
                <Text style={styles.dateChipText}>{trip.startDate}</Text>
              </View>
              <Text style={styles.dateArrow}>→</Text>
              <View style={styles.dateChip}>
                <Text style={styles.dateChipText}>{trip.endDate}</Text>
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={styles.currentTripStats}>
            <View style={styles.tripStatItem}>
              <View style={styles.tripStatIconBg}>
                <Text style={styles.tripStatEmoji}>{tripTypeData.emoji}</Text>
              </View>
              <View>
                <Text style={styles.tripStatValue}>{tripTypeData.label.split(' ')[0]}</Text>
                <Text style={styles.tripStatLabel}>Trip Type</Text>
              </View>
            </View>
            <View style={styles.tripStatDivider} />
            <View style={styles.tripStatItem}>
              <View style={styles.tripStatIconBg}>
                <Text style={styles.tripStatEmoji}>📆</Text>
              </View>
              <View>
                <Text style={styles.tripStatValue}>{tripDays}</Text>
                <Text style={styles.tripStatLabel}>Days</Text>
              </View>
            </View>
            <View style={styles.tripStatDivider} />
            <View style={styles.tripStatItem}>
              <View style={styles.tripStatIconBg}>
                <Text style={styles.tripStatEmoji}>💳</Text>
              </View>
              <View>
                <Text style={styles.tripStatValue}>{currency.symbol}{tripExpenses}</Text>
                <Text style={styles.tripStatLabel}>Total Spent</Text>
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <View style={styles.continueBtn}>
            <Text style={styles.continueBtnText}>Continue Planning</Text>
            <Text style={styles.continueBtnArrow}>→</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Render Upcoming Trip Card - Updated with trip code
  const renderUpcomingTripCard = (trip, index) => {
    const tripTypeData = getTripTypeInfo(trip.tripType);
    const tripDays = calculateTripDays(trip.startDate, trip.endDate);

    return (
      <Pressable 
        key={trip.id || index}
        style={({ pressed }) => [
          styles.upcomingTripCard, 
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
        ]} 
        onPress={() => handleTripPress(trip, index + 1)}
      >
        <View style={styles.upcomingTripLeft}>
          <View style={[styles.upcomingTripIconBg, { backgroundColor: tripTypeData.color + '20' }]}>
            <Text style={styles.upcomingTripEmoji}>{tripTypeData.emoji}</Text>
          </View>
          <View style={styles.upcomingTripInfo}>
            <Text style={styles.upcomingTripName}>{trip.destination || trip.name || 'My Trip'}</Text>
            <Text style={styles.upcomingTripDates}>
              {trip.startDate} • {tripDays} days
            </Text>
            {trip.tripCode && (
              <Text style={styles.upcomingTripCode}>Code: {trip.tripCode}</Text>
            )}
          </View>
        </View>
        <View style={styles.upcomingTripRight}>
          {trip.tripCode && (
            <Pressable 
              style={styles.miniShareBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleShareTripCode(trip.tripCode, trip.destination);
              }}
            >
              <Text style={styles.miniShareBtnText}>📤</Text>
            </Pressable>
          )}
          <Text style={styles.upcomingTripArrow}>→</Text>
        </View>
      </Pressable>
    );
  };

  // DEBUG: Log what data we have
  useEffect(() => {
    console.log('=== WelcomeScreen Debug ===');
    console.log('hasActiveTrip:', hasActiveTrip);
    console.log('tripInfo:', JSON.stringify(tripInfo, null, 2));
    console.log('allTrips:', JSON.stringify(allTrips, null, 2));
    console.log('allTrips length:', allTrips?.length || 0);
  }, [hasActiveTrip, tripInfo, allTrips]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Profile */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>✈️</Text>
          <Text style={styles.logoText}>TravelMate</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.profileButton, pressed && { opacity: 0.7 }]} onPress={handleProfilePress}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
        </Pressable>
      </View>

      {/* Background Elements */}
      <View style={styles.bgElements} pointerEvents="none">
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        alwaysBounceVertical={false}
        scrollEventThrottle={16}
      >
        {/* Illustration */}
        <Animated.View style={[styles.illustrationSection, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatTranslate }] }]}>
            <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.middleRing} />
            <View style={styles.travelerCircle}>
              <Text style={styles.travelerEmoji}>🧗</Text>
            </View>
            <View style={[styles.floatingElement, styles.floatingElement1]}><Text style={styles.floatingEmoji}>🏔️</Text></View>
            <View style={[styles.floatingElement, styles.floatingElement2]}><Text style={styles.floatingEmoji}>✈️</Text></View>
            <View style={[styles.floatingElement, styles.floatingElement3]}><Text style={styles.floatingEmoji}>🌴</Text></View>
            <View style={[styles.floatingElement, styles.floatingElement4]}><Text style={styles.floatingEmoji}>🎒</Text></View>
          </Animated.View>
        </Animated.View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          {/* Plan a Trip and Join a Trip - Side by Side */}
          <View style={styles.optionCardsRow}>
            <Animated.View style={[styles.optionCardHalf, { transform: [{ scale: scaleAnim1 }] }]}>
              <Pressable 
                style={({ pressed }) => [styles.optionCardSmall, pressed && styles.cardPressed]} 
                onPress={onPlanTrip}
              >
                <View style={styles.optionGlowSmall} />
                <View style={styles.optionIconBgSmall}><Text style={styles.optionIconSmall}>🚀</Text></View>
                <Text style={styles.optionTitleSmall}>{hasActiveTrip ? 'Plan New Trip' : 'Plan a Trip'}</Text>
                <Text style={styles.optionDescriptionSmall}>Create your journey</Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={[styles.optionCardHalf, { transform: [{ scale: scaleAnim2 }] }]}>
              <Pressable 
                style={({ pressed }) => [styles.optionCardSmall, pressed && styles.cardPressed]} 
                onPress={() => setShowJoinModal(true)}
              >
                <View style={styles.optionIconBgSmall}><Text style={styles.optionIconSmall}>👥</Text></View>
                <Text style={styles.optionTitleSmall}>Join a Trip</Text>
                <Text style={styles.optionDescriptionSmall}>Enter code to join</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* CURRENT TRIP DASHBOARD - Only show if exists */}
          {currentTrip && renderCurrentTripCard(currentTrip)}

          {/* UPCOMING TRIPS SECTION - Always show header, but list is empty until user adds trips */}
          <View style={styles.upcomingTripsSection}>
            {/* Section Header - Always visible */}
            <Pressable 
              style={({ pressed }) => [styles.upcomingTripsHeader, pressed && { opacity: 0.8 }]}
              onPress={() => setShowAllTrips(!showAllTrips)}
            >
              <View style={styles.upcomingTripsLeft}>
                <View style={styles.upcomingTripsIconBg}>
                  <Text style={styles.upcomingTripsIcon}>📋</Text>
                </View>
                <View>
                  <Text style={styles.upcomingTripsTitle}>Upcoming Trips</Text>
                  <Text style={styles.upcomingTripsSubtitle}>
                    {upcomingTrips.length > 0 
                      ? `${upcomingTrips.length} trip${upcomingTrips.length > 1 ? 's' : ''} planned`
                      : 'No upcoming trips yet'
                    }
                  </Text>
                </View>
              </View>
              <View style={styles.upcomingTripsRight}>
                <View style={styles.upcomingTripsBadge}>
                  <Text style={styles.upcomingTripsBadgeText}>{upcomingTrips.length}</Text>
                </View>
                {upcomingTrips.length > 0 && (
                  <View style={[styles.expandIconBg, showAllTrips && styles.expandIconBgActive]}>
                    <Text style={[styles.expandIcon, showAllTrips && styles.expandIconActive]}>
                      {showAllTrips ? '▲' : '▼'}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>

            {/* Upcoming Trip Cards List - Only show if there are trips */}
            {showAllTrips && upcomingTrips.length > 0 && (
              <View style={styles.upcomingTripsList}>
                {upcomingTrips.map((trip, index) => renderUpcomingTripCard(trip, index))}
              </View>
            )}

            {/* Empty state message when expanded but no trips */}
            {showAllTrips && upcomingTrips.length === 0 && (
              <View style={styles.emptyUpcomingContainer}>
                <Text style={styles.emptyUpcomingEmoji}>✈️</Text>
                <Text style={styles.emptyUpcomingText}>No upcoming trips</Text>
                <Text style={styles.emptyUpcomingHint}>Plan a new trip to see it here</Text>
              </View>
            )}
          </View>

          {/* No Trips Message - Only show when no current trip at all */}
          {!currentTrip && (
            <View style={styles.noTripsContainer}>
              <View style={styles.noTripsIconBg}>
                <Text style={styles.noTripsIcon}>🌍</Text>
              </View>
              <Text style={styles.noTripsTitle}>No trips yet</Text>
              <Text style={styles.noTripsSubtitle}>Start planning your next adventure!</Text>
            </View>
          )}
        </View>

        {/* Features */}
        <Animated.View style={[styles.featuresSection, { opacity: fadeAnim }]}>
          <Text style={styles.featuresTitle}>Everything you need</Text>
          <Text style={styles.featuresSubtitle}>All-in-one travel companion</Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: '💰', label: 'Budget', desc: 'Track spending' },
              { icon: '💳', label: 'Expenses', desc: 'Log costs' },
              { icon: '🎒', label: 'Packing', desc: 'Checklist' },
              { icon: '🗺️', label: 'Itinerary', desc: 'Plan days' },
            ].map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={styles.featureIconBg}><Text style={styles.featureIcon}>{f.icon}</Text></View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Why Section */}
        <Animated.View style={[styles.whySection, { opacity: fadeAnim }]}>
          <Text style={styles.whyTitle}>Why TravelMate?</Text>
          <View style={styles.whyList}>
            {[
              { icon: '✨', text: 'Easy trip planning' },
              { icon: '🔄', text: 'Real-time sync with friends' },
              { icon: '📊', text: 'Smart budget tracking' },
              { icon: '📱', text: 'Works offline too' },
            ].map((item, index) => (
              <View key={index} style={[styles.whyItem, index === 3 && { borderBottomWidth: 0 }]}>
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
      </ScrollView>

      {/* Trip Type Selection Modal */}
      <Modal animationType="slide" transparent visible={showTripTypeModal} onRequestClose={() => setShowTripTypeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.tripTypeModalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.tripTypeHeader}>
              <View>
                <Text style={styles.tripTypeTitle}>Choose Trip Type</Text>
                <Text style={styles.tripTypeSubtitle}>Select who's traveling with you</Text>
              </View>
              <Pressable onPress={() => setShowTripTypeModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>×</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.tripTypeList}>
                {TRIP_TYPES.map((type, index) => (
                  <Pressable
                    key={type.key}
                    style={({ pressed }) => [
                      styles.tripTypeCard,
                      { borderLeftColor: type.color },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={() => handleTripTypeSelect(type.key)}
                  >
                    <View style={[styles.tripTypeIconBg, { backgroundColor: type.color + '20' }]}>
                      <Text style={styles.tripTypeEmoji}>{type.emoji}</Text>
                    </View>
                    <View style={styles.tripTypeInfo}>
                      <Text style={styles.tripTypeLabel}>{type.label}</Text>
                      <Text style={styles.tripTypeDesc}>{type.description}</Text>
                    </View>
                    <View style={[styles.tripTypeArrow, { backgroundColor: type.color + '20' }]}>
                      <Text style={[styles.tripTypeArrowText, { color: type.color }]}>→</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Join Modal */}
      <Modal animationType="slide" transparent visible={showJoinModal} onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconBg}><Text style={styles.modalIcon}>🔗</Text></View>
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
            <Pressable 
              style={({ pressed }) => [styles.joinButton, !tripCode.trim() && styles.joinButtonDisabled, pressed && styles.buttonPressed]} 
              onPress={handleJoinTrip} 
              disabled={!tripCode.trim()}
            >
              <Text style={styles.joinButtonText}>Join Trip</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setShowJoinModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
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
    backgroundColor: colors.bg,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoEmoji: { fontSize: 28, marginRight: 8 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  profileButton: { padding: 4 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
  profileEmoji: { fontSize: 22 },

  // ScrollView
  scrollView: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: { 
    flexGrow: 1,
    paddingBottom: 40,
    backgroundColor: colors.bg,
  },
  
  bgElements: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, overflow: 'hidden' },
  bgCircle: { position: 'absolute', borderRadius: 999, backgroundColor: colors.primary, opacity: 0.04 },
  bgCircle1: { width: 400, height: 400, top: -100, right: -150 },
  bgCircle2: { width: 300, height: 300, top: 400, left: -150 },
  bgCircle3: { width: 200, height: 200, top: 700, right: -50 },

  // Illustration Section
  illustrationSection: { 
    alignItems: 'center', 
    paddingVertical: 20,
    backgroundColor: colors.bg,
  },
  illustrationContainer: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: colors.primary, opacity: 0.3, borderStyle: 'dashed' },
  middleRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: colors.primaryBorder, opacity: 0.5 },
  travelerCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primaryBorder },
  travelerEmoji: { fontSize: 60 },
  floatingElement: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primaryBorder },
  floatingElement1: { top: 0, left: 20 },
  floatingElement2: { top: 30, right: 10 },
  floatingElement3: { bottom: 20, left: 10 },
  floatingElement4: { bottom: 0, right: 30 },
  floatingEmoji: { fontSize: 22 },

  // Actions Container
  actionsContainer: { 
    paddingHorizontal: 20, 
    gap: 14,
    backgroundColor: colors.bg,
  },

  // Card Press State
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  buttonPressed: { opacity: 0.8 },

  // Current Trip Card - SOFTER COLORS
  currentTripCard: { 
    backgroundColor: colors.card, 
    borderRadius: 24, 
    padding: 20, 
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  currentTripGlow: { 
    position: 'absolute', 
    top: -60, 
    right: -60, 
    width: 180, 
    height: 180, 
    backgroundColor: colors.primary, 
    opacity: 0.06, 
    borderRadius: 90,
  },
  currentTripHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  currentTripIconBg: { 
    width: 52, 
    height: 52, 
    borderRadius: 16, 
    backgroundColor: colors.primaryMuted, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  currentTripIcon: { fontSize: 26 },
  currentTripInfo: { flex: 1, marginLeft: 14 },
  currentTripBadge: { 
    backgroundColor: colors.primary + '20', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6, 
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  currentTripBadgeText: { 
    fontSize: 9, 
    color: colors.primary, 
    fontWeight: '700', 
    letterSpacing: 1,
  },
  currentTripName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: colors.text,
  },
  currentTripArrow: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: colors.primaryMuted, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  arrowText: { fontSize: 18, color: colors.primary, fontWeight: 'bold' },
  
  // Dates
  currentTripDates: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 16, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: colors.primaryBorder,
    gap: 10,
  },
  dateChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.cardLight, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  dateChipEmoji: { fontSize: 14, marginRight: 6 },
  dateChipText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  dateArrow: { color: colors.textMuted, fontSize: 14 },

  // Stats
  currentTripStats: { 
    flexDirection: 'row', 
    marginTop: 16, 
    backgroundColor: colors.cardLight, 
    borderRadius: 16, 
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  tripStatItem: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 10,
  },
  tripStatIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripStatEmoji: { fontSize: 16 },
  tripStatValue: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  tripStatLabel: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  tripStatDivider: { width: 1, height: 36, backgroundColor: colors.primaryBorder },

  // Continue Button
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  continueBtnText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: 'bold',
  },
  continueBtnArrow: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: 'bold',
  },

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

  // Option Cards Row (Side by Side)
  optionCardsRow: { flexDirection: 'row', gap: 12 },
  optionCardHalf: { flex: 1 },
  optionCardSmall: { 
    backgroundColor: colors.card, 
    borderRadius: 20, 
    padding: 18, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.primaryBorder, 
    overflow: 'hidden',
    minHeight: 140,
  },
  optionGlowSmall: { position: 'absolute', top: -30, right: -30, width: 80, height: 80, backgroundColor: colors.primary, opacity: 0.08, borderRadius: 40 },
  optionIconBgSmall: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: 12 },
  optionIconSmall: { fontSize: 24 },
  optionTitleSmall: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  optionDescriptionSmall: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  // Features Section
  featuresSection: { 
    marginTop: 40, 
    paddingHorizontal: 20,
    backgroundColor: colors.bg,
  },
  featuresTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  featuresSubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: '48%', backgroundColor: colors.card, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.primaryBorder },
  featureIconBg: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureIcon: { fontSize: 28 },
  featureLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  featureDesc: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  // Why Section
  whySection: { 
    marginTop: 30, 
    paddingHorizontal: 20,
    backgroundColor: colors.bg,
  },
  whyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  whyList: { backgroundColor: colors.card, borderRadius: 20, padding: 6, borderWidth: 1, borderColor: colors.primaryBorder },
  whyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  whyItemIcon: { fontSize: 22, marginRight: 14 },
  whyItemText: { fontSize: 15, color: colors.text, flex: 1 },

  // Footer
  footer: { 
    alignItems: 'center', 
    marginTop: 40, 
    paddingVertical: 20,
    backgroundColor: colors.bg,
  },
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
  joinButtonText: { fontSize: 18, fontWeight: 'bold', color: colors.bg },
  cancelButton: { padding: 16 },
  cancelButtonText: { fontSize: 16, color: colors.textMuted },

  // Trip Type Modal
  tripTypeModalContent: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
  tripTypeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  tripTypeTitle: { fontSize: 26, fontWeight: 'bold', color: colors.text },
  tripTypeSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' },
  modalCloseBtnText: { color: colors.textMuted, fontSize: 22 },
  tripTypeList: { gap: 12 },
  tripTypeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 16, padding: 16, borderLeftWidth: 4 },
  tripTypeIconBg: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tripTypeEmoji: { fontSize: 28 },
  tripTypeInfo: { flex: 1, marginLeft: 14 },
  tripTypeLabel: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  tripTypeDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  tripTypeArrow: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tripTypeArrowText: { fontSize: 18, fontWeight: 'bold' },

  // Trips List Container
  tripsListContainer: {
    gap: 14,
  },
  tripsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  tripsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  tripsListCount: {
    fontSize: 14,
    color: colors.textMuted,
    backgroundColor: colors.cardLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  // Secondary Trip Card Styles
  secondaryTripCard: {
    borderColor: colors.border || colors.primaryBorder,
    opacity: 0.95,
  },
  secondaryTripIconBg: {
    backgroundColor: colors.cardLight,
  },
  secondaryTripBadge: {
    backgroundColor: colors.textMuted + '20',
  },
  secondaryTripBadgeText: {
    color: colors.textMuted,
  },
  secondaryContinueBtn: {
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  secondaryContinueBtnText: {
    color: colors.text,
  },

  // Upcoming Trips Section
  upcomingTripsSection: {
    marginTop: 8,
  },
  upcomingTripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  upcomingTripsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upcomingTripsIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingTripsIcon: {
    fontSize: 20,
  },
  upcomingTripsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  upcomingTripsSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  upcomingTripsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upcomingTripsBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  upcomingTripsBadgeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  expandIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIconBgActive: {
    backgroundColor: colors.primary + '20',
  },
  expandIcon: {
    fontSize: 10,
    color: colors.textMuted,
  },
  expandIconActive: {
    color: colors.primary,
  },

  // Upcoming Trips List
  upcomingTripsList: {
    marginTop: 12,
    gap: 10,
  },
  upcomingTripCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  upcomingTripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  upcomingTripIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingTripEmoji: {
    fontSize: 22,
  },
  upcomingTripInfo: {
    flex: 1,
  },
  upcomingTripName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  upcomingTripDates: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  upcomingTripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upcomingTripExpense: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  upcomingTripArrow: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Trips Section Styles - NEW
  tripsSection: {
    marginTop: 6,
  },
  tripsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  tripsSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripsSectionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripsSectionIcon: {
    fontSize: 22,
  },
  tripsSectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
  },
  tripsSectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  tripsSectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tripCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tripCountText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // No Trips State
  noTripsContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
  },
  noTripsIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noTripsIcon: {
    fontSize: 40,
  },
  noTripsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  noTripsSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Trip Code Section Styles - NEW
  tripCodeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.primaryBorder,
    backgroundColor: colors.primary + '08',
    marginHorizontal: -20,
    marginBottom: -4,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tripCodeLeft: {
    flex: 1,
  },
  tripCodeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tripCodeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 3,
  },
  tripCodeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareBtnText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '600',
  },

  // Upcoming trip code style
  upcomingTripCode: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1,
  },

  // Mini share button for upcoming trips
  miniShareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  miniShareBtnText: {
    fontSize: 14,
  },

  // Add empty upcoming trips state styles
  emptyUpcomingContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
  },
  emptyUpcomingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyUpcomingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  emptyUpcomingHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
