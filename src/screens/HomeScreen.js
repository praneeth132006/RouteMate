import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen({ onBackToHome }) {
  const { tripInfo, setTripInfo, budget, getTotalExpenses, getRemainingBudget, packingItems, itinerary, expenses } = useTravelContext();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const packedCount = packingItems.filter(item => item.packed).length;
  const totalItems = packingItems.length;
  const packingProgress = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;
  const spentPercentage = budget.total > 0 ? (getTotalExpenses() / budget.total) * 100 : 0;
  const participantCount = (tripInfo.participants?.length || 0) + 1;
  const remainingBudget = getRemainingBudget();

  // Get last expense
  const lastExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;

  // Get recent expenses
  const recentExpenses = expenses.slice(-4).reverse();

  // Get category info for expenses
  const getCategoryInfo = (key) => {
    const categories = {
      accommodation: { emoji: '🏨', color: '#8B5CF6' },
      transport: { emoji: '🚗', color: '#3B82F6' },
      food: { emoji: '🍽️', color: '#F59E0B' },
      activities: { emoji: '🎭', color: '#10B981' },
      shopping: { emoji: '🛍️', color: '#EC4899' },
      other: { emoji: '📦', color: '#6B7280' },
    };
    return categories[key] || categories.other;
  };

  // Calculate days until trip
  const getDaysUntilTrip = () => {
    if (!tripInfo.startDate) return null;
    try {
      const parts = tripInfo.startDate.split(' ');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const startDate = new Date(parseInt(parts[2]), months.indexOf(parts[1]), parseInt(parts[0]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = startDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  // Calculate trip days
  const getTripDays = () => {
    if (!tripInfo.startDate || !tripInfo.endDate) return 0;
    try {
      const parts1 = tripInfo.startDate.split(' ');
      const parts2 = tripInfo.endDate.split(' ');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const startDate = new Date(parseInt(parts1[2]), months.indexOf(parts1[1]), parseInt(parts1[0]));
      const endDate = new Date(parseInt(parts2[2]), months.indexOf(parts2[1]), parseInt(parts2[0]));
      const diffTime = endDate - startDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  const tripDays = getTripDays();
  const daysUntil = getDaysUntilTrip();

  // Navigate to Itinerary tab
  const goToItinerary = () => {
    navigation.navigate('Itinerary');
  };

  // Navigate to Expenses tab
  const goToExpenses = () => {
    navigation.navigate('Expenses');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerLabel}>YOUR TRIP</Text>
              <Text style={styles.headerTitle}>{tripInfo.destination || 'My Adventure'}</Text>
            </View>
            <Pressable style={styles.backButton} onPress={onBackToHome}>
              <Text style={styles.backButtonText}>✕</Text>
            </Pressable>
          </View>
          
          {/* Trip Status Badge */}
          {daysUntil !== null && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusEmoji}>
                {daysUntil < 0 ? '✈️' : daysUntil === 0 ? '🎉' : '📅'}
              </Text>
              <Text style={styles.statusText}>
                {daysUntil < 0 
                  ? 'Trip in progress!' 
                  : daysUntil === 0 
                    ? 'Trip starts today!' 
                    : `${daysUntil} days to go`}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Hero Card - Softer colors */}
        <Animated.View style={[styles.heroCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.heroGlow} />
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBg}>
              <Text style={styles.heroIcon}>🌍</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroDestination}>{tripInfo.destination || 'Destination'}</Text>
              {tripInfo.startDate && tripInfo.endDate && (
                <Text style={styles.heroDates}>📅 {tripInfo.startDate} → {tripInfo.endDate}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{participantCount}</Text>
              <Text style={styles.heroStatLabel}>Travelers</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{tripDays}</Text>
              <Text style={styles.heroStatLabel}>Days</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              {lastExpense ? (
                <>
                  <Text style={styles.heroStatValue}>${lastExpense.amount}</Text>
                  <Text style={styles.heroStatLabel}>Last Spent</Text>
                </>
              ) : (
                <>
                  <Text style={styles.heroStatValue}>$0</Text>
                  <Text style={styles.heroStatLabel}>Last Spent</Text>
                </>
              )}
            </View>
          </View>

          {/* Trip Code */}
          <View style={styles.tripCodeSection}>
            <Text style={styles.tripCodeLabel}>Share Code</Text>
            <View style={styles.tripCodeBox}>
              <Text style={styles.tripCode}>{tripInfo.tripCode || 'ABC123'}</Text>
              <TouchableOpacity style={styles.copyButton}>
                <Text style={styles.copyButtonText}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Budget Card */}
          <Animated.View style={[styles.statCard, styles.statCardBudget, { opacity: fadeAnim }]}>
            <View style={styles.statCardHeader}>
              <View style={styles.statCardIconBg}>
                <Text style={styles.statCardIcon}>💰</Text>
              </View>
              <Text style={styles.statCardTitle}>Budget</Text>
            </View>
            <Text style={styles.statCardValue}>${budget.total.toLocaleString()}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(spentPercentage, 100)}%`, backgroundColor: spentPercentage > 90 ? '#EF4444' : colors.primary }]} />
              </View>
              <Text style={styles.progressText}>{spentPercentage.toFixed(0)}% spent</Text>
            </View>
            <View style={styles.statCardFooter}>
              <View style={styles.statMini}>
                <Text style={styles.statMiniLabel}>Spent</Text>
                <Text style={styles.statMiniValue}>${getTotalExpenses()}</Text>
              </View>
              <View style={styles.statMini}>
                <Text style={styles.statMiniLabel}>Left</Text>
                <Text style={[styles.statMiniValue, { color: remainingBudget >= 0 ? colors.primary : '#EF4444' }]}>${remainingBudget}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Packing Card */}
          <Animated.View style={[styles.statCard, styles.statCardPacking, { opacity: fadeAnim }]}>
            <View style={styles.statCardHeader}>
              <View style={styles.statCardIconBg}>
                <Text style={styles.statCardIcon}>🎒</Text>
              </View>
              <Text style={styles.statCardTitle}>Packing</Text>
            </View>
            <View style={styles.packingCircle}>
              <Text style={styles.packingPercent}>{packingProgress.toFixed(0)}%</Text>
            </View>
            <Text style={styles.packingStatus}>
              {packingProgress === 100 ? '✅ All packed!' : `${totalItems - packedCount} items left`}
            </Text>
          </Animated.View>
        </View>

        {/* Activity Overview */}
        <Animated.View style={[styles.overviewSection, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📍 Activity Overview</Text>
            {itinerary.length > 0 && (
              <TouchableOpacity onPress={goToItinerary}>
                <Text style={styles.viewMoreText}>View All →</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.overviewCard}>
            {itinerary.length === 0 ? (
              <TouchableOpacity style={styles.emptyOverview} onPress={goToItinerary}>
                <Text style={styles.emptyOverviewEmoji}>🗺️</Text>
                <Text style={styles.emptyOverviewText}>No activities planned yet</Text>
                <Text style={styles.emptyOverviewHint}>Tap to add activities</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.overviewList}>
                {itinerary.slice(0, 4).map((item, index) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.overviewItem, index < Math.min(itinerary.length, 4) - 1 && styles.overviewItemBorder]}
                    onPress={goToItinerary}
                  >
                    <View style={styles.overviewDayBadge}>
                      <Text style={styles.overviewDayText}>D{item.dayNumber}</Text>
                    </View>
                    <Text style={styles.overviewName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.overviewTime}>{item.time || '--:--'}</Text>
                  </TouchableOpacity>
                ))}
                {itinerary.length > 4 && (
                  <TouchableOpacity style={styles.moreItemsButton} onPress={goToItinerary}>
                    <Text style={styles.moreItems}>+{itinerary.length - 4} more activities →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Expense Logs */}
        <Animated.View style={[styles.overviewSection, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💳 Recent Expenses</Text>
            {expenses.length > 0 && (
              <TouchableOpacity onPress={goToExpenses}>
                <Text style={styles.viewMoreText}>View All →</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.overviewCard}>
            {expenses.length === 0 ? (
              <TouchableOpacity style={styles.emptyOverview} onPress={goToExpenses}>
                <Text style={styles.emptyOverviewEmoji}>💸</Text>
                <Text style={styles.emptyOverviewText}>No expenses logged yet</Text>
                <Text style={styles.emptyOverviewHint}>Tap to start tracking</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.overviewList}>
                {recentExpenses.map((expense, index) => {
                  const categoryInfo = getCategoryInfo(expense.category);
                  return (
                    <TouchableOpacity 
                      key={expense.id} 
                      style={[styles.expenseItem, index < recentExpenses.length - 1 && styles.overviewItemBorder]}
                      onPress={goToExpenses}
                    >
                      <View style={[styles.expenseIconBg, { backgroundColor: categoryInfo.color + '20' }]}>
                        <Text style={styles.expenseIcon}>{categoryInfo.emoji}</Text>
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseName} numberOfLines={1}>{expense.title}</Text>
                        <Text style={styles.expenseDate}>{expense.date}</Text>
                      </View>
                      <Text style={styles.expenseAmount}>-${expense.amount}</Text>
                    </TouchableOpacity>
                  );
                })}
                {expenses.length > 4 && (
                  <TouchableOpacity style={styles.moreItemsButton} onPress={goToExpenses}>
                    <Text style={styles.moreItems}>+{expenses.length - 4} more expenses →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Participants */}
        {tripInfo.participants && tripInfo.participants.length > 0 && (
          <Animated.View style={[styles.participantsSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>👥 Travel Buddies</Text>
            <View style={styles.participantsCard}>
              <View style={styles.participantsList}>
                <View style={styles.participantItem}>
                  <View style={[styles.participantAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.participantInitial}>You</Text>
                  </View>
                  <Text style={styles.participantName}>You (Organizer)</Text>
                </View>
                {tripInfo.participants.map((p, index) => (
                  <View key={index} style={styles.participantItem}>
                    <View style={styles.participantAvatar}>
                      <Text style={styles.participantInitial}>{p.name?.charAt(0) || '?'}</Text>
                    </View>
                    <Text style={styles.participantName}>{p.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 20 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLabel: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  backButtonText: { color: colors.textMuted, fontSize: 18 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginTop: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  statusEmoji: { fontSize: 16, marginRight: 8 },
  statusText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // Hero Card
  heroCard: { 
    marginHorizontal: 20, 
    backgroundColor: colors.card, 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20, 
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  heroGlow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, backgroundColor: colors.primary, opacity: 0.08, borderRadius: 75 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroIconBg: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  heroIcon: { fontSize: 28 },
  heroInfo: { marginLeft: 14, flex: 1 },
  heroDestination: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  heroDates: { color: colors.primary, fontSize: 13, marginTop: 4 },
  heroStats: { flexDirection: 'row', backgroundColor: colors.cardLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  heroStatLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: colors.primaryBorder },
  tripCodeSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  tripCodeLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 8 },
  tripCodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryMuted, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  tripCode: { flex: 1, color: colors.primary, fontSize: 20, fontWeight: 'bold', letterSpacing: 3 },
  copyButton: { padding: 4 },
  copyButtonText: { fontSize: 18 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  statCardBudget: {},
  statCardPacking: { alignItems: 'center' },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statCardIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  statCardIcon: { fontSize: 18 },
  statCardTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginLeft: 10 },
  statCardValue: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  progressContainer: { marginTop: 12 },
  progressBar: { height: 6, backgroundColor: colors.cardLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  statCardFooter: { flexDirection: 'row', marginTop: 12, gap: 16 },
  statMini: {},
  statMiniLabel: { color: colors.textMuted, fontSize: 10 },
  statMiniValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  packingCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  packingPercent: { color: colors.primary, fontSize: 22, fontWeight: 'bold' },
  packingStatus: { color: colors.textMuted, fontSize: 12, marginTop: 8 },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  viewMoreText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // Overview Section
  overviewSection: { paddingHorizontal: 20, marginBottom: 20 },
  overviewCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  emptyOverview: { alignItems: 'center', paddingVertical: 20 },
  emptyOverviewEmoji: { fontSize: 32, marginBottom: 8 },
  emptyOverviewText: { color: colors.textMuted, fontSize: 14 },
  emptyOverviewHint: { color: colors.primary, fontSize: 12, marginTop: 4, fontWeight: '500' },
  overviewList: { gap: 0 },
  overviewItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  overviewItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  overviewDayBadge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12 },
  overviewDayText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  overviewName: { flex: 1, color: colors.text, fontSize: 14 },
  overviewTime: { color: colors.textMuted, fontSize: 12 },
  moreItemsButton: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.primaryBorder, marginTop: 4 },
  moreItems: { color: colors.primary, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Expense Items
  expenseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  expenseIconBg: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  expenseIcon: { fontSize: 18 },
  expenseInfo: { flex: 1 },
  expenseName: { color: colors.text, fontSize: 14, fontWeight: '500' },
  expenseDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  expenseAmount: { color: '#EF4444', fontSize: 15, fontWeight: 'bold' },

  // Participants
  participantsSection: { paddingHorizontal: 20, marginBottom: 20 },
  participantsCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  participantsList: { gap: 12 },
  participantItem: { flexDirection: 'row', alignItems: 'center' },
  participantAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  participantInitial: { color: colors.text, fontSize: 14, fontWeight: '600' },
  participantName: { color: colors.text, fontSize: 15 },
});
