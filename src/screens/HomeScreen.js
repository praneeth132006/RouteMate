import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Animated, Pressable, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import DatePickerModal from '../components/DatePickerModal';

export default function HomeScreen({ onBackToHome }) {
  const { 
    tripInfo, setTripInfo, budget, setBudget, getTotalExpenses, getRemainingBudget, 
    packingItems, itinerary, expenses, clearTrip, endTrip, formatCurrency, currency
  } = useTravelContext();
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTravelersModal, setShowTravelersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Edit states
  const [newBudget, setNewBudget] = useState(budget.total.toString());
  const [newTravelerName, setNewTravelerName] = useState('');
  const [travelers, setTravelers] = useState(tripInfo.participants || []);
  const [editStartDate, setEditStartDate] = useState(tripInfo.startDate || '');
  const [editEndDate, setEditEndDate] = useState(tripInfo.endDate || '');

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  // Check if trip has ended automatically
  useEffect(() => {
    const checkTripEnded = () => {
      if (tripInfo.endDate && !tripInfo.isCompleted) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        try {
          const parts = tripInfo.endDate.split(' ');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const endDate = new Date(parseInt(parts[2]), months.indexOf(parts[1]), parseInt(parts[0]));
          endDate.setHours(23, 59, 59, 999);
          
          if (today > endDate) {
            // Trip has ended, add to history
            handleAutoEndTrip();
          }
        } catch (e) {
          console.log('Error checking trip end date:', e);
        }
      }
    };

    checkTripEnded();
  }, [tripInfo.endDate]);

  const packedCount = packingItems.filter(item => item.packed).length;
  const totalItems = packingItems.length;
  const packingProgress = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;
  const spentPercentage = budget.total > 0 ? (getTotalExpenses() / budget.total) * 100 : 0;
  const participantCount = (tripInfo.participants?.length || 0) + 1;
  const remainingBudget = getRemainingBudget();
  const lastExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;
  const recentExpenses = expenses.slice(-4).reverse();

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

  const tripDays = getTripDays();
  const daysUntil = getDaysUntilTrip();

  const goToItinerary = () => navigation.navigate('Itinerary');
  const goToExpenses = () => navigation.navigate('Expenses');

  // Trip management functions
  const handleUpdateBudget = () => {
    const amount = parseFloat(newBudget);
    if (amount > 0) {
      setBudget(prev => ({ ...prev, total: amount }));
      setShowBudgetModal(false);
    }
  };

  const handleUpdateDates = () => {
    if (editStartDate && editEndDate) {
      setTripInfo(prev => ({ 
        ...prev, 
        startDate: editStartDate, 
        endDate: editEndDate 
      }));
      setShowDatesModal(false);
    }
  };

  const handleAddTraveler = () => {
    if (newTravelerName.trim()) {
      const updatedTravelers = [...travelers, { name: newTravelerName.trim(), type: 'member' }];
      setTravelers(updatedTravelers);
      setTripInfo(prev => ({ ...prev, participants: updatedTravelers }));
      setNewTravelerName('');
    }
  };

  const handleRemoveTraveler = (index) => {
    const updatedTravelers = travelers.filter((_, i) => i !== index);
    setTravelers(updatedTravelers);
    setTripInfo(prev => ({ ...prev, participants: updatedTravelers }));
  };

  const handleAutoEndTrip = () => {
    if (endTrip) {
      endTrip();
    }
    onBackToHome();
  };

  const handleEndTrip = () => {
    if (endTrip) {
      endTrip();
    }
    setShowEndTripModal(false);
    onBackToHome();
  };

  const handleDeleteTrip = () => {
    if (clearTrip) {
      clearTrip();
    }
    setShowDeleteModal(false);
    onBackToHome();
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
            <View style={styles.headerActions}>
              <Pressable 
                style={styles.settingsButton} 
                onPress={() => setShowSettingsModal(true)}
              >
                <Text style={styles.settingsButtonText}>⚙️</Text>
              </Pressable>
              <Pressable style={styles.backButton} onPress={onBackToHome}>
                <Text style={styles.backButtonText}>✕</Text>
              </Pressable>
            </View>
          </View>
          
          {/* Trip Status Badge */}
          {daysUntil !== null && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusEmoji}>
                {daysUntil < 0 ? '✈️' : daysUntil === 0 ? '🎉' : '📅'}
              </Text>
              <Text style={styles.statusText}>
                {daysUntil < 0 ? 'Trip in progress!' : daysUntil === 0 ? 'Trip starts today!' : `${daysUntil} days to go`}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Hero Card - UPDATED: Removed Share Code section */}
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
              <Text style={styles.heroStatValue}>{tripDays}</Text>
              <Text style={styles.heroStatLabel}>Days</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{formatCurrency(getTotalExpenses())}</Text>
              <Text style={styles.heroStatLabel}>Spent</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{formatCurrency(remainingBudget)}</Text>
              <Text style={styles.heroStatLabel}>Remaining</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActionsSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable 
              style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.8 }]}
              onPress={() => { setEditStartDate(tripInfo.startDate); setEditEndDate(tripInfo.endDate); setShowDatesModal(true); }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF620' }]}>
                <Text style={styles.quickActionEmoji}>📅</Text>
              </View>
              <Text style={styles.quickActionLabel}>Edit Dates</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.8 }]}
              onPress={() => setShowBudgetModal(true)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#10B98120' }]}>
                <Text style={styles.quickActionEmoji}>💰</Text>
              </View>
              <Text style={styles.quickActionLabel}>Edit Budget</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.8 }]}
              onPress={() => setShowTravelersModal(true)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F620' }]}>
                <Text style={styles.quickActionEmoji}>👥</Text>
              </View>
              <Text style={styles.quickActionLabel}>Travelers</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.8 }]}
              onPress={() => setShowEndTripModal(true)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B20' }]}>
                <Text style={styles.quickActionEmoji}>🏁</Text>
              </View>
              <Text style={styles.quickActionLabel}>End Trip</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Animated.View style={[styles.statCard, styles.statCardBudget, { opacity: fadeAnim }]}>
            <View style={styles.statCardHeader}>
              <View style={styles.statCardIconBg}>
                <Text style={styles.statCardIcon}>💰</Text>
              </View>
              <Text style={styles.statCardTitle}>Budget</Text>
            </View>
            <Text style={styles.statCardValue}>{formatCurrency(budget.total)}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(spentPercentage, 100)}%`, backgroundColor: spentPercentage > 90 ? '#EF4444' : colors.primary }]} />
              </View>
              <Text style={styles.progressText}>{spentPercentage.toFixed(0)}% spent</Text>
            </View>
            <View style={styles.statCardFooter}>
              <View style={styles.statMini}>
                <Text style={styles.statMiniLabel}>Spent</Text>
                <Text style={styles.statMiniValue}>{formatCurrency(getTotalExpenses())}</Text>
              </View>
              <View style={styles.statMini}>
                <Text style={styles.statMiniLabel}>Left</Text>
                <Text style={[styles.statMiniValue, { color: remainingBudget >= 0 ? colors.primary : '#EF4444' }]}>{formatCurrency(remainingBudget)}</Text>
              </View>
            </View>
          </Animated.View>

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
                      <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
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

        {/* Participants - Keep this section */}
        {travelers.length > 0 && (
          <Animated.View style={[styles.participantsSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 Travel Buddies</Text>
              <TouchableOpacity onPress={() => setShowTravelersModal(true)}>
                <Text style={styles.viewMoreText}>Edit →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.participantsCard}>
              <View style={styles.participantsList}>
                <View style={styles.participantItem}>
                  <View style={[styles.participantAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.participantInitial}>You</Text>
                  </View>
                  <Text style={styles.participantName}>You (Organizer)</Text>
                </View>
                {travelers.map((p, index) => (
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

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="slide" onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Trip Settings</Text>
              <Pressable onPress={() => setShowSettingsModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.settingsList}>
              <Pressable 
                style={styles.settingsItem}
                onPress={() => { 
                  setShowSettingsModal(false); 
                  setEditStartDate(tripInfo.startDate); 
                  setEditEndDate(tripInfo.endDate); 
                  setShowDatesModal(true); 
                }}
              >
                <View style={[styles.settingsIconBg, { backgroundColor: '#8B5CF620' }]}>
                  <Text style={styles.settingsIcon}>📅</Text>
                </View>
                <View style={styles.settingsInfo}>
                  <Text style={styles.settingsLabel}>Edit Travel Dates</Text>
                  <Text style={styles.settingsDesc}>{tripInfo.startDate} → {tripInfo.endDate}</Text>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </Pressable>

              <Pressable 
                style={styles.settingsItem}
                onPress={() => { setShowSettingsModal(false); setShowBudgetModal(true); }}
              >
                <View style={[styles.settingsIconBg, { backgroundColor: '#10B98120' }]}>
                  <Text style={styles.settingsIcon}>💰</Text>
                </View>
                <View style={styles.settingsInfo}>
                  <Text style={styles.settingsLabel}>Edit Budget</Text>
                  <Text style={styles.settingsDesc}>Current: {formatCurrency(budget.total)}</Text>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </Pressable>

              <Pressable 
                style={styles.settingsItem}
                onPress={() => { setShowSettingsModal(false); setShowTravelersModal(true); }}
              >
                <View style={[styles.settingsIconBg, { backgroundColor: '#3B82F620' }]}>
                  <Text style={styles.settingsIcon}>👥</Text>
                </View>
                <View style={styles.settingsInfo}>
                  <Text style={styles.settingsLabel}>Manage Travelers</Text>
                  <Text style={styles.settingsDesc}>{participantCount} travelers</Text>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </Pressable>

              <Pressable 
                style={styles.settingsItem}
                onPress={() => { setShowSettingsModal(false); setShowEndTripModal(true); }}
              >
                <View style={[styles.settingsIconBg, { backgroundColor: '#F59E0B20' }]}>
                  <Text style={styles.settingsIcon}>🏁</Text>
                </View>
                <View style={styles.settingsInfo}>
                  <Text style={styles.settingsLabel}>End Trip</Text>
                  <Text style={styles.settingsDesc}>Mark trip as completed</Text>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </Pressable>

              <Pressable 
                style={[styles.settingsItem, styles.settingsItemDanger]}
                onPress={() => { setShowSettingsModal(false); setShowDeleteModal(true); }}
              >
                <View style={[styles.settingsIconBg, { backgroundColor: '#EF444420' }]}>
                  <Text style={styles.settingsIcon}>🗑️</Text>
                </View>
                <View style={styles.settingsInfo}>
                  <Text style={[styles.settingsLabel, { color: '#EF4444' }]}>Delete Trip</Text>
                  <Text style={styles.settingsDesc}>Remove trip permanently</Text>
                </View>
                <Text style={[styles.settingsArrow, { color: '#EF4444' }]}>→</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Dates Modal */}
      <Modal visible={showDatesModal} transparent animationType="slide" onRequestClose={() => setShowDatesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Edit Travel Dates</Text>
              <Pressable onPress={() => setShowDatesModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.datesEditSection}>
              <Pressable 
                style={styles.dateEditCard}
                onPress={() => setShowStartDatePicker(true)}
              >
                <View style={styles.dateEditIcon}>
                  <Text style={styles.dateEditEmoji}>🛫</Text>
                </View>
                <View style={styles.dateEditContent}>
                  <Text style={styles.dateEditLabel}>Start Date</Text>
                  <Text style={styles.dateEditValue}>{editStartDate || 'Select date'}</Text>
                </View>
                <Text style={styles.dateEditArrow}>→</Text>
              </Pressable>

              <Pressable 
                style={styles.dateEditCard}
                onPress={() => setShowEndDatePicker(true)}
              >
                <View style={styles.dateEditIcon}>
                  <Text style={styles.dateEditEmoji}>🛬</Text>
                </View>
                <View style={styles.dateEditContent}>
                  <Text style={styles.dateEditLabel}>End Date</Text>
                  <Text style={styles.dateEditValue}>{editEndDate || 'Select date'}</Text>
                </View>
                <Text style={styles.dateEditArrow}>→</Text>
              </Pressable>

              {editStartDate && editEndDate && (
                <View style={styles.durationPreview}>
                  <Text style={styles.durationPreviewEmoji}>📆</Text>
                  <Text style={styles.durationPreviewText}>
                    Trip duration will be updated
                  </Text>
                </View>
              )}
            </View>

            <Pressable 
              style={[styles.saveButton, (!editStartDate || !editEndDate) && { opacity: 0.5 }]} 
              onPress={handleUpdateDates}
              disabled={!editStartDate || !editEndDate}
            >
              <Text style={styles.saveButtonText}>Save Dates</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Budget Modal */}
      <Modal visible={showBudgetModal} transparent animationType="slide" onRequestClose={() => setShowBudgetModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💰 Edit Budget</Text>
              <Pressable onPress={() => setShowBudgetModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.budgetEditSection}>
              <Text style={styles.budgetEditLabel}>Total Trip Budget</Text>
              <View style={styles.budgetInputRow}>
                <Text style={styles.budgetCurrency}>{currency.symbol}</Text>
                <TextInput
                  style={styles.budgetInputField}
                  value={newBudget}
                  onChangeText={(text) => setNewBudget(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.budgetInfo}>
                <Text style={styles.budgetInfoText}>💳 Spent: {formatCurrency(getTotalExpenses())}</Text>
                <Text style={styles.budgetInfoText}>📊 Remaining: {formatCurrency(parseFloat(newBudget || 0) - getTotalExpenses())}</Text>
              </View>
            </View>

            <Pressable style={styles.saveButton} onPress={handleUpdateBudget}>
              <Text style={styles.saveButtonText}>Save Budget</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Travelers Modal */}
      <Modal visible={showTravelersModal} transparent animationType="slide" onRequestClose={() => setShowTravelersModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Manage Travelers</Text>
              <Pressable onPress={() => setShowTravelersModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>×</Text>
              </Pressable>
            </View>

            {/* Add Traveler */}
            <View style={styles.addTravelerSection}>
              <View style={styles.addTravelerInput}>
                <TextInput
                  style={styles.travelerInput}
                  placeholder="Add traveler name..."
                  placeholderTextColor={colors.textMuted}
                  value={newTravelerName}
                  onChangeText={setNewTravelerName}
                />
                <Pressable 
                  style={[styles.addTravelerBtn, !newTravelerName.trim() && { opacity: 0.5 }]}
                  onPress={handleAddTraveler}
                  disabled={!newTravelerName.trim()}
                >
                  <Text style={styles.addTravelerBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>

            {/* Travelers List */}
            <ScrollView style={styles.travelersList}>
              <View style={styles.travelerCard}>
                <View style={[styles.travelerAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.travelerAvatarText}>You</Text>
                </View>
                <View style={styles.travelerInfo}>
                  <Text style={styles.travelerName}>You</Text>
                  <Text style={styles.travelerRole}>Organizer</Text>
                </View>
              </View>

              {travelers.map((traveler, index) => (
                <View key={index} style={styles.travelerCard}>
                  <View style={styles.travelerAvatar}>
                    <Text style={styles.travelerAvatarText}>{traveler.name?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.travelerInfo}>
                    <Text style={styles.travelerName}>{traveler.name}</Text>
                    <Text style={styles.travelerRole}>{traveler.relation || traveler.type || 'Member'}</Text>
                  </View>
                  <Pressable style={styles.removeTravelerBtn} onPress={() => handleRemoveTraveler(index)}>
                    <Text style={styles.removeTravelerBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <Pressable style={styles.saveButton} onPress={() => setShowTravelersModal(false)}>
              <Text style={styles.saveButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* End Trip Modal */}
      <Modal visible={showEndTripModal} transparent animationType="fade" onRequestClose={() => setShowEndTripModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIconBg}>
              <Text style={styles.confirmIcon}>🏁</Text>
            </View>
            <Text style={styles.confirmTitle}>End Trip?</Text>
            <Text style={styles.confirmText}>
              This will mark your trip as completed. You can view it in your trip history.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => setShowEndTripModal(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmActionBtn} onPress={handleEndTrip}>
                <Text style={styles.confirmActionText}>End Trip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Trip Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={[styles.confirmIconBg, { backgroundColor: '#EF444420' }]}>
              <Text style={styles.confirmIcon}>🗑️</Text>
            </View>
            <Text style={styles.confirmTitle}>Delete Trip?</Text>
            <Text style={styles.confirmText}>
              This action cannot be undone. All trip data including expenses, itinerary, and packing lists will be permanently deleted.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.confirmActionBtn, { backgroundColor: '#EF4444' }]} onPress={handleDeleteTrip}>
                <Text style={styles.confirmActionText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      <DatePickerModal
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onSelect={(date) => setEditStartDate(date)}
        selectedDate={editStartDate}
        title="Select Start Date"
      />
      <DatePickerModal
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onSelect={(date) => setEditEndDate(date)}
        selectedDate={editEndDate}
        title="Select End Date"
        minDate={editStartDate}
      />
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
  headerActions: { flexDirection: 'row', gap: 10 },
  settingsButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  settingsButtonText: { fontSize: 18 },
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

  // Quick Actions
  quickActionsSection: { paddingHorizontal: 20, marginBottom: 20 },
  quickActionsGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  quickActionCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  quickActionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionEmoji: { fontSize: 20 },
  quickActionLabel: { color: colors.text, fontSize: 11, fontWeight: '500', textAlign: 'center' },

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

  // Section
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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' },
  modalCloseBtnText: { color: colors.textMuted, fontSize: 22 },

  // Settings List
  settingsList: { gap: 12 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 14, padding: 14 },
  settingsItemDanger: { backgroundColor: '#EF444410' },
  settingsIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 20 },
  settingsInfo: { flex: 1, marginLeft: 12 },
  settingsLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  settingsDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  settingsArrow: { color: colors.textMuted, fontSize: 18 },

  // Budget Edit
  budgetEditSection: { backgroundColor: colors.cardLight, borderRadius: 16, padding: 20, marginBottom: 20 },
  budgetEditLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  budgetCurrency: { color: colors.text, fontSize: 36, fontWeight: 'bold' },
  budgetInputField: { color: colors.text, fontSize: 48, fontWeight: 'bold', minWidth: 120, textAlign: 'center' },
  budgetInfo: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  budgetInfoText: { color: colors.textMuted, fontSize: 13 },

  // Travelers
  addTravelerSection: { marginBottom: 16 },
  addTravelerInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 12, padding: 4 },
  travelerInput: { flex: 1, color: colors.text, fontSize: 15, padding: 12 },
  addTravelerBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  addTravelerBtnText: { color: colors.bg, fontSize: 14, fontWeight: 'bold' },
  travelersList: { maxHeight: 300 },
  travelerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 12, padding: 12, marginBottom: 10 },
  travelerAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  travelerAvatarText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  travelerInfo: { flex: 1, marginLeft: 12 },
  travelerName: { color: colors.text, fontSize: 15, fontWeight: '500' },
  travelerRole: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  removeTravelerBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  removeTravelerBtnText: { color: colors.textMuted, fontSize: 14 },

  // Save Button
  saveButton: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveButtonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },

  // Confirm Modal
  confirmModal: { backgroundColor: colors.card, borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
  confirmIconBg: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmIcon: { fontSize: 36 },
  confirmTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  confirmText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  confirmButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancelBtn: { flex: 1, backgroundColor: colors.cardLight, borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmCancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  confirmActionBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmActionText: { color: colors.bg, fontSize: 15, fontWeight: 'bold' },

  // Add Date Edit styles
  datesEditSection: { gap: 12, marginBottom: 20 },
  dateEditCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.cardLight, 
    borderRadius: 14, 
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  dateEditIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: colors.primaryMuted, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  dateEditEmoji: { fontSize: 22 },
  dateEditContent: { flex: 1, marginLeft: 14 },
  dateEditLabel: { color: colors.textMuted, fontSize: 12 },
  dateEditValue: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 4 },
  dateEditArrow: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  durationPreview: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.primaryMuted, 
    borderRadius: 12, 
    padding: 12,
    gap: 10,
  },
  durationPreviewEmoji: { fontSize: 18 },
  durationPreviewText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
});
