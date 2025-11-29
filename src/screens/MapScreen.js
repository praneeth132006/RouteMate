import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';

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
};

const STOP_TYPES = [
  { key: 'flight', label: 'Flight', icon: '✈️', color: '#87CEEB' },
  { key: 'hotel', label: 'Hotel', icon: '🏨', color: '#DDA0DD' },
  { key: 'attraction', label: 'Attraction', icon: '🏛️', color: '#00FF7F' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️', color: '#FFD700' },
  { key: 'activity', label: 'Activity', icon: '🎯', color: '#FF6B6B' },
  { key: 'transport', label: 'Transport', icon: '🚗', color: '#FFA500' },
];

// Helper to generate days between two dates
const generateDays = (startDate, endDate) => {
  const days = [];
  
  if (!startDate || !endDate) {
    // Default 5 days if no dates set
    for (let i = 1; i <= 5; i++) {
      days.push({
        dayNumber: i,
        dateString: `Day ${i}`,
        date: null,
      });
    }
    return days;
  }

  // Parse dates (format: "25 Dec 2024")
  const parseDate = (dateStr) => {
    const parts = dateStr.split(' ');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parseInt(parts[0]);
    const month = months.indexOf(parts[1]);
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  };

  try {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    let currentDate = new Date(start);
    let dayNumber = 1;
    
    while (currentDate <= end) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      days.push({
        dayNumber,
        dateString: `${currentDate.getDate()} ${months[currentDate.getMonth()]}`,
        dayName: dayNames[currentDate.getDay()],
        date: new Date(currentDate),
        fullDate: `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }
  } catch (e) {
    // Fallback to 5 days
    for (let i = 1; i <= 5; i++) {
      days.push({
        dayNumber: i,
        dateString: `Day ${i}`,
        date: null,
      });
    }
  }
  
  return days;
};

export default function MapScreen() {
  const { itinerary, addItineraryItem, deleteItineraryItem, tripInfo } = useTravelContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newStop, setNewStop] = useState({ 
    name: '', 
    type: 'attraction', 
    dayNumber: 1, 
    time: '', 
    notes: '', 
    location: '' 
  });
  const floatAnim = useState(new Animated.Value(0))[0];

  // Generate days based on trip dates
  const tripDays = useMemo(() => {
    return generateDays(tripInfo.startDate, tripInfo.endDate);
  }, [tripInfo.startDate, tripInfo.endDate]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const handleAddStop = () => {
    if (newStop.name.trim()) {
      addItineraryItem({ 
        ...newStop, 
        dayNumber: selectedDay?.dayNumber || 1,
        latitude: 0, 
        longitude: 0 
      });
      setNewStop({ name: '', type: 'attraction', dayNumber: 1, time: '', notes: '', location: '' });
      setModalVisible(false);
      setSelectedDay(null);
    }
  };

  const openAddModal = (day) => {
    setSelectedDay(day);
    setNewStop({ ...newStop, dayNumber: day.dayNumber });
    setModalVisible(true);
  };

  const getStopType = (key) => STOP_TYPES.find(t => t.key === key) || STOP_TYPES[2];
  
  const getStopsForDay = (dayNumber) => {
    return itinerary
      .filter(stop => stop.dayNumber === dayNumber)
      .sort((a, b) => {
        if (!a.time || !b.time) return 0;
        return a.time.localeCompare(b.time);
      });
  };

  const totalStops = itinerary.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Itinerary</Text>
            <Text style={styles.subtitle}>
              {tripDays.length} days • {totalStops} stops
            </Text>
          </View>
        </View>

        {/* Trip Date Range */}
        {tripInfo.startDate && tripInfo.endDate && (
          <View style={styles.dateRangeCard}>
            <View style={styles.dateRangeItem}>
              <Text style={styles.dateRangeLabel}>START</Text>
              <Text style={styles.dateRangeValue}>{tripInfo.startDate}</Text>
            </View>
            <View style={styles.dateRangeDivider}>
              <Text style={styles.dateRangeArrow}>→</Text>
            </View>
            <View style={styles.dateRangeItem}>
              <Text style={styles.dateRangeLabel}>END</Text>
              <Text style={styles.dateRangeValue}>{tripInfo.endDate}</Text>
            </View>
          </View>
        )}

        {/* Hero when no stops */}
        {totalStops === 0 && (
          <Animated.View style={[styles.heroContainer, { transform: [{ translateY: floatTranslate }] }]}>
            <View style={styles.heroGlobe}>
              <Text style={styles.heroEmoji}>🗺️</Text>
              <View style={styles.heroRing} />
            </View>
            <View style={styles.heroPlane}><Text style={styles.planeEmoji}>✈️</Text></View>
            <View style={styles.heroPin}><Text style={styles.pinEmoji}>📍</Text></View>
          </Animated.View>
        )}

        {/* Timeline */}
        <View style={styles.timeline}>
          {tripDays.map((day, dayIndex) => {
            const dayStops = getStopsForDay(day.dayNumber);
            const hasStops = dayStops.length > 0;
            const isLastDay = dayIndex === tripDays.length - 1;
            
            return (
              <View key={day.dayNumber} style={styles.dayContainer}>
                {/* Center Timeline with Day Marker */}
                <View style={styles.centerTimeline}>
                  {/* Top Line */}
                  {dayIndex > 0 && <View style={styles.timelineLineTop} />}
                  
                  {/* Day Circle */}
                  <View style={[styles.dayCircle, hasStops && styles.dayCircleActive]}>
                    <Text style={[styles.dayCircleNumber, hasStops && styles.dayCircleNumberActive]}>
                      {day.dayNumber}
                    </Text>
                  </View>
                  
                  {/* Bottom Line */}
                  {!isLastDay && <View style={styles.timelineLineBottom} />}
                </View>

                {/* Day Content */}
                <View style={styles.dayContentWrapper}>
                  {/* Day Header */}
                  <View style={styles.dayHeader}>
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayTitle}>Day {day.dayNumber}</Text>
                      {day.dateString && (
                        <Text style={styles.dayDate}>
                          {day.dayName ? `${day.dayName}, ` : ''}{day.dateString}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.addDayButton}
                      onPress={() => openAddModal(day)}
                    >
                      <Text style={styles.addDayButtonText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Stops List */}
                  {dayStops.length === 0 ? (
                    <TouchableOpacity 
                      style={styles.emptyDayCard}
                      onPress={() => openAddModal(day)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emptyDayText}>Tap to add activities</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.stopsContainer}>
                      {dayStops.map((stop, stopIndex) => {
                        const type = getStopType(stop.type);
                        return (
                          <View key={stop.id} style={styles.stopCard}>
                            <View style={[styles.stopIconBg, { backgroundColor: type.color + '20' }]}>
                              <Text style={styles.stopIcon}>{type.icon}</Text>
                            </View>
                            <View style={styles.stopContent}>
                              <View style={styles.stopHeader}>
                                <Text style={styles.stopName}>{stop.name}</Text>
                                <TouchableOpacity 
                                  onPress={() => deleteItineraryItem(stop.id)}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <Text style={styles.deleteBtn}>×</Text>
                                </TouchableOpacity>
                              </View>
                              <View style={styles.stopMeta}>
                                <View style={[styles.typeBadge, { backgroundColor: type.color + '15' }]}>
                                  <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
                                </View>
                                {stop.time && <Text style={styles.stopTime}>⏰ {stop.time}</Text>}
                              </View>
                              {stop.location && (
                                <View style={styles.stopLocation}>
                                  <Text style={styles.locationText}>📍 {stop.location}</Text>
                                </View>
                              )}
                              {stop.notes && <Text style={styles.stopNotes}>{stop.notes}</Text>}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Stop Modal */}
      <Modal 
        animationType="slide" 
        transparent 
        visible={modalVisible} 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Event</Text>
                {selectedDay && (
                  <Text style={styles.modalSubtitle}>
                    Day {selectedDay.dayNumber} {selectedDay.dateString ? `• ${selectedDay.dateString}` : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Event name *"
                placeholderTextColor={COLORS.textMuted}
                value={newStop.name}
                onChangeText={(t) => setNewStop({...newStop, name: t})}
              />

              <TextInput
                style={styles.input}
                placeholder="📍 Location"
                placeholderTextColor={COLORS.textMuted}
                value={newStop.location}
                onChangeText={(t) => setNewStop({...newStop, location: t})}
              />

              <TextInput
                style={styles.input}
                placeholder="⏰ Time (e.g., 10:00 AM)"
                placeholderTextColor={COLORS.textMuted}
                value={newStop.time}
                onChangeText={(t) => setNewStop({...newStop, time: t})}
              />

              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeGrid}>
                {STOP_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeChip,
                      newStop.type === type.key && { backgroundColor: type.color, borderColor: type.color }
                    ]}
                    onPress={() => setNewStop({...newStop, type: type.key})}
                  >
                    <Text style={styles.typeChipIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.typeChipText,
                      newStop.type === type.key && { color: COLORS.bg }
                    ]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={newStop.notes}
                onChangeText={(t) => setNewStop({...newStop, notes: t})}
                multiline
              />

              <TouchableOpacity 
                style={[styles.submitButton, !newStop.name.trim() && styles.submitButtonDisabled]} 
                onPress={handleAddStop}
                disabled={!newStop.name.trim()}
              >
                <Text style={styles.submitButtonText}>Add to Day {selectedDay?.dayNumber}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },
  title: { color: COLORS.text, fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },

  // Date Range Card
  dateRangeCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginBottom: 20,
  },
  dateRangeItem: { flex: 1 },
  dateRangeLabel: { color: COLORS.green, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dateRangeValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginTop: 4 },
  dateRangeDivider: { paddingHorizontal: 16 },
  dateRangeArrow: { color: COLORS.green, fontSize: 20 },

  // Hero
  heroContainer: { alignItems: 'center', marginVertical: 20 },
  heroGlobe: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 40 },
  heroRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: COLORS.greenBorder },
  heroPlane: { position: 'absolute', top: 0, right: width * 0.28 },
  planeEmoji: { fontSize: 20 },
  heroPin: { position: 'absolute', bottom: 5, left: width * 0.3 },
  pinEmoji: { fontSize: 18 },

  // Timeline
  timeline: { paddingHorizontal: 20 },
  dayContainer: { flexDirection: 'row', minHeight: 100 },

  // Center Timeline
  centerTimeline: { width: 50, alignItems: 'center' },
  timelineLineTop: { width: 2, height: 20, backgroundColor: COLORS.greenBorder },
  timelineLineBottom: { width: 2, flex: 1, backgroundColor: COLORS.greenBorder, marginTop: 8 },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  dayCircleNumber: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  dayCircleNumberActive: { color: COLORS.bg },

  // Day Content
  dayContentWrapper: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dayInfo: {},
  dayTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  dayDate: { color: COLORS.green, fontSize: 13, marginTop: 2 },
  addDayButton: {
    backgroundColor: COLORS.greenMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  addDayButtonText: { color: COLORS.green, fontSize: 13, fontWeight: '600' },

  // Empty Day
  emptyDayCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    borderStyle: 'dashed',
  },
  emptyDayText: { color: COLORS.textMuted, fontSize: 14 },

  // Stops
  stopsContainer: { gap: 10 },
  stopCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  stopIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: { fontSize: 20 },
  stopContent: { flex: 1, marginLeft: 12 },
  stopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stopName: { color: COLORS.text, fontSize: 15, fontWeight: '600', flex: 1 },
  deleteBtn: { color: COLORS.textMuted, fontSize: 22, marginLeft: 8 },
  stopMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  stopTime: { color: COLORS.textMuted, fontSize: 12 },
  stopLocation: { marginTop: 8 },
  locationText: { color: COLORS.textMuted, fontSize: 12 },
  stopNotes: { color: COLORS.textMuted, fontSize: 13, marginTop: 8, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  modalSubtitle: { color: COLORS.green, fontSize: 14, marginTop: 4 },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: COLORS.textMuted, fontSize: 28 },

  input: {
    backgroundColor: COLORS.cardLight,
    color: COLORS.text,
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginBottom: 12,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  inputLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 10, marginTop: 4 },
  
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  typeChipIcon: { fontSize: 14, marginRight: 6 },
  typeChipText: { color: COLORS.text, fontSize: 12 },

  submitButton: {
    backgroundColor: COLORS.green,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: COLORS.bg, fontSize: 17, fontWeight: 'bold' },
});
