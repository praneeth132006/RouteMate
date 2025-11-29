import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Dimensions, Animated, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DatePickerModal from '../components/DatePickerModal';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#000000',
  card: '#0A0A0A',
  cardLight: '#111111',
  green: '#00FF7F',
  greenMuted: 'rgba(0, 255, 127, 0.1)',
  greenBorder: 'rgba(0, 255, 127, 0.3)',
  text: '#FFFFFF',
  textMuted: '#666666',
  red: '#FF4444',
};

const STEPS = [
  { id: 1, title: 'Trip Name', subtitle: 'Give your adventure a name', icon: '🏷️' },
  { id: 2, title: 'Travel Dates', subtitle: 'When are you traveling?', icon: '📅' },
  { id: 3, title: 'Participants', subtitle: 'Who\'s joining the trip?', icon: '👥' },
  { id: 4, title: 'Budget', subtitle: 'Set your travel budget', icon: '💰' },
];

export default function TripSetupScreen({ onComplete, onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tripData, setTripData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    participants: [],
    budget: '',
  });
  const [newParticipant, setNewParticipant] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Animations
  const slideAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(1))[0];
  const floatAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const animateTransition = (direction) => {
    const toValue = direction === 'next' ? -width : width;
    
    Animated.parallel([
      Animated.timing(slideAnim, { toValue, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(-toValue);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      animateTransition('next');
      setTimeout(() => setCurrentStep(currentStep + 1), 200);
    } else {
      onComplete(tripData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      animateTransition('back');
      setTimeout(() => setCurrentStep(currentStep - 1), 200);
    } else {
      onBack();
    }
  };

  const addParticipant = () => {
    if (newParticipant.trim()) {
      setTripData({
        ...tripData,
        participants: [...tripData.participants, { id: Date.now(), name: newParticipant.trim() }]
      });
      setNewParticipant('');
    }
  };

  const removeParticipant = (id) => {
    setTripData({
      ...tripData,
      participants: tripData.participants.filter(p => p.id !== id)
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return tripData.name.trim() && tripData.destination.trim();
      case 2: return tripData.startDate.trim() && tripData.endDate.trim();
      case 3: return true; // Participants optional
      case 4: return tripData.budget.trim();
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            {/* 3D Illustration */}
            <Animated.View style={[styles.illustration, { transform: [{ translateY: floatTranslate }] }]}>
              <View style={styles.illustrationBg}>
                <Text style={styles.illustrationEmoji}>🌴</Text>
              </View>
              <View style={styles.floatingElement1}>
                <Text style={styles.floatingEmoji}>✈️</Text>
              </View>
              <View style={styles.floatingElement2}>
                <Text style={styles.floatingEmoji}>🏝️</Text>
              </View>
            </Animated.View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TRIP NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Summer Europe Adventure"
                placeholderTextColor={COLORS.textMuted}
                value={tripData.name}
                onChangeText={(text) => setTripData({ ...tripData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DESTINATION</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Paris, France"
                placeholderTextColor={COLORS.textMuted}
                value={tripData.destination}
                onChangeText={(text) => setTripData({ ...tripData, destination: text })}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Animated.View style={[styles.illustration, { transform: [{ translateY: floatTranslate }] }]}>
              <View style={styles.calendarIllustration}>
                <View style={styles.calendarTop}>
                  <View style={styles.calendarRing} />
                  <View style={styles.calendarRing} />
                </View>
                <View style={styles.calendarBody}>
                  <Text style={styles.calendarEmoji}>📅</Text>
                </View>
              </View>
            </Animated.View>

            <View style={styles.dateContainer}>
              {/* Start Date */}
              <TouchableOpacity 
                style={styles.dateCard}
                onPress={() => setShowStartDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dateIcon}>🛫</Text>
                <Text style={styles.dateLabel}>START DATE</Text>
                <Text style={styles.dateValue}>
                  {tripData.startDate || 'Tap to select'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dateArrowContainer}>
                <View style={styles.dateArrowLine} />
                <View style={styles.dateArrowCircle}>
                  <Text style={styles.dateArrowText}>→</Text>
                </View>
                <View style={styles.dateArrowLine} />
              </View>

              {/* End Date */}
              <TouchableOpacity 
                style={styles.dateCard}
                onPress={() => setShowEndDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dateIcon}>🛬</Text>
                <Text style={styles.dateLabel}>END DATE</Text>
                <Text style={styles.dateValue}>
                  {tripData.endDate || 'Tap to select'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Pickers */}
            <DatePickerModal
              visible={showStartDatePicker}
              onClose={() => setShowStartDatePicker(false)}
              onSelect={(date) => setTripData({ ...tripData, startDate: date })}
              selectedDate={tripData.startDate}
              title="Start Date"
            />
            <DatePickerModal
              visible={showEndDatePicker}
              onClose={() => setShowEndDatePicker(false)}
              onSelect={(date) => setTripData({ ...tripData, endDate: date })}
              selectedDate={tripData.endDate}
              title="End Date"
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Animated.View style={[styles.illustration, { transform: [{ translateY: floatTranslate }] }]}>
              <View style={styles.participantsIllustration}>
                <View style={styles.personCircle}>
                  <Text style={styles.personEmoji}>👤</Text>
                </View>
                <View style={[styles.personCircle, styles.personCircle2]}>
                  <Text style={styles.personEmoji}>👤</Text>
                </View>
                <View style={[styles.personCircle, styles.personCircle3]}>
                  <Text style={styles.personEmoji}>👤</Text>
                </View>
              </View>
            </Animated.View>

            <View style={styles.addParticipantContainer}>
              <TextInput
                style={styles.participantInput}
                placeholder="Enter name"
                placeholderTextColor={COLORS.textMuted}
                value={newParticipant}
                onChangeText={setNewParticipant}
                onSubmitEditing={addParticipant}
              />
              <TouchableOpacity style={styles.addButton} onPress={addParticipant}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.participantsList} showsVerticalScrollIndicator={false}>
              <View style={styles.participantCard}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.avatarEmoji}>👑</Text>
                </View>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>You</Text>
                  <Text style={styles.participantRole}>Organizer</Text>
                </View>
              </View>

              {tripData.participants.map((participant) => (
                <View key={participant.id} style={styles.participantCard}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.avatarEmoji}>👤</Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantRole}>Participant</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeParticipant(participant.id)}>
                    <Text style={styles.removeButton}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {tripData.participants.length === 0 && (
                <View style={styles.emptyParticipants}>
                  <Text style={styles.emptyText}>Add friends to share your trip!</Text>
                </View>
              )}
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Animated.View style={[styles.illustration, { transform: [{ translateY: floatTranslate }] }]}>
              <View style={styles.budgetIllustration}>
                <View style={styles.coinStack}>
                  <Text style={styles.coinEmoji}>💰</Text>
                  <Text style={styles.coinEmoji}>💵</Text>
                  <Text style={styles.coinEmoji}>💳</Text>
                </View>
              </View>
            </Animated.View>

            <View style={styles.budgetContainer}>
              <Text style={styles.budgetLabel}>TOTAL TRIP BUDGET</Text>
              <View style={styles.budgetInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.budgetInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={tripData.budget}
                  onChangeText={(text) => setTripData({ ...tripData, budget: text })}
                />
              </View>
              <Text style={styles.budgetHint}>You can adjust this later</Text>
            </View>

            {/* Budget suggestions */}
            <View style={styles.budgetSuggestions}>
              {['500', '1000', '2000', '5000'].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.suggestionChip, tripData.budget === amount && styles.suggestionChipActive]}
                  onPress={() => setTripData({ ...tripData, budget: amount })}
                >
                  <Text style={[styles.suggestionText, tripData.budget === amount && styles.suggestionTextActive]}>
                    ${amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            {STEPS.map((step, index) => (
              <View key={step.id} style={styles.progressItem}>
                <View style={[
                  styles.progressDot,
                  currentStep >= step.id && styles.progressDotActive,
                  currentStep === step.id && styles.progressDotCurrent
                ]}>
                  {currentStep > step.id && <Text style={styles.checkmark}>✓</Text>}
                </View>
                {index < STEPS.length - 1 && (
                  <View style={[styles.progressLine, currentStep > step.id && styles.progressLineActive]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Step Title */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepIcon}>{STEPS[currentStep - 1].icon}</Text>
          <Text style={styles.stepTitle}>{STEPS[currentStep - 1].title}</Text>
          <Text style={styles.stepSubtitle}>{STEPS[currentStep - 1].subtitle}</Text>
        </View>

        {/* Content */}
        <Animated.View style={[
          styles.contentContainer,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
        ]}>
          {renderStepContent()}
        </Animated.View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, !isStepValid() && styles.navButtonDisabled]}
            onPress={handleNext}
            disabled={!isStepValid()}
          >
            <Text style={styles.navButtonText}>
              {currentStep === STEPS.length ? 'Start Trip 🚀' : 'Continue'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Step {currentStep} of {STEPS.length}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  backButtonText: {
    color: COLORS.green,
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  progressDotCurrent: {
    borderWidth: 3,
    borderColor: COLORS.green,
    backgroundColor: COLORS.bg,
  },
  checkmark: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.greenBorder,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: COLORS.green,
  },
  stepHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stepIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 30,
  },
  illustrationBg: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.greenBorder,
  },
  illustrationEmoji: {
    fontSize: 50,
  },
  floatingElement1: {
    position: 'absolute',
    top: -10,
    right: width * 0.25,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  floatingElement2: {
    position: 'absolute',
    bottom: 0,
    left: width * 0.25,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  floatingEmoji: {
    fontSize: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  calendarIllustration: {
    alignItems: 'center',
  },
  calendarTop: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: -10,
    zIndex: 1,
  },
  calendarRing: {
    width: 12,
    height: 20,
    backgroundColor: COLORS.green,
    borderRadius: 6,
  },
  calendarBody: {
    width: 100,
    height: 90,
    backgroundColor: COLORS.greenMuted,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.greenBorder,
  },
  calendarEmoji: {
    fontSize: 40,
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.greenBorder,
  },
  dateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  dateLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  dateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dateArrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateArrowLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.greenBorder,
  },
  dateArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  dateArrowText: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantsIllustration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  personCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.green,
    zIndex: 3,
  },
  personCircle2: {
    marginLeft: -20,
    zIndex: 2,
    opacity: 0.8,
  },
  personCircle3: {
    marginLeft: -20,
    zIndex: 1,
    opacity: 0.6,
  },
  personEmoji: {
    fontSize: 28,
  },
  addParticipantContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  participantInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: COLORS.bg,
    fontSize: 28,
    fontWeight: 'bold',
  },
  participantsList: {
    flex: 1,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  participantAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 14,
  },
  participantName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  participantRole: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    color: COLORS.red,
    fontSize: 28,
    paddingHorizontal: 10,
  },
  emptyParticipants: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  budgetIllustration: {
    alignItems: 'center',
  },
  coinStack: {
    flexDirection: 'row',
    gap: 10,
  },
  coinEmoji: {
    fontSize: 40,
  },
  budgetContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  budgetLabel: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  currencySymbol: {
    color: COLORS.green,
    fontSize: 40,
    fontWeight: 'bold',
    marginRight: 8,
  },
  budgetInput: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 120,
    textAlign: 'center',
  },
  budgetHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  budgetSuggestions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  suggestionChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  suggestionChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  suggestionText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionTextActive: {
    color: COLORS.bg,
  },
  navigation: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  navButton: {
    backgroundColor: COLORS.green,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    color: COLORS.bg,
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepIndicator: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});
