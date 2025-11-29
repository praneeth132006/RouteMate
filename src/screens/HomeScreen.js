import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#000000',
  card: '#0A0A0A',
  cardLight: '#111111',
  green: '#00FF7F',
  greenDark: '#00CC66',
  greenLight: '#7DFFB3',
  greenMuted: 'rgba(0, 255, 127, 0.1)',
  greenBorder: 'rgba(0, 255, 127, 0.3)',
  text: '#FFFFFF',
  textMuted: '#666666',
  textLight: '#999999',
};

export default function HomeScreen() {
  const { tripInfo, setTripInfo, budget, getTotalExpenses, getRemainingBudget, packingItems } = useTravelContext();
  const [isEditing, setIsEditing] = useState(false);

  const packedCount = packingItems.filter(item => item.packed).length;
  const totalItems = packingItems.length;
  const spentPercentage = budget.total > 0 ? (getTotalExpenses() / budget.total) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Traveler</Text>
          <Text style={styles.title}>Where to next? ✈️</Text>
        </View>

        {/* Destination Card */}
        <View style={styles.destinationCard}>
          <View style={styles.destinationGlow} />
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.destinationInput}
                placeholder="Enter destination..."
                placeholderTextColor={COLORS.textMuted}
                value={tripInfo.destination}
                onChangeText={(text) => setTripInfo({...tripInfo, destination: text})}
              />
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.dateInput]}
                  placeholder="Start date"
                  placeholderTextColor={COLORS.textMuted}
                  value={tripInfo.startDate}
                  onChangeText={(text) => setTripInfo({...tripInfo, startDate: text})}
                />
                <View style={styles.dateArrow}>
                  <Text style={styles.dateArrowText}>→</Text>
                </View>
                <TextInput
                  style={[styles.dateInput]}
                  placeholder="End date"
                  placeholderTextColor={COLORS.textMuted}
                  value={tripInfo.endDate}
                  onChangeText={(text) => setTripInfo({...tripInfo, endDate: text})}
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={() => setIsEditing(false)}>
                <Text style={styles.saveButtonText}>Save Trip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.8}>
              <Text style={styles.destinationLabel}>DESTINATION</Text>
              <Text style={styles.destinationName}>
                {tripInfo.destination || 'Tap to set destination'}
              </Text>
              <View style={styles.dateDisplay}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>
                    {tripInfo.startDate || 'Start'} — {tripInfo.endDate || 'End'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          
          {/* Budget Progress Card */}
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
                <Text style={[styles.budgetStatValue, { color: COLORS.green }]}>${getRemainingBudget()}</Text>
                <Text style={styles.budgetStatLabel}>Remaining</Text>
              </View>
            </View>
          </View>

          {/* Mini Stats */}
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <View style={styles.miniStatIcon}>
                <Text style={styles.miniStatEmoji}>🎒</Text>
              </View>
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{packedCount}/{totalItems}</Text>
                <Text style={styles.miniStatLabel}>Items Packed</Text>
              </View>
              <View style={styles.miniProgress}>
                <View style={[styles.miniProgressFill, { height: `${totalItems > 0 ? (packedCount/totalItems)*100 : 0}%` }]} />
              </View>
            </View>
            
            <View style={styles.miniStatCard}>
              <View style={styles.miniStatIcon}>
                <Text style={styles.miniStatEmoji}>📍</Text>
              </View>
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>0</Text>
                <Text style={styles.miniStatLabel}>Stops Planned</Text>
              </View>
              <View style={styles.miniProgress}>
                <View style={[styles.miniProgressFill, { height: '0%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: '💸', label: 'Add Expense' },
              { icon: '📦', label: 'Add Item' },
              { icon: '🗺️', label: 'Plan Route' },
              { icon: '📊', label: 'View Stats' },
            ].map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard} activeOpacity={0.7}>
                <View style={styles.actionIconBg}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipTitle}>Pro Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Set your budget before adding expenses to track your spending effectively.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  destinationCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    overflow: 'hidden',
  },
  destinationGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: COLORS.green,
    opacity: 0.05,
    borderRadius: 75,
  },
  destinationLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  destinationName: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  dateDisplay: {
    marginTop: 16,
  },
  dateBadge: {
    backgroundColor: COLORS.greenMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  dateBadgeText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '600',
  },
  editContainer: {
    gap: 12,
  },
  destinationInput: {
    backgroundColor: COLORS.cardLight,
    color: COLORS.text,
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    color: COLORS.text,
    fontSize: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  dateArrow: {
    paddingHorizontal: 12,
  },
  dateArrowText: {
    color: COLORS.green,
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  budgetCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  budgetLabel: {
    color: COLORS.textLight,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  budgetAmount: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  budgetPercentage: {
    alignItems: 'flex-end',
  },
  percentageText: {
    color: COLORS.green,
    fontSize: 28,
    fontWeight: 'bold',
  },
  percentageLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.cardLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  budgetStat: {
    flex: 1,
  },
  budgetStatValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  budgetStatLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  budgetDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.greenBorder,
    marginHorizontal: 20,
  },
  miniStatsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    overflow: 'hidden',
  },
  miniStatIcon: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.greenMuted,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatEmoji: {
    fontSize: 18,
  },
  miniStatContent: {
    marginLeft: 12,
    flex: 1,
  },
  miniStatValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  miniStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  miniProgress: {
    width: 4,
    height: 40,
    backgroundColor: COLORS.cardLight,
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  miniProgressFill: {
    width: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 2,
  },
  actionsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.greenMuted,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  tipCard: {
    marginHorizontal: 20,
    marginTop: 30,
    backgroundColor: COLORS.greenMuted,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tipTitle: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipText: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
  },
});
