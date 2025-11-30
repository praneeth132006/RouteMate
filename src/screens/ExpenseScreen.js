import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, ScrollView, TextInput, 
  Modal, StyleSheet, Animated, Pressable, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'accommodation', label: 'Stay', emoji: '🏨', color: '#8B5CF6' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3B82F6' },
  { key: 'food', label: 'Food', emoji: '🍽️', color: '#F59E0B' },
  { key: 'activities', label: 'Activities', emoji: '🎭', color: '#10B981' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#EC4899' },
  { key: 'other', label: 'Other', emoji: '📦', color: '#6B7280' },
];

export default function ExpenseScreen() {
  const { 
    expenses = [], 
    addExpense, 
    deleteExpense, 
    getTotalExpenses, 
    budget = { total: 0 }, 
    getRemainingBudget, 
    getExpensesByCategory, 
    tripInfo = {}, 
    formatCurrency, 
    currency = { symbol: '$' }
  } = useTravelContext();
  const { colors } = useTheme();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'chart'
  
  const [newExpense, setNewExpense] = useState({
    title: '', 
    amount: '', 
    category: 'food',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 
    notes: '',
    location: '',
    paymentMethod: 'cash',
  });

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleAddExpense = () => {
    if (newExpense.title && newExpense.amount) {
      addExpense({ 
        ...newExpense, 
        amount: parseFloat(newExpense.amount),
        timestamp: Date.now(),
      });
      setNewExpense({ 
        title: '', 
        amount: '', 
        category: 'food', 
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 
        notes: '',
        location: '',
        paymentMethod: 'cash',
      });
      setModalVisible(false);
    }
  };

  const handleDeleteExpense = (id) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
      ]
    );
  };

  const openExpenseDetail = (expense) => {
    setSelectedExpense(expense);
    setDetailModalVisible(true);
  };

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];
  
  const totalExpenses = getTotalExpenses ? getTotalExpenses() : 0;
  const remainingBudget = getRemainingBudget ? getRemainingBudget() : budget.total;
  const spentPercentage = budget.total > 0 ? (totalExpenses / budget.total) * 100 : 0;
  const expensesByCategory = getExpensesByCategory ? getExpensesByCategory() : {};

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory);

  const sortedExpenses = [...filteredExpenses].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Group by date
  const groupedExpenses = sortedExpenses.reduce((groups, expense) => {
    const date = expense.date || 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {});

  const dateGroups = Object.keys(groupedExpenses);

  // Calculate insights
  const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
  const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0];
  const uniqueDates = [...new Set(expenses.map(e => e.date))];
  const dailyAvg = uniqueDates.length > 0 ? totalExpenses / uniqueDates.length : 0;

  const formatAmount = (amount) => {
    return formatCurrency ? formatCurrency(amount) : `${currency.symbol}${amount}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>💳 Expenses</Text>
            <Text style={styles.headerSubtitle}>Smart expense tracking</Text>
          </View>
          <Pressable 
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Budget Overview Card */}
        <Animated.View style={[styles.budgetCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetIconContainer}>
              <Text style={styles.budgetIcon}>💰</Text>
            </View>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetLabel}>Total Spent</Text>
              <Text style={styles.budgetAmount}>{formatAmount(totalExpenses)}</Text>
            </View>
            <View style={styles.budgetCircle}>
              <Text style={styles.budgetPercent}>{Math.min(spentPercentage, 100).toFixed(0)}%</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(spentPercentage, 100)}%`,
                    backgroundColor: spentPercentage > 90 ? '#EF4444' : spentPercentage > 70 ? '#F59E0B' : '#10B981'
                  }
                ]} 
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>{formatAmount(0)}</Text>
              <Text style={styles.progressLabel}>Budget: {formatAmount(budget.total)}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>💵</Text>
              <Text style={styles.statValue}>{formatAmount(remainingBudget)}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={styles.statValue}>{formatAmount(dailyAvg)}</Text>
              <Text style={styles.statLabel}>Daily Avg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🧾</Text>
              <Text style={styles.statValue}>{expenses.length}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Insights */}
        {expenses.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>💡 Smart Insights</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insightsScroll}>
              <View style={[styles.insightCard, { backgroundColor: '#3B82F620' }]}>
                <Text style={styles.insightEmoji}>📈</Text>
                <Text style={styles.insightValue}>{formatAmount(avgExpense)}</Text>
                <Text style={styles.insightLabel}>Avg per expense</Text>
              </View>
              {topCategory && (
                <View style={[styles.insightCard, { backgroundColor: getCategoryInfo(topCategory[0]).color + '20' }]}>
                  <Text style={styles.insightEmoji}>{getCategoryInfo(topCategory[0]).emoji}</Text>
                  <Text style={styles.insightValue}>{formatAmount(topCategory[1])}</Text>
                  <Text style={styles.insightLabel}>Top: {getCategoryInfo(topCategory[0]).label}</Text>
                </View>
              )}
              <View style={[styles.insightCard, { backgroundColor: '#10B98120' }]}>
                <Text style={styles.insightEmoji}>📅</Text>
                <Text style={styles.insightValue}>{uniqueDates.length}</Text>
                <Text style={styles.insightLabel}>Active days</Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Category Breakdown */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>📊 By Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const spent = expensesByCategory[cat.key] || 0;
              const percentage = totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0;
              const isActive = filterCategory === cat.key;
              
              return (
                <Pressable 
                  key={cat.key} 
                  style={[
                    styles.categoryCard,
                    isActive && { borderColor: cat.color, borderWidth: 2, backgroundColor: cat.color + '10' }
                  ]}
                  onPress={() => setFilterCategory(isActive ? 'all' : cat.key)}
                >
                  <View style={[styles.categoryIconBg, { backgroundColor: cat.color + '25' }]}>
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  </View>
                  <Text style={styles.categoryName}>{cat.label}</Text>
                  <Text style={[styles.categoryAmount, { color: cat.color }]}>{formatAmount(spent)}</Text>
                  <View style={styles.categoryBar}>
                    <View style={[styles.categoryBarFill, { width: `${percentage}%`, backgroundColor: cat.color }]} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterSection}>
          <Pressable 
            style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>
              🌟 All ({expenses.length})
            </Text>
          </Pressable>
          {CATEGORIES.map((cat) => {
            const count = expenses.filter(e => e.category === cat.key).length;
            if (count === 0) return null;
            return (
              <Pressable 
                key={cat.key}
                style={[styles.filterChip, filterCategory === cat.key && { backgroundColor: cat.color }]}
                onPress={() => setFilterCategory(filterCategory === cat.key ? 'all' : cat.key)}
              >
                <Text style={[styles.filterChipText, filterCategory === cat.key && styles.filterChipTextActive]}>
                  {cat.emoji} {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Expenses List */}
        <View style={styles.expensesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💳 Recent Transactions</Text>
            <Text style={styles.sectionCount}>{filteredExpenses.length} items</Text>
          </View>

          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>💸</Text>
              </View>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptySubtitle}>Tap the button below to add your first expense</Text>
              <Pressable style={styles.emptyButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.emptyButtonText}>+ Add First Expense</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.expensesList}>
              {dateGroups.map((date) => (
                <View key={date} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateText}>{date}</Text>
                    </View>
                    <View style={styles.dateLine} />
                    <Text style={styles.dateTotalText}>
                      {formatAmount(groupedExpenses[date].reduce((sum, e) => sum + (e.amount || 0), 0))}
                    </Text>
                  </View>

                  {groupedExpenses[date].map((expense, index) => {
                    const category = getCategoryInfo(expense.category);
                    return (
                      <Pressable 
                        key={expense.id || index} 
                        style={({ pressed }) => [
                          styles.expenseCard,
                          { borderLeftColor: category.color },
                          pressed && styles.expenseCardPressed
                        ]}
                        onPress={() => openExpenseDetail(expense)}
                        onLongPress={() => handleDeleteExpense(expense.id)}
                      >
                        <View style={[styles.expenseIconBg, { backgroundColor: category.color + '20' }]}>
                          <Text style={styles.expenseEmoji}>{category.emoji}</Text>
                        </View>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseTitle} numberOfLines={1}>{expense.title}</Text>
                          <View style={styles.expenseMeta}>
                            <View style={[styles.categoryBadge, { backgroundColor: category.color + '15' }]}>
                              <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.label}</Text>
                            </View>
                            {expense.paymentMethod && (
                              <Text style={styles.paymentMethod}>
                                {expense.paymentMethod === 'cash' ? '💵' : '💳'} {expense.paymentMethod}
                              </Text>
                            )}
                          </View>
                          {expense.notes && (
                            <Text style={styles.expenseNotes} numberOfLines={1}>📝 {expense.notes}</Text>
                          )}
                        </View>
                        <View style={styles.expenseRight}>
                          <Text style={styles.expenseAmount}>-{formatAmount(expense.amount)}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable 
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Add Expense</Text>
      </Pressable>

      {/* Add Expense Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ New Expense</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Amount Input */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>How much?</Text>
                <View style={styles.amountInputRow}>
                  <Text style={styles.amountCurrency}>{currency.symbol}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={newExpense.amount}
                    onChangeText={(text) => setNewExpense({...newExpense, amount: text.replace(/[^0-9.]/g, '')})}
                    autoFocus
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What did you spend on?"
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.title}
                  onChangeText={(text) => setNewExpense({...newExpense, title: text})}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📁 Category</Text>
                <View style={styles.categorySelectGrid}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.key}
                      style={[
                        styles.categorySelectItem,
                        newExpense.category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }
                      ]}
                      onPress={() => setNewExpense({...newExpense, category: cat.key})}
                    >
                      <Text style={styles.categorySelectEmoji}>{cat.emoji}</Text>
                      <Text style={[
                        styles.categorySelectText, 
                        newExpense.category === cat.key && { color: '#FFF', fontWeight: 'bold' }
                      ]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Payment Method */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>💳 Payment Method</Text>
                <View style={styles.paymentMethodGrid}>
                  {[
                    { key: 'cash', label: 'Cash', emoji: '💵' },
                    { key: 'card', label: 'Card', emoji: '💳' },
                    { key: 'upi', label: 'UPI', emoji: '📱' },
                    { key: 'other', label: 'Other', emoji: '🔄' },
                  ].map((method) => (
                    <Pressable
                      key={method.key}
                      style={[
                        styles.paymentMethodItem,
                        newExpense.paymentMethod === method.key && styles.paymentMethodItemActive
                      ]}
                      onPress={() => setNewExpense({...newExpense, paymentMethod: method.key})}
                    >
                      <Text style={styles.paymentMethodEmoji}>{method.emoji}</Text>
                      <Text style={[
                        styles.paymentMethodText,
                        newExpense.paymentMethod === method.key && styles.paymentMethodTextActive
                      ]}>
                        {method.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📍 Location (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Where did you spend?"
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.location}
                  onChangeText={(text) => setNewExpense({...newExpense, location: text})}
                />
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📋 Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Any additional details..."
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.notes}
                  onChangeText={(text) => setNewExpense({...newExpense, notes: text})}
                  multiline
                />
              </View>

              {/* Submit Button */}
              <Pressable
                style={[
                  styles.submitButton,
                  (!newExpense.title || !newExpense.amount) && styles.submitButtonDisabled
                ]}
                onPress={handleAddExpense}
                disabled={!newExpense.title || !newExpense.amount}
              >
                <Text style={styles.submitButtonText}>✓ Add Expense</Text>
              </Pressable>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Expense Detail Modal */}
      <Modal animationType="fade" transparent visible={detailModalVisible} onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.detailOverlay}>
          <Pressable style={styles.detailBackdrop} onPress={() => setDetailModalVisible(false)} />
          {selectedExpense && (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={[styles.detailIconBg, { backgroundColor: getCategoryInfo(selectedExpense.category).color + '20' }]}>
                  <Text style={styles.detailIcon}>{getCategoryInfo(selectedExpense.category).emoji}</Text>
                </View>
                <Pressable onPress={() => setDetailModalVisible(false)} style={styles.detailClose}>
                  <Text style={styles.detailCloseText}>✕</Text>
                </Pressable>
              </View>
              
              <Text style={styles.detailTitle}>{selectedExpense.title}</Text>
              <Text style={styles.detailAmount}>-{formatAmount(selectedExpense.amount)}</Text>
              
              <View style={styles.detailInfo}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📁 Category</Text>
                  <Text style={styles.detailValue}>{getCategoryInfo(selectedExpense.category).label}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📅 Date</Text>
                  <Text style={styles.detailValue}>{selectedExpense.date}</Text>
                </View>
                {selectedExpense.paymentMethod && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>💳 Payment</Text>
                    <Text style={styles.detailValue}>{selectedExpense.paymentMethod}</Text>
                  </View>
                )}
                {selectedExpense.location && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📍 Location</Text>
                    <Text style={styles.detailValue}>{selectedExpense.location}</Text>
                  </View>
                )}
                {selectedExpense.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📝 Notes</Text>
                    <Text style={styles.detailValue}>{selectedExpense.notes}</Text>
                  </View>
                )}
              </View>

              <Pressable 
                style={styles.deleteButton}
                onPress={() => {
                  handleDeleteExpense(selectedExpense.id);
                  setDetailModalVisible(false);
                }}
              >
                <Text style={styles.deleteButtonText}>🗑️ Delete Expense</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 20 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 26, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addButtonPressed: { opacity: 0.8 },
  addButtonText: { color: colors.bg, fontSize: 14, fontWeight: 'bold' },

  // Budget Card
  budgetCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  budgetIconContainer: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  budgetIcon: { fontSize: 24 },
  budgetInfo: { flex: 1, marginLeft: 14 },
  budgetLabel: { color: colors.textMuted, fontSize: 12 },
  budgetAmount: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  budgetCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  budgetPercent: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  progressContainer: { marginBottom: 20 },
  progressTrack: { height: 10, backgroundColor: colors.cardLight, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { color: colors.textMuted, fontSize: 11 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.cardLight, borderRadius: 16, padding: 14 },
  statBox: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 18, marginBottom: 6 },
  statValue: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.primaryBorder },

  // Insights
  insightsContainer: { marginBottom: 20, paddingHorizontal: 20 },
  insightsScroll: { paddingRight: 20 },
  insightCard: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, marginRight: 12, minWidth: 130, alignItems: 'center' },
  insightEmoji: { fontSize: 24, marginBottom: 8 },
  insightValue: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  insightLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },

  // Categories
  categorySection: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: { width: (width - 60) / 3, backgroundColor: colors.card, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  categoryIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  categoryEmoji: { fontSize: 22 },
  categoryName: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  categoryAmount: { fontSize: 14, fontWeight: 'bold' },
  categoryBar: { width: '100%', height: 4, backgroundColor: colors.cardLight, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 2 },

  // Filter
  filterSection: { paddingHorizontal: 20, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primaryBorder, marginRight: 10 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: colors.bg, fontWeight: 'bold' },

  // Expenses
  expensesSection: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionCount: { color: colors.textMuted, fontSize: 13 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 50, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: colors.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
  emptyButton: { marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyButtonText: { color: colors.bg, fontSize: 15, fontWeight: 'bold' },

  // Expenses List
  expensesList: { gap: 20 },
  dateGroup: {},
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dateBadge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dateText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  dateLine: { flex: 1, height: 1, backgroundColor: colors.primaryBorder, marginHorizontal: 12 },
  dateTotalText: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.primaryBorder, borderLeftWidth: 4 },
  expenseCardPressed: { opacity: 0.8 },
  expenseIconBg: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expenseEmoji: { fontSize: 22 },
  expenseInfo: { flex: 1, marginLeft: 14 },
  expenseTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontWeight: '500' },
  paymentMethod: { color: colors.textMuted, fontSize: 11 },
  expenseNotes: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  expenseRight: {},
  expenseAmount: { color: '#EF4444', fontSize: 17, fontWeight: 'bold' },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 22, borderRadius: 18, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 10 },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  fabIcon: { color: colors.bg, fontSize: 22, fontWeight: 'bold', marginRight: 8 },
  fabText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 24, maxHeight: '92%' },
  modalHandle: { width: 48, height: 5, backgroundColor: colors.textMuted, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  modalClose: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: colors.textMuted, fontSize: 18 },

  // Amount Section
  amountSection: { backgroundColor: colors.cardLight, borderRadius: 20, padding: 28, marginBottom: 24, alignItems: 'center' },
  amountLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 12 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center' },
  amountCurrency: { color: colors.text, fontSize: 38, fontWeight: 'bold', marginRight: 4 },
  amountInput: { color: colors.text, fontSize: 48, fontWeight: 'bold', minWidth: 100, textAlign: 'center' },

  // Input Groups
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  input: { backgroundColor: colors.cardLight, color: colors.text, padding: 16, borderRadius: 14, fontSize: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  notesInput: { height: 90, textAlignVertical: 'top' },

  // Category Select
  categorySelectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categorySelectItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.primaryBorder },
  categorySelectEmoji: { fontSize: 18, marginRight: 8 },
  categorySelectText: { color: colors.text, fontSize: 13, fontWeight: '500' },

  // Payment Method
  paymentMethodGrid: { flexDirection: 'row', gap: 10 },
  paymentMethodItem: { flex: 1, alignItems: 'center', backgroundColor: colors.cardLight, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: colors.primaryBorder },
  paymentMethodItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  paymentMethodEmoji: { fontSize: 22, marginBottom: 6 },
  paymentMethodText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  paymentMethodTextActive: { color: colors.primary, fontWeight: 'bold' },

  // Submit
  submitButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.bg, fontSize: 17, fontWeight: 'bold' },

  // Detail Modal
  detailOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  detailCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, width: width - 48, maxWidth: 400 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detailIconBg: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  detailIcon: { fontSize: 28 },
  detailClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' },
  detailCloseText: { color: colors.textMuted, fontSize: 16 },
  detailTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  detailAmount: { color: '#EF4444', fontSize: 32, fontWeight: 'bold', marginTop: 8, marginBottom: 24 },
  detailInfo: { backgroundColor: colors.cardLight, borderRadius: 16, padding: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  detailLabel: { color: colors.textMuted, fontSize: 14 },
  detailValue: { color: colors.text, fontSize: 14, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 16 },
  deleteButton: { backgroundColor: '#EF444420', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  deleteButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
