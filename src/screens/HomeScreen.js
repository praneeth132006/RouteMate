import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ onBackToHome }) {
  const { tripInfo, setTripInfo, budget, getTotalExpenses, getRemainingBudget, packingItems, itinerary } = useTravelContext();
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const packedCount = packingItems.filter(item => item.packed).length;
  const totalItems = packingItems.length;
  const spentPercentage = budget.total > 0 ? (getTotalExpenses() / budget.total) * 100 : 0;
  const participantCount = (tripInfo.participants?.length || 0) + 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{tripInfo.name || 'Your Trip'}</Text>
            <Text style={styles.title}>Dashboard ✈️</Text>
          </View>
          <View style={styles.tripBadge}>
            <Text style={styles.tripBadgeText}>
              {participantCount} {participantCount === 1 ? 'Traveler' : 'Travelers'}
            </Text>
          </View>
        </View>

        {/* Destination Card */}
        <View style={styles.destinationCard}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.destinationInput}
                placeholder="Enter destination..."
                placeholderTextColor={colors.textMuted}
                value={tripInfo.destination}
                onChangeText={(text) => setTripInfo({...tripInfo, destination: text})}
              />
              <View style={styles.dateInputRow}>
                <TextInput style={styles.dateInput} placeholder="Start date" placeholderTextColor={colors.textMuted} value={tripInfo.startDate} onChangeText={(text) => setTripInfo({...tripInfo, startDate: text})} />
                <View style={styles.dateArrow}><Text style={styles.dateArrowText}>→</Text></View>
                <TextInput style={styles.dateInput} placeholder="End date" placeholderTextColor={colors.textMuted} value={tripInfo.endDate} onChangeText={(text) => setTripInfo({...tripInfo, endDate: text})} />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={() => setIsEditing(false)}>
                <Text style={styles.saveButtonText}>Save Trip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.8}>
              <Text style={styles.destinationLabel}>DESTINATION</Text>
              <Text style={styles.destinationName}>{tripInfo.destination || 'Tap to set destination'}</Text>
              <View style={styles.dateDisplay}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>📅 {tripInfo.startDate || 'Start'} — {tripInfo.endDate || 'End'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View>
                <Text style={styles.budgetLabel}>TOTAL BUDGET</Text>
                <Text style={styles.budgetAmount}>${budget.total.toLocaleString()}</Text>
              </View>
              <View style={styles.budgetPercentage}>
                <Text style={styles.percentageText}>{spentPercentage.toFixed(0)}%</Text>
                <Text style={styles.percentageLabel}>spent</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(spentPercentage, 100)}%` }]} />
              </View>
            </View>
            <View style={styles.budgetFooter}>
              <View style={styles.budgetStat}>
                <Text style={styles.budgetStatValue}>${getTotalExpenses()}</Text>
                <Text style={styles.budgetStatLabel}>Spent</Text>
              </View>
              <View style={styles.budgetDivider} />
              <View style={styles.budgetStat}>
                <Text style={[styles.budgetStatValue, { color: colors.primary }]}>${getRemainingBudget()}</Text>
                <Text style={styles.budgetStatLabel}>Remaining</Text>
              </View>
            </View>
          </View>

          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <View style={styles.miniStatIcon}><Text style={styles.miniStatEmoji}>🎒</Text></View>
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{packedCount}/{totalItems}</Text>
                <Text style={styles.miniStatLabel}>Items Packed</Text>
              </View>
            </View>
            
            <View style={styles.miniStatCard}>
              <View style={styles.miniStatIcon}><Text style={styles.miniStatEmoji}>📍</Text></View>
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{itinerary.length}</Text>
                <Text style={styles.miniStatLabel}>Stops Planned</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip Code */}
        <View style={styles.shareCard}>
          <View style={styles.shareContent}>
            <Text style={styles.shareTitle}>Share Trip</Text>
            <Text style={styles.shareDescription}>Invite friends with this code</Text>
          </View>
          <View style={styles.codeContainer}>
            <Text style={styles.tripCode}>{tripInfo.tripCode || 'ABC123'}</Text>
          </View>
        </View>

        {/* Back Button */}
        {onBackToHome && (
          <TouchableOpacity style={styles.backButton} onPress={onBackToHome}>
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 20, paddingBottom: 10 },
  greeting: { color: colors.primary, fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  tripBadge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primaryBorder },
  tripBadgeText: { color: colors.primary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  destinationCard: { marginTop: 20, backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.primaryBorder },
  destinationLabel: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  destinationName: { color: colors.text, fontSize: 26, fontWeight: 'bold', marginTop: 8 },
  dateDisplay: { marginTop: 16 },
  dateBadge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.primaryBorder },
  dateBadgeText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  editContainer: { gap: 12 },
  destinationInput: { backgroundColor: colors.cardLight, color: colors.text, fontSize: 18, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  dateInputRow: { flexDirection: 'row', alignItems: 'center' },
  dateInput: { flex: 1, backgroundColor: colors.cardLight, color: colors.text, fontSize: 14, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  dateArrow: { paddingHorizontal: 12 },
  dateArrowText: { color: colors.primary, fontSize: 18 },
  saveButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  statsContainer: { marginTop: 30 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  budgetCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  budgetLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
  budgetAmount: { color: colors.text, fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  budgetPercentage: { alignItems: 'flex-end' },
  percentageText: { color: colors.primary, fontSize: 24, fontWeight: 'bold' },
  percentageLabel: { color: colors.textMuted, fontSize: 12 },
  progressContainer: { marginTop: 20 },
  progressTrack: { height: 8, backgroundColor: colors.cardLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  budgetFooter: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  budgetStat: { flex: 1 },
  budgetStatValue: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  budgetStatLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  budgetDivider: { width: 1, height: 40, backgroundColor: colors.primaryBorder, marginHorizontal: 20 },
  miniStatsRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  miniStatCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  miniStatIcon: { width: 44, height: 44, backgroundColor: colors.primaryMuted, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  miniStatEmoji: { fontSize: 20 },
  miniStatContent: { marginLeft: 12, flex: 1 },
  miniStatValue: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  miniStatLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  shareCard: { marginTop: 24, backgroundColor: colors.card, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.primaryBorder },
  shareContent: { flex: 1 },
  shareTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  shareDescription: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  codeContainer: { backgroundColor: colors.primaryMuted, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.primary },
  tripCode: { color: colors.primary, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  backButton: { marginTop: 24, padding: 16, alignItems: 'center' },
  backButtonText: { color: colors.textMuted, fontSize: 14 },
});
