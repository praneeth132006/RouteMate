import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, Text, ScrollView, TextInput, TouchableOpacity, 
  Modal, StyleSheet, Animated, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const STOP_TYPES = [
  { key: 'flight', label: 'Flight', icon: '✈️', color: '#87CEEB' },
  { key: 'hotel', label: 'Hotel', icon: '🏨', color: '#DDA0DD' },
  { key: 'attraction', label: 'Attraction', icon: '🏛️', color: '#00FF7F' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️', color: '#FFD700' },
  { key: 'activity', label: 'Activity', icon: '🎯', color: '#FF6B6B' },
  { key: 'transport', label: 'Transport', icon: '🚗', color: '#FFA500' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️', color: '#FF69B4' },
  { key: 'photo', label: 'Photo Spot', icon: '📸', color: '#00CED1' },
];

// Helper to generate days between two dates
const generateDays = (startDate, endDate) => {
  const days = [];
  
  if (!startDate || !endDate) {
    for (let i = 1; i <= 5; i++) {
      days.push({ dayNumber: i, dateString: `Day ${i}`, date: null });
    }
    return days;
  }

  const parseDate = (dateStr) => {
    const parts = dateStr.split(' ');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return new Date(parseInt(parts[2]), months.indexOf(parts[1]), parseInt(parts[0]));
  };

  try {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    let currentDate = new Date(start);
    let dayNumber = 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    while (currentDate <= end) {
      days.push({
        dayNumber,
        dateString: `${currentDate.getDate()} ${months[currentDate.getMonth()]}`,
        dayName: dayNames[currentDate.getDay()],
        shortDay: dayNames[currentDate.getDay()].slice(0, 3),
        date: new Date(currentDate),
        fullDate: `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
      });
      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }
  } catch (e) {
    for (let i = 1; i <= 5; i++) {
      days.push({ dayNumber: i, dateString: `Day ${i}`, date: null });
    }
  }
  
  return days;
};

export default function MapScreen() {
  const { itinerary, addItineraryItem, deleteItineraryItem, tripInfo } = useTravelContext();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [newStop, setNewStop] = useState({ 
    name: '', type: 'attraction', dayNumber: 1, time: '', notes: '', location: '' 
  });
  
  const scrollViewRef = useRef(null);
  const floatAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  const tripDays = useMemo(() => generateDays(tripInfo.startDate, tripInfo.endDate), [tripInfo.startDate, tripInfo.endDate]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatTranslate = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  const handleAddStop = () => {
    if (newStop.name.trim()) {
      addItineraryItem({ ...newStop, dayNumber: selectedDay?.dayNumber || 1, latitude: 0, longitude: 0 });
      setNewStop({ name: '', type: 'attraction', dayNumber: 1, time: '', notes: '', location: '' });
      setModalVisible(false);
      setSelectedDay(null);
    }
  };

  const openAddModal = (day) => { setSelectedDay(day); setNewStop({ ...newStop, dayNumber: day.dayNumber }); setModalVisible(true); };
  const getStopType = (key) => STOP_TYPES.find(t => t.key === key) || STOP_TYPES[2];
  const getStopsForDay = (dayNumber) => itinerary.filter(s => s.dayNumber === dayNumber).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const totalStops = itinerary.length;

  // Dynamic styles based on theme
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Itinerary</Text>
          <View style={styles.headerStats}>
            <View style={styles.statBadge}><Text style={styles.statIcon}>📅</Text><Text style={styles.statText}>{tripDays.length} Days</Text></View>
            <View style={styles.statBadge}><Text style={styles.statIcon}>📍</Text><Text style={styles.statText}>{totalStops} Stops</Text></View>
          </View>
        </View>
      </View>

      {/* Day Selector */}
      <View style={styles.daySelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorScroll}>
          {tripDays.map((day) => {
            const isActive = activeDay === day.dayNumber;
            const hasStops = getStopsForDay(day.dayNumber).length > 0;
            return (
              <TouchableOpacity key={day.dayNumber} style={[styles.dayPill, isActive && styles.dayPillActive]} onPress={() => setActiveDay(day.dayNumber)}>
                <Text style={[styles.dayPillNumber, isActive && styles.dayPillNumberActive]}>{day.dayNumber}</Text>
                <Text style={[styles.dayPillLabel, isActive && styles.dayPillLabelActive]}>{day.shortDay || 'Day'}</Text>
                {hasStops && <View style={[styles.dayPillDot, isActive && styles.dayPillDotActive]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} style={styles.mainScroll}>
        {/* Trip Overview Card */}
        {tripInfo.startDate && tripInfo.endDate && (
          <View style={styles.overviewCard}>
            <View style={styles.overviewGlow} />
            <View style={styles.overviewContent}>
              <View style={styles.overviewIcon}><Animated.Text style={[styles.overviewEmoji, { transform: [{ translateY: floatTranslate }] }]}>🌍</Animated.Text></View>
              <View style={styles.overviewInfo}>
                <Text style={styles.overviewDestination}>{tripInfo.destination || 'Your Trip'}</Text>
                <Text style={styles.overviewDates}>{tripInfo.startDate} → {tripInfo.endDate}</Text>
              </View>
            </View>
            <View style={styles.overviewProgress}>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min((totalStops / (tripDays.length * 3)) * 100, 100)}%` }]} /></View>
              <Text style={styles.progressText}>{totalStops} activities planned</Text>
            </View>
          </View>
        )}

        {/* Hero when no stops */}
        {totalStops === 0 && (
          <View style={styles.emptyHero}>
            <Animated.View style={[styles.emptyHeroContent, { transform: [{ translateY: floatTranslate }] }]}>
              <View style={styles.emptyHeroGlobe}><Text style={styles.emptyHeroEmoji}>🗺️</Text><Animated.View style={[styles.emptyHeroRing, { transform: [{ scale: pulseAnim }] }]} /><View style={styles.emptyHeroRing2} /></View>
            </Animated.View>
            <Text style={styles.emptyHeroTitle}>Plan Your Adventure</Text>
            <Text style={styles.emptyHeroText}>Add activities to each day of your trip</Text>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timeline}>
          {tripDays.map((day, dayIndex) => {
            const dayStops = getStopsForDay(day.dayNumber);
            const hasStops = dayStops.length > 0;
            const isLastDay = dayIndex === tripDays.length - 1;
            
            return (
              <View key={day.dayNumber} style={styles.daySection}>
                {/* Day Header Card */}
                <View style={styles.dayCard}>
                  <View style={styles.dayCardLeft}>
                    <View style={[styles.dayBadge, hasStops && styles.dayBadgeActive]}><Text style={[styles.dayBadgeText, hasStops && styles.dayBadgeTextActive]}>{day.dayNumber}</Text></View>
                    {!isLastDay && <View style={styles.dayConnector} />}
                  </View>
                  
                  <View style={styles.dayCardContent}>
                    <View style={styles.dayCardHeader}>
                      <View>
                        <Text style={styles.dayCardTitle}>Day {day.dayNumber}</Text>
                        <Text style={styles.dayCardDate}>
                          {day.dayName ? `${day.dayName}, ${day.dateString}` : day.dateString}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.addButton} onPress={() => openAddModal(day)}>
                        <Text style={styles.addButtonIcon}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Stops */}
                    {dayStops.length === 0 ? (
                      <TouchableOpacity style={styles.emptyCard} onPress={() => openAddModal(day)}>
                        <View style={styles.emptyCardIcon}>
                          <Text style={styles.emptyCardEmoji}>✨</Text>
                        </View>
                        <View style={styles.emptyCardText}>
                          <Text style={styles.emptyCardTitle}>No activities yet</Text>
                          <Text style={styles.emptyCardSubtitle}>Tap to add your first activity</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stopsTimeline}>
                        {dayStops.map((stop, stopIndex) => {
                          const type = getStopType(stop.type);
                          const isLast = stopIndex === dayStops.length - 1;
                          
                          return (
                            <View key={stop.id} style={styles.stopWrapper}>
                              {/* Time indicator */}
                              <View style={styles.stopTimeContainer}>
                                <Text style={styles.stopTimeText}>{stop.time || '--:--'}</Text>
                                {!isLast && <View style={styles.stopTimeLine} />}
                              </View>
                              
                              {/* Stop Card */}
                              <View style={[styles.stopCard, { borderLeftColor: type.color }]}>
                                <View style={styles.stopCardHeader}>
                                  <View style={[styles.stopIconContainer, { backgroundColor: type.color + '20' }]}>
                                    <Text style={styles.stopIconEmoji}>{type.icon}</Text>
                                  </View>
                                  <View style={styles.stopCardInfo}>
                                    <Text style={styles.stopCardName}>{stop.name}</Text>
                                    <View style={styles.stopCardMeta}>
                                      <View style={[styles.stopTypeBadge, { backgroundColor: type.color + '15' }]}>
                                        <Text style={[styles.stopTypeBadgeText, { color: type.color }]}>{type.label}</Text>
                                      </View>
                                    </View>
                                  </View>
                                  <TouchableOpacity 
                                    style={styles.stopDeleteBtn}
                                    onPress={() => deleteItineraryItem(stop.id)}
                                  >
                                    <Text style={styles.stopDeleteIcon}>×</Text>
                                  </TouchableOpacity>
                                </View>
                                
                                {stop.location && (
                                  <View style={styles.stopDetailRow}>
                                    <Text style={styles.stopDetailIcon}>📍</Text>
                                    <Text style={styles.stopDetailText}>{stop.location}</Text>
                                  </View>
                                )}
                                
                                {stop.notes && (
                                  <View style={styles.stopNotesContainer}>
                                    <Text style={styles.stopNotes}>{stop.notes}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => openAddModal(tripDays.find(d => d.dayNumber === activeDay) || tripDays[0])}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Add</Text>
      </TouchableOpacity>

      {/* Add Stop Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalTitle}>New Activity</Text>
                {selectedDay && (
                  <View style={styles.modalDayBadge}>
                    <Text style={styles.modalDayText}>Day {selectedDay.dayNumber}</Text>
                    {selectedDay.dateString && <Text style={styles.modalDateText}>{selectedDay.dateString}</Text>}
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Activity Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Visit Eiffel Tower"
                  placeholderTextColor={colors.textMuted}
                  value={newStop.name}
                  onChangeText={(t) => setNewStop({...newStop, name: t})}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10:00 AM"
                    placeholderTextColor={colors.textMuted}
                    value={newStop.time}
                    onChangeText={(t) => setNewStop({...newStop, time: t})}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Address or place"
                    placeholderTextColor={colors.textMuted}
                    value={newStop.location}
                    onChangeText={(t) => setNewStop({...newStop, location: t})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.typeGrid}>
                  {STOP_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.key}
                      style={[styles.typeChip, newStop.type === type.key && { backgroundColor: type.color, borderColor: type.color }]}
                      onPress={() => setNewStop({...newStop, type: type.key})}
                    >
                      <Text style={styles.typeChipIcon}>{type.icon}</Text>
                      <Text style={[styles.typeChipText, newStop.type === type.key && { color: colors.bg }]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Any additional details..."
                  placeholderTextColor={colors.textMuted}
                  value={newStop.notes}
                  onChangeText={(t) => setNewStop({...newStop, notes: t})}
                  multiline
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, !newStop.name.trim() && styles.submitButtonDisabled]} 
                onPress={handleAddStop}
                disabled={!newStop.name.trim()}
              >
                <Text style={styles.submitButtonText}>Add Activity</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerLeft: {},
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  headerStats: { flexDirection: 'row', marginTop: 8, gap: 12 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primaryBorder },
  statIcon: { fontSize: 12, marginRight: 6 },
  statText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  daySelectorContainer: { marginBottom: 16 },
  daySelectorScroll: { paddingHorizontal: 20, gap: 10 },
  dayPill: { alignItems: 'center', backgroundColor: colors.card, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.primaryBorder, minWidth: 56 },
  dayPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayPillNumber: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  dayPillNumberActive: { color: colors.bg },
  dayPillLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  dayPillLabelActive: { color: colors.bg },
  dayPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 4 },
  dayPillDotActive: { backgroundColor: colors.bg },
  mainScroll: { flex: 1 },
  overviewCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder, overflow: 'hidden' },
  overviewGlow: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: colors.primary, opacity: 0.08, borderRadius: 60 },
  overviewContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  overviewIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  overviewEmoji: { fontSize: 26 },
  overviewInfo: { flex: 1, marginLeft: 14 },
  overviewDestination: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  overviewDates: { color: colors.primary, fontSize: 13, marginTop: 4 },
  overviewProgress: {},
  progressBar: { height: 6, backgroundColor: colors.cardLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { color: colors.textMuted, fontSize: 11, marginTop: 8, textAlign: 'center' },
  emptyHero: { alignItems: 'center', paddingVertical: 30 },
  emptyHeroContent: { marginBottom: 20 },
  emptyHeroGlobe: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  emptyHeroEmoji: { fontSize: 50, zIndex: 2 },
  emptyHeroRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.primary, opacity: 0.4 },
  emptyHeroRing2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: colors.primaryBorder, opacity: 0.3 },
  emptyHeroTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  emptyHeroText: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
  timeline: { paddingHorizontal: 20 },
  daySection: { marginBottom: 8 },
  dayCard: { flexDirection: 'row' },
  dayCardLeft: { alignItems: 'center', width: 44 },
  dayBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  dayBadgeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayBadgeText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  dayBadgeTextActive: { color: colors.bg },
  dayConnector: { width: 2, flex: 1, backgroundColor: colors.primaryBorder, marginVertical: 6 },
  dayCardContent: { flex: 1, marginLeft: 14, paddingBottom: 20 },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dayCardTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  dayCardDate: { color: colors.primary, fontSize: 13, marginTop: 2 },
  addButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  addButtonIcon: { color: colors.primary, fontSize: 22, marginTop: -1 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder, borderStyle: 'dashed' },
  emptyCardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  emptyCardEmoji: { fontSize: 20 },
  emptyCardText: { marginLeft: 14 },
  emptyCardTitle: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  emptyCardSubtitle: { color: colors.textLight, fontSize: 12, marginTop: 2 },
  stopsTimeline: { gap: 12 },
  stopWrapper: { flexDirection: 'row' },
  stopTimeContainer: { width: 50, alignItems: 'center' },
  stopTimeText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  stopTimeLine: { width: 1, flex: 1, backgroundColor: colors.primaryBorder, marginTop: 6, marginBottom: -6 },
  stopCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.primaryBorder, borderLeftWidth: 3, marginLeft: 8 },
  stopCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  stopIconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stopIconEmoji: { fontSize: 18 },
  stopCardInfo: { flex: 1, marginLeft: 12 },
  stopCardName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  stopCardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  stopTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stopTypeBadgeText: { fontSize: 11, fontWeight: '600' },
  stopDeleteBtn: { padding: 4 },
  stopDeleteIcon: { color: colors.textMuted, fontSize: 20 },
  stopDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stopDetailIcon: { fontSize: 12, marginRight: 6 },
  stopDetailText: { color: colors.textMuted, fontSize: 12, flex: 1 },
  stopNotesContainer: { marginTop: 10, backgroundColor: colors.cardLight, padding: 10, borderRadius: 8 },
  stopNotes: { color: colors.textLight, fontSize: 12, lineHeight: 18 },
  fab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabIcon: { color: colors.bg, fontSize: 20, fontWeight: 'bold', marginRight: 6 },
  fabText: { color: colors.bg, fontSize: 15, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalHeaderInfo: {},
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  modalDayBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  modalDayText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  modalDateText: { color: colors.textMuted, fontSize: 14 },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardLight, borderRadius: 10 },
  modalCloseText: { color: colors.textMuted, fontSize: 22 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  inputRow: { flexDirection: 'row' },
  input: { backgroundColor: colors.cardLight, color: colors.text, padding: 16, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: colors.primaryBorder },
  notesInput: { height: 80, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  typeChipIcon: { fontSize: 14, marginRight: 6 },
  typeChipText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  submitButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.bg, fontSize: 17, fontWeight: 'bold' },
});
