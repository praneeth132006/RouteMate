import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, ScrollView, TextInput, TouchableOpacity, 
  Modal, StyleSheet, Animated, Pressable, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation', emoji: '🏨', color: '#8B5CF6' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3B82F6' },
  { key: 'food', label: 'Food & Drinks', emoji: '🍽️', color: '#F59E0B' },
  { key: 'activities', label: 'Activities', emoji: '🎭', color: '#10B981' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#EC4899' },
  { key: 'other', label: 'Other', emoji: '📦', color: '#6B7280' },
];

const SPLIT_TYPES = [
  { key: 'equal', label: 'Equal Split', emoji: '⚖️', description: 'Split equally among selected' },
  { key: 'custom', label: 'Custom Split', emoji: '✏️', description: 'Set custom amounts' },
  { key: 'percentage', label: 'By Percentage', emoji: '📊', description: 'Split by percentage' },
  { key: 'full', label: 'No Split', emoji: '💳', description: 'Paid by one person only' },
];

export default function ExpenseScreen() {
  const { 
    expenses, addExpense, deleteExpense, getTotalExpenses, budget, getRemainingBudget, 
    getExpensesByCategory, tripInfo, formatCurrency, currency 
  } = useTravelContext();
  const { colors } = useTheme();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('expenses');
  
  // Check if trip is group type
  const isGroupTrip = ['friends', 'family', 'group', 'couple', 'business'].includes(tripInfo.tripType);
  
  // Build participants list
  const participants = useMemo(() => {
    const list = [{ id: 'self', name: 'You', isOrganizer: true }];
    if (tripInfo.participants) {
      tripInfo.participants.forEach((p, index) => {
        list.push({ 
          id: `participant_${index}`, 
          name: p.name, 
          relation: p.relation || p.type || 'Member' 
        });
      });
    }
    return list;
  }, [tripInfo.participants]);

  const [newExpense, setNewExpense] = useState({
    title: '', 
    amount: '', 
    category: 'food',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 
    notes: '',
    paidBy: 'self',
    splitType: 'equal',
    splitWith: participants.map(p => p.id),
    customSplits: {},
    percentageSplits: {},
  });

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  // Update splitWith when participants change
  useEffect(() => {
    setNewExpense(prev => ({
      ...prev,
      splitWith: participants.map(p => p.id),
    }));
  }, [participants]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleAddExpense = () => {
    if (newExpense.title && newExpense.amount) {
      const amount = parseFloat(newExpense.amount);
      
      let splits = [];
      if (isGroupTrip && newExpense.splitType !== 'full' && newExpense.splitWith.length > 0) {
        if (newExpense.splitType === 'equal') {
          const splitAmount = amount / newExpense.splitWith.length;
          splits = newExpense.splitWith.map(id => ({
            odBy: id,
            amount: Math.round(splitAmount * 100) / 100,
            percentage: Math.round((100 / newExpense.splitWith.length) * 100) / 100,
          }));
        } else if (newExpense.splitType === 'custom') {
          splits = newExpense.splitWith.map(id => ({
            odBy: id,
            amount: parseFloat(newExpense.customSplits[id]) || 0,
          }));
        } else if (newExpense.splitType === 'percentage') {
          splits = newExpense.splitWith.map(id => ({
            odBy: id,
            percentage: parseFloat(newExpense.percentageSplits[id]) || 0,
            amount: Math.round((amount * (parseFloat(newExpense.percentageSplits[id]) || 0) / 100) * 100) / 100,
          }));
        }
      }

      addExpense({ 
        ...newExpense, 
        amount,
        splits,
        isGroupExpense: isGroupTrip && newExpense.splitType !== 'full',
      });
      
      resetNewExpense();
      setModalVisible(false);
    }
  };

  const resetNewExpense = () => {
    setNewExpense({ 
      title: '', 
      amount: '', 
      category: 'food', 
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 
      notes: '',
      paidBy: 'self',
      splitType: 'equal',
      splitWith: participants.map(p => p.id),
      customSplits: {},
      percentageSplits: {},
    });
  };

  const toggleParticipant = (id) => {
    if (newExpense.splitWith.includes(id)) {
      if (newExpense.splitWith.length > 1) {
        setNewExpense({ ...newExpense, splitWith: newExpense.splitWith.filter(p => p !== id) });
      }
    } else {
      setNewExpense({ ...newExpense, splitWith: [...newExpense.splitWith, id] });
    }
  };

  const getEqualSplitAmount = () => {
    if (!newExpense.amount || newExpense.splitWith.length === 0) return 0;
    return Math.round((parseFloat(newExpense.amount) / newExpense.splitWith.length) * 100) / 100;
  };

  const getCustomSplitTotal = () => {
    return Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const getPercentageTotal = () => {
    return Object.values(newExpense.percentageSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];
  const remainingBudget = getRemainingBudget();
  const totalExpenses = getTotalExpenses();
  const spentPercentage = budget.total > 0 ? (totalExpenses / budget.total) * 100 : 0;
  const expensesByCategory = getExpensesByCategory();

  // Calculate settlements for group trips
  const calculateSettlements = () => {
    const balances = {};
    participants.forEach(p => { balances[p.id] = 0; });

    expenses.forEach(expense => {
      if (expense.isGroupExpense && expense.splits && expense.paidBy) {
        balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
        expense.splits.forEach(split => {
          if (split.odBy) {
            balances[split.odBy] = (balances[split.odBy] || 0) - split.amount;
          }
        });
      }
    });

    const settlements = [];
    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(id => {
      if (balances[id] > 0.01) {
        creditors.push({ id, amount: balances[id] });
      } else if (balances[id] < -0.01) {
        debtors.push({ id, amount: -balances[id] });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);
      if (amount > 0.01) {
        settlements.push({
          from: debtors[i].id,
          to: creditors[j].id,
          amount: Math.round(amount * 100) / 100,
        });
      }
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    return { balances, settlements };
  };

  const { balances, settlements } = useMemo(() => calculateSettlements(), [expenses, participants]);

  const getParticipantName = (id) => {
    const p = participants.find(p => p.id === id);
    return p ? p.name : 'Unknown';
  };

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : filterCategory === 'group' 
      ? expenses.filter(e => e.isGroupExpense)
      : expenses.filter(e => e.category === filterCategory);

  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  const groupedExpenses = sortedExpenses.reduce((groups, expense) => {
    const date = expense.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {});

  const dateGroups = Object.keys(groupedExpenses);
  const uniqueDates = [...new Set(expenses.map(e => e.date))];
  const dailyAverage = uniqueDates.length > 0 ? Math.round(totalExpenses / uniqueDates.length) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>
              {isGroupTrip ? `Group trip • ${participants.length} people` : 'Track your spending'}
            </Text>
          </View>
          <Pressable 
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonIcon}>+</Text>
          </Pressable>
        </View>

        {/* Tabs for Group Trip */}
        {isGroupTrip && (
          <View style={styles.tabsContainer}>
            <Pressable 
              style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
              onPress={() => setActiveTab('expenses')}
            >
              <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>💳 Expenses</Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'settlements' && styles.tabActive]}
              onPress={() => setActiveTab('settlements')}
            >
              <Text style={[styles.tabText, activeTab === 'settlements' && styles.tabTextActive]}>⚖️ Settlements</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>

      {activeTab === 'expenses' ? (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Overview Card */}
          <Animated.View style={[styles.overviewCard, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.overviewGlow} />
            <View style={styles.overviewMain}>
              <View style={styles.overviewLeft}>
                <Text style={styles.overviewLabel}>Total Spent</Text>
                <Text style={styles.overviewAmount}>{formatCurrency(totalExpenses)}</Text>
                <Text style={styles.overviewBudgetText}>of {formatCurrency(budget.total)} budget</Text>
              </View>
              <View style={styles.circularProgress}>
                <View style={styles.circularInner}>
                  <Text style={styles.circularPercent}>{Math.min(spentPercentage, 100).toFixed(0)}%</Text>
                  <Text style={styles.circularLabel}>used</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { 
                width: `${Math.min(spentPercentage, 100)}%`,
                backgroundColor: spentPercentage > 90 ? '#EF4444' : spentPercentage > 70 ? '#F59E0B' : colors.primary
              }]} />
            </View>

            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatEmoji}>💵</Text>
                <Text style={styles.quickStatValue}>{formatCurrency(remainingBudget)}</Text>
                <Text style={styles.quickStatLabel}>Remaining</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatEmoji}>📊</Text>
                <Text style={styles.quickStatValue}>{formatCurrency(dailyAverage)}</Text>
                <Text style={styles.quickStatLabel}>Daily Avg</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatEmoji}>🧾</Text>
                <Text style={styles.quickStatValue}>{expenses.length}</Text>
                <Text style={styles.quickStatLabel}>Items</Text>
              </View>
            </View>
          </Animated.View>

          {/* Category Breakdown */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>📊 By Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const spent = expensesByCategory[cat.key] || 0;
                const percentage = totalExpenses > 0 ? ((spent / totalExpenses) * 100).toFixed(0) : 0;
                return (
                  <Pressable 
                    key={cat.key} 
                    style={[styles.categoryCard, filterCategory === cat.key && styles.categoryCardActive]}
                    onPress={() => setFilterCategory(filterCategory === cat.key ? 'all' : cat.key)}
                  >
                    <View style={[styles.categoryIconBg, { backgroundColor: cat.color + '20' }]}>
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    </View>
                    <Text style={styles.categoryName}>{cat.label}</Text>
                    <Text style={[styles.categoryAmount, { color: cat.color }]}>{formatCurrency(spent)}</Text>
                    <Text style={styles.categoryPercent}>{percentage}%</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterSection} contentContainerStyle={styles.filterScroll}>
            <Pressable 
              style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
              onPress={() => setFilterCategory('all')}
            >
              <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>
                All ({expenses.length})
              </Text>
            </Pressable>
            {isGroupTrip && (
              <Pressable 
                style={[styles.filterChip, filterCategory === 'group' && styles.filterChipActive]}
                onPress={() => setFilterCategory('group')}
              >
                <Text style={[styles.filterChipText, filterCategory === 'group' && styles.filterChipTextActive]}>
                  👥 Split ({expenses.filter(e => e.isGroupExpense).length})
                </Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Expenses List */}
          <View style={styles.expensesSection}>
            <Text style={styles.sectionTitle}>💳 Transactions</Text>

            {filteredExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💸</Text>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Pressable style={styles.emptyButton} onPress={() => setModalVisible(true)}>
                  <Text style={styles.emptyButtonText}>+ Add Expense</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.expensesList}>
                {dateGroups.map((date) => (
                  <View key={date} style={styles.dateGroup}>
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateText}>{date}</Text>
                      <Text style={styles.dateTotalText}>
                        {formatCurrency(groupedExpenses[date].reduce((sum, e) => sum + e.amount, 0))}
                      </Text>
                    </View>

                    {groupedExpenses[date].map((expense) => {
                      const category = getCategoryInfo(expense.category);
                      return (
                        <View key={expense.id} style={[styles.expenseCard, { borderLeftColor: category.color }]}>
                          <View style={[styles.expenseIconBg, { backgroundColor: category.color + '20' }]}>
                            <Text style={styles.expenseEmoji}>{category.emoji}</Text>
                          </View>
                          <View style={styles.expenseInfo}>
                            <Text style={styles.expenseTitle}>{expense.title}</Text>
                            <View style={styles.expenseMeta}>
                              <Text style={[styles.expenseCategoryText, { color: category.color }]}>{category.label}</Text>
                              {expense.isGroupExpense && (
                                <View style={styles.splitBadge}>
                                  <Text style={styles.splitBadgeText}>👥 Split</Text>
                                </View>
                              )}
                            </View>
                            {expense.isGroupExpense && expense.paidBy && (
                              <Text style={styles.paidByText}>Paid by {getParticipantName(expense.paidBy)}</Text>
                            )}
                          </View>
                          <View style={styles.expenseRight}>
                            <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
                            <Pressable style={styles.deleteButton} onPress={() => deleteExpense(expense.id)}>
                              <Text style={styles.deleteButtonText}>🗑️</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        // Settlements Tab
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Balance Summary */}
          <View style={styles.settlementCard}>
            <Text style={styles.settlementTitle}>⚖️ Balance Summary</Text>
            <View style={styles.balancesList}>
              {participants.map((p) => {
                const balance = balances[p.id] || 0;
                const isPositive = balance > 0.01;
                const isNegative = balance < -0.01;
                return (
                  <View key={p.id} style={styles.balanceItem}>
                    <View style={styles.balanceAvatar}>
                      <Text style={styles.balanceAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.balanceInfo}>
                      <Text style={styles.balanceName}>{p.name}</Text>
                      <Text style={styles.balanceRole}>{p.isOrganizer ? 'Organizer' : p.relation}</Text>
                    </View>
                    <View style={styles.balanceAmount}>
                      <Text style={[
                        styles.balanceValue,
                        isPositive && styles.balancePositive,
                        isNegative && styles.balanceNegative,
                      ]}>
                        {isPositive ? '+' : ''}{formatCurrency(Math.abs(balance))}
                      </Text>
                      <Text style={styles.balanceLabel}>
                        {isPositive ? 'gets back' : isNegative ? 'owes' : 'settled'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Settlements */}
          <View style={styles.settlementsSection}>
            <Text style={styles.sectionTitle}>💡 Settle Up</Text>
            {settlements.length === 0 ? (
              <View style={styles.noSettlements}>
                <Text style={styles.noSettlementsEmoji}>🎉</Text>
                <Text style={styles.noSettlementsText}>Everyone is settled!</Text>
              </View>
            ) : (
              <View style={styles.settlementsList}>
                {settlements.map((s, index) => (
                  <View key={index} style={styles.settlementItem}>
                    <View style={styles.settlementFrom}>
                      <View style={styles.settlementAvatar}>
                        <Text style={styles.settlementAvatarText}>{getParticipantName(s.from).charAt(0)}</Text>
                      </View>
                      <Text style={styles.settlementName}>{getParticipantName(s.from)}</Text>
                    </View>
                    <View style={styles.settlementArrow}>
                      <Text style={styles.settlementArrowText}>→</Text>
                      <Text style={styles.settlementAmount}>{formatCurrency(s.amount)}</Text>
                    </View>
                    <View style={styles.settlementTo}>
                      <View style={[styles.settlementAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.settlementAvatarText, { color: colors.bg }]}>{getParticipantName(s.to).charAt(0)}</Text>
                      </View>
                      <Text style={styles.settlementName}>{getParticipantName(s.to)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Add Expense</Text>
      </Pressable>

      {/* Add Expense Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Expense</Text>
                <Text style={styles.modalSubtitle}>
                  {isGroupTrip ? 'Split with your group' : 'Track your spending'}
                </Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountCurrency}>{currency.symbol}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={newExpense.amount}
                    onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                  />
                </View>
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
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
                <Text style={styles.inputLabel}>Category</Text>
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
                      <Text style={[styles.categorySelectText, newExpense.category === cat.key && { color: '#FFF' }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Group Split Options */}
              {isGroupTrip && (
                <>
                  {/* Paid By */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>💳 Paid by</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paidByScroll}>
                      {participants.map((p) => (
                        <Pressable
                          key={p.id}
                          style={[styles.paidByItem, newExpense.paidBy === p.id && styles.paidByItemActive]}
                          onPress={() => setNewExpense({...newExpense, paidBy: p.id})}
                        >
                          <View style={[styles.paidByAvatar, newExpense.paidBy === p.id && { backgroundColor: colors.primary }]}>
                            <Text style={[styles.paidByAvatarText, newExpense.paidBy === p.id && { color: colors.bg }]}>
                              {p.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={[styles.paidByName, newExpense.paidBy === p.id && styles.paidByNameActive]}>
                            {p.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Split Type */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>⚖️ Split Type</Text>
                    <View style={styles.splitTypeGrid}>
                      {SPLIT_TYPES.map((type) => (
                        <Pressable
                          key={type.key}
                          style={[styles.splitTypeItem, newExpense.splitType === type.key && styles.splitTypeItemActive]}
                          onPress={() => setNewExpense({...newExpense, splitType: type.key})}
                        >
                          <Text style={styles.splitTypeEmoji}>{type.emoji}</Text>
                          <Text style={[styles.splitTypeLabel, newExpense.splitType === type.key && styles.splitTypeLabelActive]}>
                            {type.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Split With */}
                  {newExpense.splitType !== 'full' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>👥 Split with ({newExpense.splitWith.length} selected)</Text>
                      <View style={styles.splitWithGrid}>
                        {participants.map((p) => {
                          const isSelected = newExpense.splitWith.includes(p.id);
                          return (
                            <Pressable
                              key={p.id}
                              style={[styles.splitWithItem, isSelected && styles.splitWithItemActive]}
                              onPress={() => toggleParticipant(p.id)}
                            >
                              <View style={[styles.splitWithCheck, isSelected && styles.splitWithCheckActive]}>
                                {isSelected && <Text style={styles.splitWithCheckText}>✓</Text>}
                              </View>
                              <Text style={[styles.splitWithName, isSelected && styles.splitWithNameActive]}>{p.name}</Text>
                              {newExpense.splitType === 'equal' && isSelected && newExpense.amount && (
                                <Text style={styles.splitWithAmount}>{formatCurrency(getEqualSplitAmount())}</Text>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Custom Amounts */}
                      {newExpense.splitType === 'custom' && newExpense.splitWith.length > 0 && (
                        <View style={styles.customSplitSection}>
                          <View style={styles.customSplitHeader}>
                            <Text style={styles.customSplitTitle}>Custom amounts</Text>
                            <Text style={[
                              styles.customSplitTotal,
                              Math.abs(getCustomSplitTotal() - parseFloat(newExpense.amount || 0)) > 0.01 && styles.customSplitTotalError
                            ]}>
                              Total: {formatCurrency(getCustomSplitTotal())} / {formatCurrency(parseFloat(newExpense.amount || 0))}
                            </Text>
                          </View>
                          {participants.filter(p => newExpense.splitWith.includes(p.id)).map((p) => (
                            <View key={p.id} style={styles.customSplitRow}>
                              <Text style={styles.customSplitName}>{p.name}</Text>
                              <View style={styles.customSplitInputWrapper}>
                                <Text style={styles.customSplitCurrency}>{currency.symbol}</Text>
                                <TextInput
                                  style={styles.customSplitInput}
                                  placeholder="0.00"
                                  placeholderTextColor={colors.textMuted}
                                  keyboardType="decimal-pad"
                                  value={newExpense.customSplits[p.id] || ''}
                                  onChangeText={(text) => setNewExpense({
                                    ...newExpense,
                                    customSplits: { ...newExpense.customSplits, [p.id]: text }
                                  })}
                                />
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Percentage Splits */}
                      {newExpense.splitType === 'percentage' && newExpense.splitWith.length > 0 && (
                        <View style={styles.customSplitSection}>
                          <View style={styles.customSplitHeader}>
                            <Text style={styles.customSplitTitle}>Percentages</Text>
                            <Text style={[
                              styles.customSplitTotal,
                              Math.abs(getPercentageTotal() - 100) > 0.01 && styles.customSplitTotalError
                            ]}>
                              Total: {getPercentageTotal()}% / 100%
                            </Text>
                          </View>
                          {participants.filter(p => newExpense.splitWith.includes(p.id)).map((p) => (
                            <View key={p.id} style={styles.customSplitRow}>
                              <Text style={styles.customSplitName}>{p.name}</Text>
                              <View style={styles.customSplitInputWrapper}>
                                <TextInput
                                  style={styles.customSplitInput}
                                  placeholder="0"
                                  placeholderTextColor={colors.textMuted}
                                  keyboardType="decimal-pad"
                                  value={newExpense.percentageSplits[p.id] || ''}
                                  onChangeText={(text) => setNewExpense({
                                    ...newExpense,
                                    percentageSplits: { ...newExpense.percentageSplits, [p.id]: text }
                                  })}
                                />
                                <Text style={styles.customSplitPercent}>%</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Any additional details..."
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.notes}
                  onChangeText={(text) => setNewExpense({...newExpense, notes: text})}
                  multiline
                />
              </View>

              {/* Submit */}
              <Pressable
                style={[styles.submitButton, (!newExpense.title || !newExpense.amount) && styles.submitButtonDisabled]}
                onPress={handleAddExpense}
                disabled={!newExpense.title || !newExpense.amount}
              >
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </Pressable>

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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addButtonIcon: { color: colors.bg, fontSize: 24, fontWeight: 'bold' },

  // Tabs
  tabsContainer: { flexDirection: 'row', marginTop: 16, backgroundColor: colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.primaryBorder },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: colors.bg, fontWeight: 'bold' },

  // Overview Card
  overviewCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder, overflow: 'hidden' },
  overviewGlow: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: colors.primary, opacity: 0.08, borderRadius: 60 },
  overviewMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  overviewLeft: {},
  overviewLabel: { color: colors.textMuted, fontSize: 12 },
  overviewAmount: { color: colors.text, fontSize: 32, fontWeight: 'bold', marginVertical: 4 },
  overviewBudgetText: { color: colors.textMuted, fontSize: 13 },
  circularProgress: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  circularInner: { alignItems: 'center' },
  circularPercent: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  circularLabel: { color: colors.textMuted, fontSize: 9 },
  progressBar: { height: 6, backgroundColor: colors.cardLight, borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 3 },
  quickStats: { flexDirection: 'row', backgroundColor: colors.cardLight, borderRadius: 12, padding: 12 },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatEmoji: { fontSize: 16, marginBottom: 4 },
  quickStatValue: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  quickStatLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  quickStatDivider: { width: 1, backgroundColor: colors.primaryBorder },

  // Category Section
  categorySection: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: { width: (width - 56) / 3, backgroundColor: colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  categoryCardActive: { borderColor: colors.primary, borderWidth: 2 },
  categoryIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  categoryEmoji: { fontSize: 18 },
  categoryName: { color: colors.textMuted, fontSize: 9, textAlign: 'center' },
  categoryAmount: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  categoryPercent: { color: colors.textMuted, fontSize: 9, marginTop: 2 },

  // Filter
  filterSection: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primaryBorder },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  filterChipTextActive: { color: colors.bg },

  // Expenses Section
  expensesSection: { paddingHorizontal: 20 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: colors.textMuted, fontSize: 16 },
  emptyButton: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: colors.bg, fontSize: 14, fontWeight: 'bold' },

  // Expenses List
  expensesList: { gap: 16 },
  dateGroup: {},
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  dateTotalText: { color: colors.textMuted, fontSize: 12 },
  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.primaryBorder, borderLeftWidth: 3 },
  expenseIconBg: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expenseEmoji: { fontSize: 18 },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  expenseCategoryText: { fontSize: 11, fontWeight: '500' },
  splitBadge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  splitBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
  paidByText: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { color: '#EF4444', fontSize: 15, fontWeight: 'bold' },
  deleteButton: { marginTop: 4, padding: 4 },
  deleteButtonText: { fontSize: 14 },

  // Settlement Card
  settlementCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  settlementTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  balancesList: { gap: 10 },
  balanceItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 12, padding: 12 },
  balanceAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  balanceAvatarText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  balanceInfo: { flex: 1, marginLeft: 12 },
  balanceName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  balanceRole: { color: colors.textMuted, fontSize: 11 },
  balanceAmount: { alignItems: 'flex-end' },
  balanceValue: { fontSize: 15, fontWeight: 'bold', color: colors.textMuted },
  balancePositive: { color: '#10B981' },
  balanceNegative: { color: '#EF4444' },
  balanceLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },

  // Settlements Section
  settlementsSection: { paddingHorizontal: 20 },
  noSettlements: { backgroundColor: colors.card, borderRadius: 16, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  noSettlementsEmoji: { fontSize: 40, marginBottom: 12 },
  noSettlementsText: { color: colors.text, fontSize: 16 },
  settlementsList: { gap: 10 },
  settlementItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.primaryBorder },
  settlementFrom: { flex: 1, alignItems: 'center' },
  settlementTo: { flex: 1, alignItems: 'center' },
  settlementAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  settlementAvatarText: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  settlementName: { color: colors.text, fontSize: 11, fontWeight: '500' },
  settlementArrow: { alignItems: 'center', paddingHorizontal: 8 },
  settlementArrowText: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  settlementAmount: { color: colors.primary, fontSize: 13, fontWeight: 'bold', marginTop: 2 },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16 },
  fabIcon: { color: colors.bg, fontSize: 20, fontWeight: 'bold', marginRight: 8 },
  fabText: { color: colors.bg, fontSize: 15, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 20, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: colors.textMuted, fontSize: 22 },

  // Amount Section
  amountSection: { backgroundColor: colors.cardLight, borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
  amountLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 10 },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center' },
  amountCurrency: { color: colors.text, fontSize: 32, fontWeight: 'bold', marginRight: 4 },
  amountInput: { color: colors.text, fontSize: 40, fontWeight: 'bold', minWidth: 80, textAlign: 'center' },

  // Input Groups
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: colors.cardLight, color: colors.text, padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: colors.primaryBorder },
  notesInput: { height: 80, textAlignVertical: 'top' },

  // Category Select
  categorySelectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categorySelectItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  categorySelectEmoji: { fontSize: 16, marginRight: 6 },
  categorySelectText: { color: colors.text, fontSize: 12, fontWeight: '500' },

  // Paid By
  paidByScroll: { gap: 10 },
  paidByItem: { alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  paidByItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  paidByAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  paidByAvatarText: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  paidByName: { color: colors.text, fontSize: 11, fontWeight: '500' },
  paidByNameActive: { color: colors.primary },

  // Split Type
  splitTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  splitTypeItem: { flex: 1, minWidth: '45%', alignItems: 'center', backgroundColor: colors.cardLight, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  splitTypeItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  splitTypeEmoji: { fontSize: 20, marginBottom: 4 },
  splitTypeLabel: { color: colors.text, fontSize: 11, fontWeight: '600' },
  splitTypeLabelActive: { color: colors.primary },

  // Split With
  splitWithGrid: { gap: 8 },
  splitWithItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  splitWithItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  splitWithCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  splitWithCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  splitWithCheckText: { color: colors.bg, fontSize: 12, fontWeight: 'bold' },
  splitWithName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '500' },
  splitWithNameActive: { color: colors.primary },
  splitWithAmount: { color: colors.primary, fontSize: 13, fontWeight: 'bold' },

  // Custom Split
  customSplitSection: { marginTop: 12, backgroundColor: colors.cardLight, borderRadius: 12, padding: 12 },
  customSplitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  customSplitTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  customSplitTotal: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  customSplitTotalError: { color: '#EF4444' },
  customSplitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  customSplitName: { color: colors.text, fontSize: 13, fontWeight: '500', flex: 1 },
  customSplitInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 10 },
  customSplitCurrency: { color: colors.textMuted, fontSize: 14, marginRight: 4 },
  customSplitInput: { color: colors.text, fontSize: 15, fontWeight: '600', minWidth: 60, textAlign: 'right', paddingVertical: 6 },
  customSplitPercent: { color: colors.textMuted, fontSize: 14, marginLeft: 4 },

  // Submit
  submitButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
});
