import React, { useState, useMemo } from 'react';
import { 
  View, Text, ScrollView, TextInput, TouchableOpacity, 
  Modal, StyleSheet, Dimensions, Alert
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
    formatCurrency, 
    currency = { symbol: '₹', code: 'INR' }
  } = useTravelContext();
  const { colors } = useTheme();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'category'
  const [newExpense, setNewExpense] = useState({
    title: '', 
    amount: '', 
    category: 'food',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 
    notes: ''
  });

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleAddExpense = () => {
    if (newExpense.title.trim() && newExpense.amount) {
      addExpense({ 
        ...newExpense, 
        amount: parseFloat(newExpense.amount) || 0,
        timestamp: Date.now() 
      });
      setNewExpense({ 
        title: '', 
        amount: '', 
        category: 'food', 
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 
        notes: '' 
      });
      setModalVisible(false);
    }
  };

  const handleDeleteExpense = (id, title) => {
    Alert.alert('Delete Expense', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) }
    ]);
  };

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];
  
  const totalExpenses = getTotalExpenses ? getTotalExpenses() : 0;
  const remainingBudget = getRemainingBudget ? getRemainingBudget() : (budget.total || 0);
  const budgetTotal = budget.total || 0;
  const spentPercentage = budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : 0;
  const expensesByCategory = getExpensesByCategory ? getExpensesByCategory() : {};

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory);

  const sortedExpenses = [...filteredExpenses].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const groupedExpenses = sortedExpenses.reduce((groups, expense) => {
    const date = expense.date || 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {});

  const dateGroups = Object.keys(groupedExpenses);
  const uniqueDates = [...new Set(expenses.map(e => e.date))];
  const dailyAverage = uniqueDates.length > 0 ? Math.round(totalExpenses / uniqueDates.length) : 0;

  const safeFormatCurrency = (amount) => {
    if (formatCurrency) return formatCurrency(amount);
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Calculate pie chart data
  const pieData = CATEGORIES.map(cat => ({
    ...cat,
    value: expensesByCategory[cat.key] || 0,
    percentage: totalExpenses > 0 ? ((expensesByCategory[cat.key] || 0) / totalExpenses) * 100 : 0
  })).filter(item => item.value > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💳 Expenses</Text>
          <Text style={styles.headerSubtitle}>Track your spending</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Budget Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetTop}>
            <View style={styles.budgetMain}>
              <Text style={styles.budgetLabel}>Total Spent</Text>
              <Text style={styles.budgetAmount}>{safeFormatCurrency(totalExpenses)}</Text>
              <Text style={styles.budgetOf}>of {safeFormatCurrency(budgetTotal)} budget</Text>
            </View>
            <View style={styles.percentCircle}>
              <Text style={styles.percentText}>{Math.min(spentPercentage, 100).toFixed(0)}%</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { 
              width: `${Math.min(spentPercentage, 100)}%`,
              backgroundColor: spentPercentage > 90 ? '#EF4444' : spentPercentage > 70 ? '#F59E0B' : '#10B981'
            }]} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💵</Text>
              <Text style={styles.statValue}>{safeFormatCurrency(remainingBudget)}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={styles.statValue}>{safeFormatCurrency(dailyAverage)}</Text>
              <Text style={styles.statLabel}>Daily Avg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🧾</Text>
              <Text style={styles.statValue}>{expenses.length}</Text>
              <Text style={styles.statLabel}>Items</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown - New Visual Design */}
        {totalExpenses > 0 && (
          <View style={styles.categoryBreakdown}>
            <Text style={styles.sectionTitle}>📊 Spending Breakdown</Text>
            
            {/* Horizontal Bar Chart */}
            <View style={styles.barChart}>
              {pieData.map((item, index) => (
                <View key={item.key} style={styles.barChartRow}>
                  <View style={styles.barChartLabel}>
                    <Text style={styles.barChartEmoji}>{item.emoji}</Text>
                    <Text style={styles.barChartName}>{item.label}</Text>
                  </View>
                  <View style={styles.barChartBarContainer}>
                    <View style={[styles.barChartBar, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
                  </View>
                  <View style={styles.barChartValue}>
                    <Text style={[styles.barChartAmount, { color: item.color }]}>{safeFormatCurrency(item.value)}</Text>
                    <Text style={styles.barChartPercent}>{item.percentage.toFixed(0)}%</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Category Pills */}
            <View style={styles.categoryPills}>
              {pieData.map((item) => (
                <TouchableOpacity 
                  key={item.key}
                  style={[
                    styles.categoryPill,
                    filterCategory === item.key && { backgroundColor: item.color }
                  ]}
                  onPress={() => setFilterCategory(filterCategory === item.key ? 'all' : item.key)}
                >
                  <View style={[styles.categoryPillDot, { backgroundColor: filterCategory === item.key ? '#FFF' : item.color }]} />
                  <Text style={[styles.categoryPillText, filterCategory === item.key && { color: '#FFF' }]}>
                    {item.emoji} {safeFormatCurrency(item.value)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>📋 List</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'category' && styles.toggleBtnActive]}
            onPress={() => setViewMode('category')}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'category' && styles.toggleBtnTextActive]}>📊 By Category</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity 
            style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text style={[styles.filterText, filterCategory === 'all' && styles.filterTextActive]}>All ({expenses.length})</Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => {
            const count = expenses.filter(e => e.category === cat.key).length;
            if (count === 0) return null;
            return (
              <TouchableOpacity 
                key={cat.key}
                style={[styles.filterChip, filterCategory === cat.key && { backgroundColor: cat.color }]}
                onPress={() => setFilterCategory(filterCategory === cat.key ? 'all' : cat.key)}
              >
                <Text style={[styles.filterText, filterCategory === cat.key && { color: '#FFF' }]}>{cat.emoji} {count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💳 Transactions</Text>
            <Text style={styles.sectionCount}>{filteredExpenses.length} items</Text>
          </View>

          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>Start tracking your spending</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.emptyBtnText}>+ Add Expense</Text>
              </TouchableOpacity>
            </View>
          ) : viewMode === 'list' ? (
            // List View - Grouped by Date
            <View style={styles.transactionsList}>
              {dateGroups.map((date) => (
                <View key={date} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{date}</Text>
                    <View style={styles.dateLine} />
                    <Text style={styles.dateTotal}>
                      {safeFormatCurrency(groupedExpenses[date].reduce((s, e) => s + (parseFloat(e.amount) || 0), 0))}
                    </Text>
                  </View>
                  {groupedExpenses[date].map((expense) => {
                    const cat = getCategoryInfo(expense.category);
                    return (
                      <View key={expense.id} style={[styles.expenseCard, { borderLeftColor: cat.color }]}>
                        <View style={[styles.expenseIcon, { backgroundColor: cat.color + '20' }]}>
                          <Text style={styles.expenseEmoji}>{cat.emoji}</Text>
                        </View>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseTitle}>{expense.title}</Text>
                          <Text style={styles.expenseCategory}>{cat.label}</Text>
                          {expense.notes ? <Text style={styles.expenseNotes}>📝 {expense.notes}</Text> : null}
                        </View>
                        <View style={styles.expenseRight}>
                          <Text style={styles.expenseAmount}>-{safeFormatCurrency(expense.amount)}</Text>
                          <TouchableOpacity onPress={() => handleDeleteExpense(expense.id, expense.title)} style={styles.deleteBtn}>
                            <Text style={styles.deleteBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : (
            // Category View - Grouped by Category
            <View style={styles.categoryView}>
              {CATEGORIES.map((cat) => {
                const categoryExpenses = expenses.filter(e => e.category === cat.key);
                if (categoryExpenses.length === 0) return null;
                const categoryTotal = categoryExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                
                return (
                  <View key={cat.key} style={styles.categorySection}>
                    <View style={[styles.categorySectionHeader, { backgroundColor: cat.color + '15' }]}>
                      <View style={styles.categorySectionLeft}>
                        <Text style={styles.categorySectionEmoji}>{cat.emoji}</Text>
                        <View>
                          <Text style={styles.categorySectionTitle}>{cat.label}</Text>
                          <Text style={styles.categorySectionCount}>{categoryExpenses.length} expenses</Text>
                        </View>
                      </View>
                      <Text style={[styles.categorySectionTotal, { color: cat.color }]}>{safeFormatCurrency(categoryTotal)}</Text>
                    </View>
                    
                    {categoryExpenses.slice(0, 3).map((expense) => (
                      <View key={expense.id} style={styles.categoryExpenseItem}>
                        <Text style={styles.categoryExpenseTitle}>{expense.title}</Text>
                        <Text style={styles.categoryExpenseAmount}>-{safeFormatCurrency(expense.amount)}</Text>
                      </View>
                    ))}
                    
                    {categoryExpenses.length > 3 && (
                      <TouchableOpacity 
                        style={styles.categoryShowMore}
                        onPress={() => setFilterCategory(cat.key)}
                      >
                        <Text style={[styles.categoryShowMoreText, { color: cat.color }]}>
                          +{categoryExpenses.length - 3} more →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Add</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Amount */}
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Amount</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={newExpense.amount}
                    onChangeText={(t) => setNewExpense({...newExpense, amount: t.replace(/[^0-9.]/g, '')})}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What did you spend on?"
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.title}
                  onChangeText={(t) => setNewExpense({...newExpense, title: t})}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.catItem, newExpense.category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                      onPress={() => setNewExpense({...newExpense, category: cat.key})}
                    >
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.catText, newExpense.category === cat.key && { color: '#FFF' }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Add details..."
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.notes}
                  onChangeText={(t) => setNewExpense({...newExpense, notes: t})}
                  multiline
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, (!newExpense.title.trim() || !newExpense.amount) && { opacity: 0.5 }]}
                onPress={handleAddExpense}
                disabled={!newExpense.title.trim() || !newExpense.amount}
              >
                <Text style={styles.submitBtnText}>✓ Add Expense</Text>
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 20 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: colors.bg, fontSize: 14, fontWeight: 'bold' },

  // Budget Card
  budgetCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  budgetMain: {},
  budgetLabel: { color: colors.textMuted, fontSize: 12 },
  budgetAmount: { color: colors.text, fontSize: 32, fontWeight: 'bold', marginVertical: 4 },
  budgetOf: { color: colors.textMuted, fontSize: 13 },
  percentCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  percentText: { color: colors.primary, fontSize: 15, fontWeight: 'bold' },
  
  progressBar: { height: 8, backgroundColor: colors.cardLight, borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  
  statsRow: { flexDirection: 'row', backgroundColor: colors.cardLight, borderRadius: 14, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.primaryBorder },

  // Category Breakdown
  categoryBreakdown: { marginHorizontal: 20, marginBottom: 16 },
  
  barChart: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: 12 },
  barChartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barChartLabel: { width: 80, flexDirection: 'row', alignItems: 'center' },
  barChartEmoji: { fontSize: 16, marginRight: 6 },
  barChartName: { color: colors.textMuted, fontSize: 11 },
  barChartBarContainer: { flex: 1, height: 8, backgroundColor: colors.cardLight, borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  barChartBar: { height: '100%', borderRadius: 4 },
  barChartValue: { width: 70, alignItems: 'flex-end' },
  barChartAmount: { fontSize: 12, fontWeight: 'bold' },
  barChartPercent: { color: colors.textMuted, fontSize: 10 },

  categoryPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryPillDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  categoryPillText: { color: colors.text, fontSize: 12, fontWeight: '500' },

  // View Toggle
  viewToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.primaryBorder },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  toggleBtnTextActive: { color: colors.bg, fontWeight: '600' },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: 'bold', marginBottom: 12 },
  sectionCount: { color: colors.textMuted, fontSize: 13 },

  filterScroll: { marginBottom: 16 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primaryBorder },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: colors.bg },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  emptyBtn: { marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: colors.bg, fontWeight: 'bold' },

  transactionsList: { gap: 16 },
  dateGroup: {},
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateText: { color: colors.primary, fontSize: 12, fontWeight: '600', backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: colors.primaryBorder, marginHorizontal: 10 },
  dateTotal: { color: colors.textMuted, fontSize: 12 },

  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.primaryBorder, borderLeftWidth: 4 },
  expenseIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expenseEmoji: { fontSize: 20 },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  expenseCategory: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  expenseNotes: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { marginTop: 6, padding: 4 },
  deleteBtnText: { fontSize: 14 },

  // Category View
  categoryView: { gap: 12 },
  categorySection: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.primaryBorder },
  categorySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  categorySectionLeft: { flexDirection: 'row', alignItems: 'center' },
  categorySectionEmoji: { fontSize: 24, marginRight: 12 },
  categorySectionTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  categorySectionCount: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  categorySectionTotal: { fontSize: 18, fontWeight: 'bold' },
  categoryExpenseItem: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  categoryExpenseTitle: { color: colors.text, fontSize: 14 },
  categoryExpenseAmount: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  categoryShowMore: { paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  categoryShowMoreText: { fontSize: 13, fontWeight: '600' },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, elevation: 5 },
  fabIcon: { color: colors.bg, fontSize: 20, fontWeight: 'bold', marginRight: 6 },
  fabText: { color: colors.bg, fontSize: 15, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: colors.textMuted, fontSize: 18 },

  // Amount
  amountBox: { backgroundColor: colors.cardLight, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  amountLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  amountInput: { color: colors.text, fontSize: 40, fontWeight: 'bold', minWidth: 80, textAlign: 'center' },

  // Inputs
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: colors.cardLight, color: colors.text, padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: colors.primaryBorder },

  // Category Select
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  catEmoji: { fontSize: 16, marginRight: 6 },
  catText: { color: colors.text, fontSize: 12, fontWeight: '500' },

  // Submit
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
});
