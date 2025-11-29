import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
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
};

const STOP_TYPES = [
  { key: 'flight', label: 'Flight', icon: '✈️', color: '#87CEEB' },
  { key: 'hotel', label: 'Hotel', icon: '🏨', color: '#DDA0DD' },
  { key: 'attraction', label: 'Attraction', icon: '🏛️', color: '#00FF7F' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️', color: '#FFD700' },
  { key: 'activity', label: 'Activity', icon: '🎯', color: '#FF6B6B' },
  { key: 'transport', label: 'Transport', icon: '🚗', color: '#FFA500' },
];

export default function MapScreen() {
  const { itinerary, addItineraryItem, deleteItineraryItem } = useTravelContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newStop, setNewStop] = useState({ name: '', type: 'attraction', date: '', time: '', notes: '', location: '' });
  const floatAnim = useState(new Animated.Value(0))[0];

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
      addItineraryItem({ ...newStop, latitude: 0, longitude: 0 });
      setNewStop({ name: '', type: 'attraction', date: '', time: '', notes: '', location: '' });
      setModalVisible(false);
    }
  };

  const getStopType = (key) => STOP_TYPES.find(t => t.key === key) || STOP_TYPES[2];

  // Group itinerary by date
  const groupedItinerary = itinerary.reduce((acc, stop) => {
    const date = stop.date || 'Unscheduled';
    if (!acc[date]) acc[date] = [];
    acc[date].push(stop);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedItinerary).sort((a, b) => {
    if (a === 'Unscheduled') return 1;
    if (b === 'Unscheduled') return -1;
    return a.localeCompare(b);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Itinerary</Text>
            <Text style={styles.subtitle}>{itinerary.length} stops planned</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Illustration */}
        {itinerary.length === 0 && (
          <Animated.View style={[styles.heroContainer, { transform: [{ translateY: floatTranslate }] }]}>
            <View style={styles.heroGlobe}>
              <Text style={styles.heroEmoji}>🌍</Text>
              <View style={styles.heroRing} />
              <View style={styles.heroRing2} />
            </View>
            <View style={styles.heroPlane}>
              <Text style={styles.planeEmoji}>✈️</Text>
            </View>
            <View style={styles.heroPin}>
              <Text style={styles.pinEmoji}>📍</Text>
            </View>
          </Animated.View>
        )}

        {/* Empty State */}
        {itinerary.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Plan Your Journey</Text>
            <Text style={styles.emptyText}>Add stops to create your perfect itinerary</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyButtonText}>Add First Stop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timeline}>
            {sortedDates.map((date, dateIndex) => (
              <View key={date} style={styles.daySection}>
                {/* Day Header */}
                <View style={styles.dayHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>
                      {date === 'Unscheduled' ? '📅' : '📆'}
                    </Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayTitle}>{date}</Text>
                    <Text style={styles.daySubtitle}>{groupedItinerary[date].length} stops</Text>
                  </View>
                </View>

                {/* Stops for this day */}
                {groupedItinerary[date].map((stop, stopIndex) => {
                  const type = getStopType(stop.type);
                  const isLast = stopIndex === groupedItinerary[date].length - 1;
                  
                  return (
                    <View key={stop.id} style={styles.stopContainer}>
                      {/* Timeline connector */}
                      <View style={styles.timelineTrack}>
                        <View style={[styles.timelineDot, { backgroundColor: type.color }]}>
                          <Text style={styles.timelineDotEmoji}>{type.icon}</Text>
                        </View>
                        {!isLast && <View style={styles.timelineLine} />}
                      </View>

                      {/* Stop Card */}
                      <View style={styles.stopCard}>
                        <View style={styles.stopCardHeader}>
                          <View style={styles.stopInfo}>
                            <Text style={styles.stopName}>{stop.name}</Text>
                            <View style={styles.stopMeta}>
                              <View style={[styles.typeBadge, { backgroundColor: type.color + '20' }]}>
                                <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
                              </View>
                              {stop.time && (
                                <Text style={styles.stopTime}>⏰ {stop.time}</Text>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity 
                            onPress={() => deleteItineraryItem(stop.id)}
                            style={styles.deleteButton}
                          >
                            <Text style={styles.deleteText}>×</Text>
                          </TouchableOpacity>
                        </View>
                        
                        {stop.location && (
                          <View style={styles.stopLocation}>
                            <Text style={styles.locationIcon}>📍</Text>
                            <Text style={styles.locationText}>{stop.location}</Text>
                          </View>
                        )}
                        
                        {stop.notes && (
                          <Text style={styles.stopNotes}>{stop.notes}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Stop Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Stop</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Stop name"
              placeholderTextColor={COLORS.textMuted}
              value={newStop.name}
              onChangeText={(t) => setNewStop({...newStop, name: t})}
            />

            <TextInput
              style={styles.input}
              placeholder="📍 Location (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={newStop.location}
              onChangeText={(t) => setNewStop({...newStop, location: t})}
            />

            <View style={styles.dateTimeRow}>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeIcon}>📅</Text>
                <Text style={styles.dateTimeText}>{newStop.date || 'Date'}</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.timeInput}
                placeholder="⏰ Time"
                placeholderTextColor={COLORS.textMuted}
                value={newStop.time}
                onChangeText={(t) => setNewStop({...newStop, time: t})}
              />
            </View>

            <Text style={styles.inputLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
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
            </ScrollView>

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={newStop.notes}
              onChangeText={(t) => setNewStop({...newStop, notes: t})}
              multiline
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddStop}>
              <Text style={styles.submitButtonText}>Add to Itinerary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => setNewStop({...newStop, date})}
        selectedDate={newStop.date}
        title="Select Date"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  title: { color: COLORS.text, fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  addButton: { width: 48, height: 48, backgroundColor: COLORS.green, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: COLORS.bg, fontSize: 28, fontWeight: 'bold', marginTop: -2 },
  
  // Hero
  heroContainer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  heroGlobe: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 70 },
  heroRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: COLORS.greenBorder, opacity: 0.5 },
  heroRing2: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: COLORS.greenBorder, opacity: 0.3 },
  heroPlane: { position: 'absolute', top: 10, right: width * 0.2 },
  planeEmoji: { fontSize: 30 },
  heroPin: { position: 'absolute', bottom: 20, left: width * 0.25 },
  pinEmoji: { fontSize: 26 },
  
  // Empty state
  emptyState: { alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center' },
  emptyButton: { marginTop: 24, backgroundColor: COLORS.green, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyButtonText: { color: COLORS.bg, fontSize: 16, fontWeight: 'bold' },
  
  // Timeline
  timeline: { paddingHorizontal: 20, marginTop: 20 },
  daySection: { marginBottom: 24 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dayBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.greenMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.greenBorder },
  dayBadgeText: { fontSize: 20 },
  dayInfo: { marginLeft: 14 },
  dayTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  daySubtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  
  // Stop
  stopContainer: { flexDirection: 'row', marginLeft: 10 },
  timelineTrack: { alignItems: 'center', width: 50 },
  timelineDot: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timelineDotEmoji: { fontSize: 18 },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.greenBorder, marginVertical: 4 },
  
  stopCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 18, padding: 16, marginLeft: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.greenBorder },
  stopCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  stopInfo: { flex: 1 },
  stopName: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  stopMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  stopTime: { color: COLORS.textMuted, fontSize: 13 },
  deleteButton: { padding: 4 },
  deleteText: { color: COLORS.textMuted, fontSize: 24 },
  stopLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: COLORS.cardLight, padding: 10, borderRadius: 10 },
  locationIcon: { fontSize: 14, marginRight: 6 },
  locationText: { color: COLORS.textMuted, fontSize: 13 },
  stopNotes: { color: COLORS.textMuted, fontSize: 14, marginTop: 10, lineHeight: 20 },
  
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: COLORS.textMuted, fontSize: 28 },
  
  input: { backgroundColor: COLORS.cardLight, color: COLORS.text, padding: 16, borderRadius: 14, fontSize: 16, borderWidth: 1, borderColor: COLORS.greenBorder, marginBottom: 12 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  
  dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dateTimeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardLight, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.greenBorder },
  dateTimeIcon: { fontSize: 18, marginRight: 10 },
  dateTimeText: { color: COLORS.text, fontSize: 15 },
  timeInput: { flex: 1, backgroundColor: COLORS.cardLight, color: COLORS.text, padding: 16, borderRadius: 14, fontSize: 15, borderWidth: 1, borderColor: COLORS.greenBorder },
  
  inputLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 10 },
  typeScroll: { marginBottom: 16 },
  typeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: COLORS.greenBorder },
  typeChipIcon: { fontSize: 16, marginRight: 6 },
  typeChipText: { color: COLORS.text, fontSize: 13 },
  
  submitButton: { backgroundColor: COLORS.green, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: COLORS.bg, fontSize: 17, fontWeight: 'bold' },
});
