import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const SAMPLE_TRIPS = [
  { id: 1, name: 'Paris Adventure', destination: 'Paris, France', date: 'Dec 2024', days: 7, spent: 2500, status: 'completed' },
  { id: 2, name: 'Tokyo Explorer', destination: 'Tokyo, Japan', date: 'Oct 2024', days: 10, spent: 4200, status: 'completed' },
  { id: 3, name: 'NYC Weekend', destination: 'New York, USA', date: 'Aug 2024', days: 3, spent: 1200, status: 'completed' },
];

export default function HistoryScreen({ onBack }) {
  const { colors } = useTheme();
  const floatAnim = useState(new Animated.Value(0))[0];
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  const floatTranslate = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Trip History</Text>
            <Text style={styles.subtitle}>Your past adventures</Text>
          </View>
        </View>

        {/* Illustration */}
        <Animated.View style={[styles.illustration, { transform: [{ translateY: floatTranslate }] }]}>
          <View style={styles.illustrationBg}>
            <Text style={styles.illustrationEmoji}>📚</Text>
          </View>
          <View style={styles.floatingElement1}>
            <Text style={styles.floatingEmoji}>🗺️</Text>
          </View>
          <View style={styles.floatingElement2}>
            <Text style={styles.floatingEmoji}>📸</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{SAMPLE_TRIPS.length}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{SAMPLE_TRIPS.reduce((a, t) => a + t.days, 0)}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${(SAMPLE_TRIPS.reduce((a, t) => a + t.spent, 0) / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
        </View>

        {/* Trip List */}
        <Text style={styles.sectionTitle}>Past Trips</Text>
        {SAMPLE_TRIPS.map((trip) => (
          <TouchableOpacity key={trip.id} style={styles.tripCard} activeOpacity={0.8}>
            <View style={styles.tripIcon}>
              <Text style={styles.tripEmoji}>✈️</Text>
            </View>
            <View style={styles.tripInfo}>
              <Text style={styles.tripName}>{trip.name}</Text>
              <Text style={styles.tripDestination}>{trip.destination}</Text>
              <View style={styles.tripMeta}>
                <Text style={styles.tripDate}>📅 {trip.date}</Text>
                <Text style={styles.tripDays}>• {trip.days} days</Text>
              </View>
            </View>
            <View style={styles.tripStats}>
              <Text style={styles.tripSpent}>${trip.spent}</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  backButtonText: { color: colors.primary, fontSize: 24, fontWeight: 'bold' },
  headerContent: { marginLeft: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  illustration: { alignItems: 'center', marginVertical: 20 },
  illustrationBg: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primaryBorder },
  illustrationEmoji: { fontSize: 40 },
  floatingElement1: { position: 'absolute', top: -5, right: '25%', width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  floatingElement2: { position: 'absolute', bottom: 0, left: '25%', width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  floatingEmoji: { fontSize: 18 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  statValue: { color: colors.primary, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  tripCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  tripIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  tripEmoji: { fontSize: 24 },
  tripInfo: { flex: 1, marginLeft: 14 },
  tripName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  tripDestination: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  tripMeta: { flexDirection: 'row', marginTop: 6 },
  tripDate: { color: colors.primary, fontSize: 12 },
  tripDays: { color: colors.textMuted, fontSize: 12, marginLeft: 6 },
  tripStats: { alignItems: 'flex-end' },
  tripSpent: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  completedBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  completedText: { color: colors.bg, fontSize: 12, fontWeight: 'bold' },
});
