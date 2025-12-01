import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, TextInput, ScrollView, 
  StyleSheet, Animated, Pressable, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import DatePickerModal from '../components/DatePickerModal';
import { generateUniqueTripCode } from '../utils/tripCodeGenerator';

const TRIP_TYPES = [
  { key: 'solo', label: 'Solo Trip', emoji: '🧑', description: 'Just me, exploring the world', color: '#3B82F6' },
  { key: 'friends', label: 'With Friends', emoji: '👥', description: 'Adventure with my buddies', color: '#10B981' },
  { key: 'family', label: 'Family Trip', emoji: '👨‍👩‍👧‍👦', description: 'Quality time with family', color: '#F59E0B' },
  { key: 'couple', label: 'Couple Trip', emoji: '💑', description: 'Romantic getaway for two', color: '#EC4899' },
  { key: 'business', label: 'Business Trip', emoji: '💼', description: 'Work travel with leisure', color: '#8B5CF6' },
];

const POPULAR_DESTINATIONS = [
  { name: 'Paris', country: 'France', emoji: '🗼' },
  { name: 'Tokyo', country: 'Japan', emoji: '🗾' },
  { name: 'Bali', country: 'Indonesia', emoji: '🏝️' },
  { name: 'New York', country: 'USA', emoji: '🗽' },
  { name: 'Dubai', country: 'UAE', emoji: '🏙️' },
  { name: 'London', country: 'UK', emoji: '🎡' },
];

const BUDGET_PRESETS = [
  { label: 'Budget', range: '$500 - $1,000', value: 750, emoji: '💵' },
  { label: 'Moderate', range: '$1,000 - $3,000', value: 2000, emoji: '💳' },
  { label: 'Luxury', range: '$3,000 - $5,000', value: 4000, emoji: '💎' },
  { label: 'Premium', range: '$5,000+', value: 7500, emoji: '👑' },
];

