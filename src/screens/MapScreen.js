import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';

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
  { key: 'attraction', label: 'Attraction', icon: '🏛️' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { key: 'hotel', label: 'Hotel', icon: '🏨' },
  { key: 'transport', label: 'Transport', icon: '✈️' },
  { key: 'activity', label: 'Activity', icon: '🎯' },
];

export default function MapScreen() {
  const { itinerary, addItineraryItem, deleteItineraryItem } = useTravelContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [newStop, setNewStop] = useState({ name: '', type: 'attraction', date: '', time: '', notes: '' });

  const handleAddStop = () => {
    if (newStop.name.trim()) {
      addItineraryItem({ ...newStop, latitude: 0, longitude: 0 });
      setNewStop({ name: '', type: 'attraction', date: '', time: '', notes: '' });
      setModalVisible(false);
    }
  };

  const getStopType = (key) => STOP_TYPES.find(t => t.key === key) || STOP_TYPES[0];

  const sortedItinerary = [...itinerary].sort((a, b) => {
    if (a.date === b.date) return (a.time || '').localeCompare(b.time || '');
    return (a.date || '').localeCompare(b.date || '');
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

        {/* Timeline */}
        <View style={styles.timeline}>
          {sortedItinerary.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={styles.emptyTitle}>No stops yet</Text>
              <Text style={styles.emptyText}>Plan your journey</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.emptyButtonText}>Add First Stop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedItinerary.map((stop, index) => {
              const type = getStopType(stop.type);
              return (
                <View key={stop.id} style={styles.stopContainer}>
                  {/* Timeline Line */}
                  {index < sortedItinerary.length - 1 && <View style={styles.timelineLine} />}
                  
                  {/* Stop Card */}
                  <View style={styles.stopCard}>
                    <View style={styles.stopIcon}>
                      <Text style={styles.stopEmoji}>{type.icon}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      <Text style={styles.stopName}>{stop.name}</Text>
                      <Text style={styles.stopType}>{type.label}</Text>
                      {(stop.date || stop.time) && (
                        <Text style={styles.stopDateTime}>
                          {stop.date} {stop.time && `• ${stop.time}`}
                        </Text>
                      )}
                      {stop.notes && <Text style={styles.stopNotes}>{stop.notes}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => deleteItineraryItem(stop.id)}>
                      <Text style={styles.deleteButton}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Stop</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Stop name"
              placeholderTextColor={COLORS.textMuted}
              value={newStop.name}
              onChangeText={(t) => setNewStop({...newStop, name: t})}
            />

            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                placeholder="Date"
                placeholderTextColor={COLORS.textMuted}
                value={newStop.date}
                onChangeText={(t) => setNewStop({...newStop, date: t})}
              />
              <TextInput
                style={[styles.input, styles.dateInput]}
                placeholder="Time"
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
                  style={[styles.typeChip, newStop.type === type.key && styles.typeChipActive]}
                  onPress={() => setNewStop({...newStop, type: type.key})}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[styles.typeText, newStop.type === type.key && styles.typeTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={newStop.notes}
              onChangeText={(t) => setNewStop({...newStop, notes: t})}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddStop}>
              <Text style={styles.submitButtonText}>Add Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.green,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: COLORS.bg, fontSize: 28, fontWeight: 'bold', marginTop: -2 },
  timeline: { marginTop: 30, paddingHorizontal: 20 },
  stopContainer: { position: 'relative', marginBottom: 16 },
  timelineLine: {
    position: 'absolute',
    left: 23,
    top: 56,
    width: 2,
    height: 40,
    backgroundColor: COLORS.greenBorder,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  stopIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.greenMuted,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopEmoji: { fontSize: 22 },
  stopInfo: { flex: 1, marginLeft: 14 },
  stopName: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  stopType: { color: COLORS.green, fontSize: 12, marginTop: 2 },
  stopDateTime: { color: COLORS.textMuted, fontSize: 12, marginTop: 6 },
  stopNotes: { color: COLORS.textMuted, fontSize: 13, marginTop: 6 },
  deleteButton: { color: COLORS.textMuted, fontSize: 24, paddingLeft: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 6 },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: { color: COLORS.bg, fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    backgroundColor: COLORS.cardLight,
    color: COLORS.text,
    padding: 18,
    borderRadius: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginBottom: 12,
  },
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dateInput: { flex: 1 },
  inputLabel: { color: COLORS.textMuted, marginBottom: 12, marginTop: 8 },
  typeScroll: { marginBottom: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  typeChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  typeIcon: { fontSize: 16, marginRight: 6 },
  typeText: { color: COLORS.text, fontSize: 13 },
  typeTextActive: { color: COLORS.bg, fontWeight: '600' },
  submitButton: { backgroundColor: COLORS.green, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: COLORS.bg, fontSize: 17, fontWeight: 'bold' },
});