export default function TripSetupScreen({ onComplete, onBack }) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [tripData, setTripData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    tripType: '',
    budget: '',
    name: '',
    // Friends data
    friends: [],
    newFriendName: '',
    // Family data
    familyMembers: [],
    newMemberName: '',
    newMemberRelation: '',
    // Couple data
    partnerName: '',
    // Business data
    colleagues: [],
    newColleagueName: '',
  });

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const progressAnim = useState(new Animated.Value(0))[0];

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Dynamic steps based on trip type
  const getSteps = () => {
    const baseSteps = [
      { key: 'location', title: 'Trip Details', subtitle: 'Where and when are you going?', icon: '🌍' },
      { key: 'tripType', title: 'Trip Type', subtitle: 'Who are you traveling with?', icon: '👥' },
    ];

    // Add companions step based on trip type (skip for solo)
    if (tripData.tripType && tripData.tripType !== 'solo') {
      baseSteps.push({ 
        key: 'companions', 
        title: getCompanionsTitle(), 
        subtitle: getCompanionsSubtitle(), 
        icon: getCompanionsIcon() 
      });
    }

    // Always add budget step at the end
    baseSteps.push({ key: 'budget', title: 'Budget', subtitle: 'Plan your spending', icon: '💰' });

    return baseSteps;
  };

  const getCompanionsTitle = () => {
    switch (tripData.tripType) {
      case 'friends': return 'Add Friends';
      case 'family': return 'Family Members';
      case 'couple': return 'Your Partner';
      case 'business': return 'Colleagues';
      default: return 'Companions';
    }
  };

  const getCompanionsSubtitle = () => {
    switch (tripData.tripType) {
      case 'friends': return 'Who\'s coming with you?';
      case 'family': return 'Add your family members';
      case 'couple': return 'Add your partner\'s details';
      case 'business': return 'Add your travel colleagues';
      default: return 'Add your travel companions';
    }
  };

  const getCompanionsIcon = () => {
    switch (tripData.tripType) {
      case 'friends': return '🎉';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'couple': return '💕';
      case 'business': return '💼';
      default: return '👥';
    }
  };

  const STEPS = getSteps();
  const totalSteps = STEPS.length;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.timing(progressAnim, { 
      toValue: (currentStep + 1) / totalSteps, 
      duration: 300, 
      useNativeDriver: false 
    }).start();
  }, [currentStep, totalSteps]);

  const animateStepChange = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      animateStepChange(() => setCurrentStep(currentStep + 1));
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateStepChange(() => setCurrentStep(currentStep - 1));
    } else {
      onBack();
    }
  };

  const handleComplete = () => {
    const tripCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Prepare participants based on trip type
    let participants = [];
    switch (tripData.tripType) {
      case 'friends':
        participants = tripData.friends.map(name => ({ name, type: 'friend' }));
        break;
      case 'family':
        participants = tripData.familyMembers;
        break;
      case 'couple':
        if (tripData.partnerName) {
          participants = [{ name: tripData.partnerName, type: 'partner' }];
        }
        break;
      case 'business':
        participants = tripData.colleagues.map(name => ({ name, type: 'colleague' }));
        break;
      default:
        participants = [];
    }

    // Log to verify data
    console.log('TripSetupScreen - completing with tripType:', tripData.tripType);
    console.log('TripSetupScreen - participants:', participants);

    onComplete({ 
      ...tripData, 
      tripCode,
      participants,
      tripType: tripData.tripType, // MAKE SURE THIS IS INCLUDED
      name: tripData.name || `${tripData.destination} Trip`,
    });
  };

  const isStepValid = () => {
    const step = STEPS[currentStep];
    switch (step.key) {
      case 'location': 
        return tripData.destination.trim().length > 0 && tripData.startDate && tripData.endDate;
      case 'tripType': 
        return tripData.tripType !== '';
      case 'companions':
        if (tripData.tripType === 'couple') {
          return tripData.partnerName.trim().length > 0;
        }
        return true; // Friends, family, business can be empty
      case 'budget': 
        return tripData.budget && parseFloat(tripData.budget) > 0;
      default: 
        return true;
    }
  };

  const selectDestination = (dest) => {
    setTripData({ ...tripData, destination: `${dest.name}, ${dest.country}` });
  };

  const selectTripType = (type) => {
    setTripData({ 
      ...tripData, 
      tripType: type.key,
      // Reset companion data when changing type
      friends: [],
      familyMembers: [],
      partnerName: '',
      colleagues: [],
    });
  };

  const addFriend = () => {
    if (tripData.newFriendName.trim()) {
      setTripData({
        ...tripData,
        friends: [...tripData.friends, tripData.newFriendName.trim()],
        newFriendName: '',
      });
    }
  };

  const removeFriend = (index) => {
    setTripData({
      ...tripData,
      friends: tripData.friends.filter((_, i) => i !== index),
    });
  };

  const addFamilyMember = () => {
    if (tripData.newMemberName.trim()) {
      setTripData({
        ...tripData,
        familyMembers: [...tripData.familyMembers, { 
          name: tripData.newMemberName.trim(), 
          relation: tripData.newMemberRelation || 'Member' 
        }],
        newMemberName: '',
        newMemberRelation: '',
      });
    }
  };

  const removeFamilyMember = (index) => {
    setTripData({
      ...tripData,
      familyMembers: tripData.familyMembers.filter((_, i) => i !== index),
    });
  };

  const addColleague = () => {
    if (tripData.newColleagueName.trim()) {
      setTripData({
        ...tripData,
        colleagues: [...tripData.colleagues, tripData.newColleagueName.trim()],
        newColleagueName: '',
      });
    }
  };

  const removeColleague = (index) => {
    setTripData({
      ...tripData,
      colleagues: tripData.colleagues.filter((_, i) => i !== index),
    });
  };

  const selectBudgetPreset = (preset) => {
    setTripData({ ...tripData, budget: preset.value.toString() });
  };

  const calculateDuration = (start, end) => {
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const parts1 = start.split(' ');
      const parts2 = end.split(' ');
      const startDate = new Date(parseInt(parts1[2]), months.indexOf(parts1[1]), parseInt(parts1[0]));
      const endDate = new Date(parseInt(parts2[2]), months.indexOf(parts2[1]), parseInt(parts2[0]));
      const diffTime = endDate - startDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.key) {
      case 'location':
        return (
          <View style={styles.stepContent}>
            {/* Destination Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>📍 Destination</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconBg}>
                  <Text style={styles.inputIcon}>🔍</Text>
                </View>
                <TextInput
                  style={styles.mainInput}
                  placeholder="Search destination..."
                  placeholderTextColor={colors.textMuted}
                  value={tripData.destination}
                  onChangeText={(text) => setTripData({ ...tripData, destination: text })}
                />
                {tripData.destination.length > 0 && (
                  <Pressable onPress={() => setTripData({ ...tripData, destination: '' })} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>✕</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Popular Destinations */}
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>🔥 Popular Destinations</Text>
              <View style={styles.destinationsGrid}>
                {POPULAR_DESTINATIONS.map((dest, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.destinationCard,
                      tripData.destination === `${dest.name}, ${dest.country}` && styles.destinationCardActive,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={() => selectDestination(dest)}
                  >
                    <Text style={styles.destinationEmoji}>{dest.emoji}</Text>
                    <Text style={styles.destinationName}>{dest.name}</Text>
                    <Text style={styles.destinationCountry}>{dest.country}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.datesSection}>
              <Text style={styles.inputLabel}>📅 Travel Dates</Text>
              
              <View style={styles.datesRow}>
                {/* Start Date */}
                <Pressable 
                  style={({ pressed }) => [styles.dateCard, pressed && { opacity: 0.9 }]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateCardEmoji}>🛫</Text>
                  <View style={styles.dateCardContent}>
                    <Text style={styles.dateCardLabel}>Start</Text>
                    <Text style={[styles.dateCardValue, !tripData.startDate && styles.dateCardPlaceholder]}>
                      {tripData.startDate || 'Select'}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.dateArrowContainer}>
                  <Text style={styles.dateArrow}>→</Text>
                </View>

                {/* End Date */}
                <Pressable 
                  style={({ pressed }) => [styles.dateCard, pressed && { opacity: 0.9 }]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateCardEmoji}>🛬</Text>
                  <View style={styles.dateCardContent}>
                    <Text style={styles.dateCardLabel}>End</Text>
                    <Text style={[styles.dateCardValue, !tripData.endDate && styles.dateCardPlaceholder]}>
                      {tripData.endDate || 'Select'}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Duration Preview */}
              {tripData.startDate && tripData.endDate && (
                <View style={styles.durationCard}>
                  <Text style={styles.durationIcon}>📆</Text>
                  <Text style={styles.durationText}>
                    {calculateDuration(tripData.startDate, tripData.endDate)} days trip
                  </Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'tripType':
        return (
          <View style={styles.stepContent}>
            <View style={styles.tripTypeGrid}>
              {TRIP_TYPES.map((type, index) => (
                <Pressable
                  key={type.key}
                  style={({ pressed }) => [
                    styles.tripTypeCard,
                    { borderLeftColor: type.color },
                    tripData.tripType === type.key && styles.tripTypeCardActive,
                    tripData.tripType === type.key && { borderColor: type.color },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                  ]}
                  onPress={() => selectTripType(type)}
                >
                  <View style={[styles.tripTypeIconBg, { backgroundColor: type.color + '20' }]}>
                    <Text style={styles.tripTypeEmoji}>{type.emoji}</Text>
                  </View>
                  <View style={styles.tripTypeInfo}>
                    <Text style={styles.tripTypeLabel}>{type.label}</Text>
                    <Text style={styles.tripTypeDesc}>{type.description}</Text>
                  </View>
                  <View style={[
                    styles.tripTypeCheck,
                    tripData.tripType === type.key && { backgroundColor: type.color }
                  ]}>
                    {tripData.tripType === type.key && (
                      <Text style={styles.tripTypeCheckText}>✓</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'companions':
        return renderCompanionsContent();

      case 'budget':
        return (
          <View style={styles.stepContent}>
            {/* Budget Input */}
            <View style={styles.budgetInputSection}>
              <Text style={styles.budgetCurrency}>$</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={tripData.budget}
                onChangeText={(text) => setTripData({ ...tripData, budget: text.replace(/[^0-9]/g, '') })}
              />
            </View>

            {/* Budget Presets */}
            <View style={styles.presetsSection}>
              <Text style={styles.presetsTitle}>Quick Select</Text>
              <View style={styles.presetsGrid}>
                {BUDGET_PRESETS.map((preset, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.presetCard,
                      tripData.budget === preset.value.toString() && styles.presetCardActive,
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => selectBudgetPreset(preset)}
                  >
                    <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                    <Text style={[styles.presetLabel, tripData.budget === preset.value.toString() && styles.presetLabelActive]}>
                      {preset.label}
                    </Text>
                    <Text style={[styles.presetRange, tripData.budget === preset.value.toString() && styles.presetRangeActive]}>
                      {preset.range}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Trip Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 Trip Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>📍</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Destination</Text>
                  <Text style={styles.summaryValue}>{tripData.destination}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>📅</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Dates</Text>
                  <Text style={styles.summaryValue}>{tripData.startDate} → {tripData.endDate}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>{TRIP_TYPES.find(t => t.key === tripData.tripType)?.emoji || '👤'}</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Trip Type</Text>
                  <Text style={styles.summaryValue}>
                    {TRIP_TYPES.find(t => t.key === tripData.tripType)?.label || 'Solo'}
                    {getTravelersCount() > 1 && ` (${getTravelersCount()} travelers)`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tip */}
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipText}>
                Budget can be adjusted anytime during your trip planning.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getTravelersCount = () => {
    let count = 1; // Self
    switch (tripData.tripType) {
      case 'friends': count += tripData.friends.length; break;
      case 'family': count += tripData.familyMembers.length; break;
      case 'couple': count += tripData.partnerName ? 1 : 0; break;
      case 'business': count += tripData.colleagues.length; break;
    }
    return count;
  };

  const renderCompanionsContent = () => {
    switch (tripData.tripType) {
      case 'friends':
        return (
          <View style={styles.stepContent}>
            {/* Add Friend Input */}
            <View style={styles.addCompanionSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconBg}>
                  <Text style={styles.inputIcon}>👤</Text>
                </View>
                <TextInput
                  style={styles.mainInput}
                  placeholder="Enter friend's name"
                  placeholderTextColor={colors.textMuted}
                  value={tripData.newFriendName}
                  onChangeText={(text) => setTripData({ ...tripData, newFriendName: text })}
                  onSubmitEditing={addFriend}
                />
                <Pressable 
                  style={[styles.addBtn, !tripData.newFriendName.trim() && styles.addBtnDisabled]}
                  onPress={addFriend}
                  disabled={!tripData.newFriendName.trim()}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>

            {/* Friends List */}
            <View style={styles.companionsList}>
              <Text style={styles.companionsListTitle}>
                🎉 Friends ({tripData.friends.length})
              </Text>
              {tripData.friends.length === 0 ? (
                <View style={styles.emptyCompanions}>
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={styles.emptyText}>No friends added yet</Text>
                  <Text style={styles.emptyHint}>Add friends who are joining this trip</Text>
                </View>
              ) : (
                tripData.friends.map((friend, index) => (
                  <View key={index} style={styles.companionCard}>
                    <View style={styles.companionAvatar}>
                      <Text style={styles.companionAvatarText}>{friend.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.companionName}>{friend}</Text>
                    <Pressable style={styles.removeBtn} onPress={() => removeFriend(index)}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            {/* Skip Note */}
            <View style={styles.skipNote}>
              <Text style={styles.skipNoteText}>💡 You can add more friends later from the trip dashboard</Text>
            </View>
          </View>
        );

      case 'family':
        return (
          <View style={styles.stepContent}>
            {/* Add Family Member */}
            <View style={styles.addCompanionSection}>
              <View style={styles.familyInputRow}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <TextInput
                    style={styles.familyInput}
                    placeholder="Name"
                    placeholderTextColor={colors.textMuted}
                    value={tripData.newMemberName}
                    onChangeText={(text) => setTripData({ ...tripData, newMemberName: text })}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 0.6 }]}>
                  <TextInput
                    style={styles.familyInput}
                    placeholder="Relation"
                    placeholderTextColor={colors.textMuted}
                    value={tripData.newMemberRelation}
                    onChangeText={(text) => setTripData({ ...tripData, newMemberRelation: text })}
                  />
                </View>
                <Pressable 
                  style={[styles.addBtnSmall, !tripData.newMemberName.trim() && styles.addBtnDisabled]}
                  onPress={addFamilyMember}
                  disabled={!tripData.newMemberName.trim()}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Quick Add Relations */}
            <View style={styles.quickRelations}>
              {['Spouse', 'Child', 'Parent', 'Sibling'].map((rel, i) => (
                <Pressable 
                  key={i}
                  style={styles.relationChip}
                  onPress={() => setTripData({ ...tripData, newMemberRelation: rel })}
                >
                  <Text style={styles.relationChipText}>{rel}</Text>
                </Pressable>
              ))}
            </View>

            {/* Family Members List */}
            <View style={styles.companionsList}>
              <Text style={styles.companionsListTitle}>
                👨‍👩‍👧‍👦 Family Members ({tripData.familyMembers.length})
              </Text>
              {tripData.familyMembers.length === 0 ? (
                <View style={styles.emptyCompanions}>
                  <Text style={styles.emptyEmoji}>👨‍👩‍👧</Text>
                  <Text style={styles.emptyText}>No family members added</Text>
                  <Text style={styles.emptyHint}>Add family members joining this trip</Text>
                </View>
              ) : (
                tripData.familyMembers.map((member, index) => (
                  <View key={index} style={styles.companionCard}>
                    <View style={styles.companionAvatar}>
                      <Text style={styles.companionAvatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.companionInfo}>
                      <Text style={styles.companionName}>{member.name}</Text>
                      <Text style={styles.companionRelation}>{member.relation}</Text>
                    </View>
                    <Pressable style={styles.removeBtn} onPress={() => removeFamilyMember(index)}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>
        );

      case 'couple':
        return (
          <View style={styles.stepContent}>
            <View style={styles.coupleSection}>
              <View style={styles.coupleIllustration}>
                <Text style={styles.coupleEmoji}>💑</Text>
              </View>
              <Text style={styles.coupleTitle}>Traveling with your partner?</Text>
              <Text style={styles.coupleSubtitle}>Add their name to share this trip</Text>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputIconBg}>
                  <Text style={styles.inputIcon}>💕</Text>
                </View>
                <TextInput
                  style={styles.mainInput}
                  placeholder="Partner's name"
                  placeholderTextColor={colors.textMuted}
                  value={tripData.partnerName}
                  onChangeText={(text) => setTripData({ ...tripData, partnerName: text })}
                />
              </View>
            </View>
          </View>
        );

      case 'business':
        return (
          <View style={styles.stepContent}>
            {/* Add Colleague */}
            <View style={styles.addCompanionSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconBg}>
                  <Text style={styles.inputIcon}>💼</Text>
                </View>
                <TextInput
                  style={styles.mainInput}
                  placeholder="Colleague's name"
                  placeholderTextColor={colors.textMuted}
                  value={tripData.newColleagueName}
                  onChangeText={(text) => setTripData({ ...tripData, newColleagueName: text })}
                  onSubmitEditing={addColleague}
                />
                <Pressable 
                  style={[styles.addBtn, !tripData.newColleagueName.trim() && styles.addBtnDisabled]}
                  onPress={addColleague}
                  disabled={!tripData.newColleagueName.trim()}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>

            {/* Colleagues List */}
            <View style={styles.companionsList}>
              <Text style={styles.companionsListTitle}>
                💼 Colleagues ({tripData.colleagues.length})
              </Text>
              {tripData.colleagues.length === 0 ? (
                <View style={styles.emptyCompanions}>
                  <Text style={styles.emptyEmoji}>👔</Text>
                  <Text style={styles.emptyText}>No colleagues added</Text>
                  <Text style={styles.emptyHint}>Add colleagues traveling with you</Text>
                </View>
              ) : (
                tripData.colleagues.map((colleague, index) => (
                  <View key={index} style={styles.companionCard}>
                    <View style={styles.companionAvatar}>
                      <Text style={styles.companionAvatarText}>{colleague.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.companionName}>{colleague}</Text>
                    <Pressable style={styles.removeBtn} onPress={() => removeColleague(index)}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.stepIndicator}>Step {currentStep + 1} of {totalSteps}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* Step Header */}
        <Animated.View style={[styles.stepHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.stepIconBg}>
            <Text style={styles.stepIcon}>{STEPS[currentStep].icon}</Text>
          </View>
          <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
          <Text style={styles.stepSubtitle}>{STEPS[currentStep].subtitle}</Text>
        </Animated.View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {renderStepContent()}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              !isStepValid() && styles.nextButtonDisabled,
              pressed && isStepValid() && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleNext}
            disabled={!isStepValid()}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === STEPS.length - 1 ? '🚀 Create Trip' : 'Continue'}
            </Text>
            {currentStep < STEPS.length - 1 && <Text style={styles.nextButtonIcon}>→</Text>}
          </Pressable>
        </View>

        {/* Date Pickers */}
        <DatePickerModal
          visible={showStartDatePicker}
          onClose={() => setShowStartDatePicker(false)}
          onSelect={(date) => setTripData({ ...tripData, startDate: date })}
          selectedDate={tripData.startDate}
          title="Select Start Date"
        />
        <DatePickerModal
          visible={showEndDatePicker}
          onClose={() => setShowEndDatePicker(false)}
          onSelect={(date) => setTripData({ ...tripData, endDate: date })}
          selectedDate={tripData.endDate}
          title="Select End Date"
          minDate={tripData.startDate}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  keyboardView: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  backButtonText: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  headerCenter: { flex: 1, alignItems: 'center' },
  stepIndicator: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  headerRight: { width: 44 },

  // Progress
  progressContainer: { paddingHorizontal: 20, marginBottom: 20 },
  progressTrack: { height: 6, backgroundColor: colors.cardLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },

  // Step Header
  stepHeader: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  stepIconBg: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: colors.primaryBorder },
  stepIcon: { fontSize: 36 },
  stepTitle: { color: colors.text, fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  stepSubtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

  // ScrollView
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  stepContent: { gap: 20 },

  // Input Section
  inputSection: { gap: 10 },
  inputLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.primaryBorder },
  inputIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  inputIcon: { fontSize: 18 },
  mainInput: { flex: 1, color: colors.text, fontSize: 16, paddingHorizontal: 12, paddingVertical: 10 },
  clearButton: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  clearButtonText: { color: colors.textMuted, fontSize: 14 },

  // Destinations
  suggestionsSection: { marginTop: 8 },
  suggestionsTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  destinationsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  destinationCard: { width: '31%', backgroundColor: colors.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  destinationCardActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryMuted },
  destinationEmoji: { fontSize: 28, marginBottom: 6 },
  destinationName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  destinationCountry: { color: colors.textMuted, fontSize: 10, marginTop: 2 },

  // Dates
  datesSection: { gap: 12 },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.primaryBorder, gap: 10 },
  dateCardEmoji: { fontSize: 20 },
  dateCardContent: { flex: 1 },
  dateCardLabel: { color: colors.textMuted, fontSize: 11 },
  dateCardValue: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 2 },
  dateCardPlaceholder: { color: colors.textMuted },
  dateArrowContainer: { paddingHorizontal: 4 },
  dateArrow: { color: colors.textMuted, fontSize: 16 },
  durationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryMuted, borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  durationIcon: { fontSize: 18 },
  durationText: { color: colors.primary, fontSize: 15, fontWeight: '600' },

  // Trip Type
  tripTypeGrid: { gap: 12 },
  tripTypeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder, borderLeftWidth: 4 },
  tripTypeCardActive: { backgroundColor: colors.primaryMuted, borderWidth: 2 },
  tripTypeIconBg: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tripTypeEmoji: { fontSize: 26 },
  tripTypeInfo: { flex: 1, marginLeft: 14 },
  tripTypeLabel: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  tripTypeDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  tripTypeCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  tripTypeCheckText: { color: colors.bg, fontSize: 14, fontWeight: 'bold' },

  // Companions
  addCompanionSection: { marginBottom: 8 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginRight: 4 },
  addBtnSmall: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: colors.bg, fontSize: 14, fontWeight: 'bold' },
  companionsList: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  companionsListTitle: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  emptyCompanions: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  emptyHint: { color: colors.textLight, fontSize: 12, marginTop: 4 },
  companionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 12, padding: 12, marginBottom: 8 },
  companionAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  companionAvatarText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  companionInfo: { flex: 1, marginLeft: 12 },
  companionName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500', marginLeft: 12 },
  companionRelation: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  removeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: colors.textMuted, fontSize: 14 },
  skipNote: { backgroundColor: colors.cardLight, borderRadius: 10, padding: 12 },
  skipNoteText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },

  // Family specific
  familyInputRow: { flexDirection: 'row', gap: 8 },
  familyInput: { flex: 1, color: colors.text, fontSize: 15, padding: 14 },
  quickRelations: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  relationChip: { backgroundColor: colors.cardLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  relationChipText: { color: colors.text, fontSize: 13 },

  // Couple specific
  coupleSection: { alignItems: 'center', paddingVertical: 20 },
  coupleIllustration: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  coupleEmoji: { fontSize: 48 },
  coupleTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  coupleSubtitle: { color: colors.textMuted, fontSize: 14, marginBottom: 24 },

  // Budget
  budgetInputSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.primaryBorder },
  budgetCurrency: { color: colors.text, fontSize: 36, fontWeight: 'bold', marginRight: 4 },
  budgetInput: { color: colors.text, fontSize: 48, fontWeight: 'bold', minWidth: 100, textAlign: 'center' },
  presetsSection: { marginTop: 8 },
  presetsTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetCard: { width: '48%', backgroundColor: colors.card, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  presetCardActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryMuted },
  presetEmoji: { fontSize: 24, marginBottom: 8 },
  presetLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  presetLabelActive: { color: colors.primary },
  presetRange: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  presetRangeActive: { color: colors.primary },

  // Summary
  summaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  summaryTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  summaryEmoji: { fontSize: 20, marginRight: 12 },
  summaryContent: { flex: 1 },
  summaryLabel: { color: colors.textMuted, fontSize: 11 },
  summaryValue: { color: colors.text, fontSize: 14, fontWeight: '500', marginTop: 2 },

  // Tip
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 12, padding: 14, gap: 12 },
  tipEmoji: { fontSize: 18 },
  tipText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },

  // Footer
  footer: { padding: 20, paddingBottom: 10 },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, gap: 8 },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { color: colors.bg, fontSize: 17, fontWeight: 'bold' },
  nextButtonIcon: { color: colors.bg, fontSize: 18, fontWeight: 'bold' },
});
