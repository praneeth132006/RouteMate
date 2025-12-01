import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, ScrollView, TextInput, TouchableOpacity, 
  Modal, StyleSheet, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const DEFAULT_CATEGORIES = [
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
    formatCurrency, 
    currency = { symbol: '₹', code: 'INR' },
    customCategories,
    tripInfo = {},
    setTripInfo, // Add this to allow adding test participants
  } = useTravelContext();
  const { colors } = useTheme();
  
  const CATEGORIES = customCategories?.length > 0 ? customCategories : DEFAULT_CATEGORIES;
  
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('transactions');
  const [showDebug, setShowDebug] = useState(false); // Debug toggle

  // Determine if multi-user trip
  const isMultiUser = useMemo(() => {
    const hasParticipants = tripInfo?.participants?.length > 0;
    const isNotSolo = tripInfo?.tripType && tripInfo.tripType !== 'solo';
    return hasParticipants || isNotSolo;
  }, [tripInfo?.participants, tripInfo?.tripType]);

  // Get all travelers
  const travelers = useMemo(() => {
    const mainUser = { id: 'main_user', name: 'You', avatar: '👤' };
    const participants = tripInfo?.participants || [];
    return [mainUser, ...participants];
  }, [tripInfo?.participants]);

  // Function to add test participants for debugging
  const addTestParticipants = () => {
    if (setTripInfo) {
      setTripInfo(prev => ({
        ...prev,
        tripType: 'friends',
        participants: [
          { id: 'user_1', name: 'John', avatar: '👨' },
          { id: 'user_2', name: 'Sarah', avatar: '👩' },
          { id: 'user_3', name: 'Mike', avatar: '🧑' },
        ]
      }));
    }
  };

  // Initial expense state
  const getInitialExpenseState = () => ({
    title: '', 
    amount: '', 
    category: 'food',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 
    notes: '',
    paidBy: 'main_user',
    splitType: 'equal',
    beneficiaries: travelers.map(t => t.id),
    splitAmounts: {},
  });

  const [newExpense, setNewExpense] = useState(getInitialExpenseState());

  // Update beneficiaries when travelers change
  useEffect(() => {
    if (travelers.length > 0) {
      setNewExpense(prev => ({
        ...prev,
        beneficiaries: travelers.map(t => t.id),
      }));
    }
  }, [travelers]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Reset expense form
  const resetNewExpense = () => {
    setNewExpense(getInitialExpenseState());
  };

  // Add expense handler
  const handleAddExpense = () => {
    if (newExpense.title.trim() && newExpense.amount) {
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount) || 0,
        timestamp: Date.now(),
      };
      addExpense(expenseData);
      resetNewExpense();
      setModalVisible(false);
    }
  };

  // Delete expense handler
  const handleDeleteExpense = (id, title) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) }
      ]
    );
  };

  // Toggle beneficiary selection
  const toggleBeneficiary = (userId) => {
    const current = newExpense.beneficiaries || [];
    if (current.includes(userId)) {
      if (current.length > 1) {
        setNewExpense({ ...newExpense, beneficiaries: current.filter(id => id !== userId) });
      }
    } else {
      setNewExpense({ ...newExpense, beneficiaries: [...current, userId] });
    }
  };

  // Select all beneficiaries
  const selectAllBeneficiaries = () => {
    setNewExpense({ ...newExpense, beneficiaries: travelers.map(t => t.id) });
  };

  // Update custom split amount
  const updateCustomSplit = (userId, amount) => {
    setNewExpense({
      ...newExpense,
      splitAmounts: { ...newExpense.splitAmounts, [userId]: amount }
    });
  };

  // Helper functions
  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
  const getTravelerName = (id) => travelers.find(t => t.id === id)?.name || 'Unknown';
  const getTravelerAvatar = (id) => travelers.find(t => t.id === id)?.avatar || '👤';

  // Calculations
  const totalExpenses = getTotalExpenses ? getTotalExpenses() : 0;
  const remainingBudget = getRemainingBudget ? getRemainingBudget() : (budget.total - totalExpenses);
  const budgetTotal = budget.total || 0;
  const spentPercentage = budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : 0;

  // Calculate balances for multi-user
  const balances = useMemo(() => {
    if (!isMultiUser || travelers.length < 2) return {};
    
    const result = {};
    travelers.forEach(t => {
      result[t.id] = { paid: 0, owes: 0, balance: 0, name: t.name };
    });

    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount) || 0;
      const paidBy = expense.paidBy || 'main_user';
      const beneficiaries = expense.beneficiaries?.length > 0 ? expense.beneficiaries : travelers.map(t => t.id);

      if (result[paidBy]) {
        result[paidBy].paid += amount;
      }

      if (expense.splitType === 'equal') {
        const splitAmount = amount / beneficiaries.length;
        beneficiaries.forEach(id => {
          if (result[id]) result[id].owes += splitAmount;
        });
      } else if (expense.splitType === 'custom' && expense.splitAmounts) {
        Object.entries(expense.splitAmounts).forEach(([id, splitAmount]) => {
          if (result[id]) result[id].owes += parseFloat(splitAmount) || 0;
        });
      } else if (expense.splitType === 'full' && beneficiaries[0]) {
        if (result[beneficiaries[0]]) result[beneficiaries[0]].owes += amount;
      }
    });

    Object.keys(result).forEach(id => {
      result[id].balance = result[id].paid - result[id].owes;
    });

    return result;
  }, [expenses, travelers, isMultiUser]);

  // Calculate settlements
  const settlements = useMemo(() => {
    if (!isMultiUser || Object.keys(balances).length === 0) return [];

    const result = [];
    const debtors = Object.entries(balances)
      .filter(([_, b]) => b.balance < -0.01)
      .map(([id, b]) => ({ id, amount: Math.abs(b.balance), name: b.name }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(balances)
      .filter(([_, b]) => b.balance > 0.01)
      .map(([id, b]) => ({ id, amount: b.balance, name: b.name }))
      .sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.01) {
        result.push({
          from: debtor.id,
          fromName: debtor.name,
          to: creditor.id,
          toName: creditor.name,
          amount: settleAmount,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return result;
  }, [balances, isMultiUser]);

  // Filter and group expenses
  const filteredExpenses = filterCategory === 'all' ? expenses : expenses.filter(e => e.category === filterCategory);
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

  // Format currency safely
  const safeFormatCurrency = (amount) => {
    if (formatCurrency) return formatCurrency(amount);
    const num = parseFloat(amount) || 0;
    return `${currency.symbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Split preview calculation
  const splitPreview = useMemo(() => {
    const amount = parseFloat(newExpense.amount) || 0;
    if (amount === 0 || !newExpense.beneficiaries?.length) return null;
    if (newExpense.splitType === 'equal') {
      return {
        perPerson: amount / newExpense.beneficiaries.length,
        selectedCount: newExpense.beneficiaries.length,
      };
    }
    return null;
  }, [newExpense.amount, newExpense.beneficiaries, newExpense.splitType]);

  // Render Balances Tab
  const renderBalancesTab = () => {
    const totalPaid = Object.values(balances).reduce((sum, b) => sum + b.paid, 0);
    
    return (
      <View style={styles.balancesTabContent}>
        {/* Summary Header Card */}
        <View style={styles.balanceSummaryCard}>
          <View style={styles.balanceSummaryHeader}>
            <Text style={styles.balanceSummaryEmoji}>💰</Text>
            <View>
              <Text style={styles.balanceSummaryTitle}>Group Expenses</Text>
              <Text style={styles.balanceSummarySubtitle}>{travelers.length} travelers</Text>
            </View>
          </View>
          <View style={styles.balanceSummaryStats}>
            <View style={styles.balanceSummaryStat}>
              <Text style={styles.balanceSummaryStatValue}>{safeFormatCurrency(totalPaid)}</Text>
              <Text style={styles.balanceSummaryStatLabel}>Total Spent</Text>
            </View>
            <View style={styles.balanceSummaryDivider} />
            <View style={styles.balanceSummaryStat}>
              <Text style={styles.balanceSummaryStatValue}>{safeFormatCurrency(totalPaid / travelers.length)}</Text>
              <Text style={styles.balanceSummaryStatLabel}>Per Person</Text>
            </View>
            <View style={styles.balanceSummaryDivider} />
            <View style={styles.balanceSummaryStat}>
              <Text style={styles.balanceSummaryStatValue}>{expenses.length}</Text>
              <Text style={styles.balanceSummaryStatLabel}>Expenses</Text>
            </View>
          </View>
        </View>

        {/* Individual Balances */}
        <View style={styles.balanceSectionHeader}>
          <Text style={styles.balanceSectionTitle}>Individual Balances</Text>
        </View>
        
        <View style={styles.balanceCardsContainer}>
          {Object.entries(balances).map(([id, data]) => {
            const isPositive = data.balance >= 0;
            const percentage = totalPaid > 0 ? (data.paid / totalPaid) * 100 : 0;
            
            return (
              <View key={id} style={styles.balanceUserCard}>
                <View style={styles.balanceUserHeader}>
                  <View style={styles.balanceUserInfo}>
                    <View style={styles.balanceUserAvatarContainer}>
                      <Text style={styles.balanceUserAvatar}>{getTravelerAvatar(id)}</Text>
                    </View>
                    <View>
                      <Text style={styles.balanceUserName}>{data.name}</Text>
                      <Text style={styles.balanceUserContribution}>
                        {percentage.toFixed(0)}% of total
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.balanceStatusBadge, { backgroundColor: isPositive ? '#10B98115' : '#EF444415' }]}>
                    <Text style={[styles.balanceStatusText, { color: isPositive ? '#10B981' : '#EF4444' }]}>
                      {isPositive ? 'Gets back' : 'Owes'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.balanceUserStats}>
                  <View style={styles.balanceUserStatItem}>
                    <Text style={styles.balanceUserStatLabel}>Paid</Text>
                    <Text style={styles.balanceUserStatValue}>{safeFormatCurrency(data.paid)}</Text>
                  </View>
                  <View style={styles.balanceUserStatItem}>
                    <Text style={styles.balanceUserStatLabel}>Share</Text>
                    <Text style={styles.balanceUserStatValue}>{safeFormatCurrency(data.owes)}</Text>
                  </View>
                  <View style={styles.balanceUserStatItem}>
                    <Text style={styles.balanceUserStatLabel}>Balance</Text>
                    <Text style={[styles.balanceUserStatValueHighlight, { color: isPositive ? '#10B981' : '#EF4444' }]}>
                      {isPositive ? '+' : ''}{safeFormatCurrency(data.balance)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.balanceProgressContainer}>
                  <View style={styles.balanceProgressTrack}>
                    <View style={[styles.balanceProgressFill, { width: `${Math.min(percentage, 100)}%` }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Settlements Section */}
        <View style={styles.balanceSectionHeader}>
          <Text style={styles.balanceSectionTitle}>Settlements</Text>
          {settlements.length > 0 && (
            <View style={styles.settlementCountBadge}>
              <Text style={styles.settlementCountText}>{settlements.length} pending</Text>
            </View>
          )}
        </View>

        {settlements.length === 0 ? (
          <View style={styles.settledContainer}>
            <View style={styles.settledIconContainer}>
              <Text style={styles.settledIcon}>✅</Text>
            </View>
            <Text style={styles.settledTitle}>All Settled Up!</Text>
            <Text style={styles.settledDescription}>
              Everyone is square. No payments needed.
            </Text>
          </View>
        ) : (
          <View style={styles.settlementsContainer}>
            {settlements.map((s, idx) => (
              <View key={idx} style={styles.settlementRow}>
                <View style={styles.settlementFromSection}>
                  <View style={styles.settlementAvatarCircle}>
                    <Text style={styles.settlementAvatarText}>{getTravelerAvatar(s.from)}</Text>
                  </View>
                  <Text style={styles.settlementFromName}>{s.fromName}</Text>
                </View>
                
                <View style={styles.settlementMiddle}>
                  <View style={styles.settlementArrowLine}>
                    <View style={styles.settlementDot} />
                    <View style={styles.settlementLine} />
                    <View style={styles.settlementArrowHead} />
                  </View>
                  <View style={styles.settlementAmountBubble}>
                    <Text style={styles.settlementAmountText}>{safeFormatCurrency(s.amount)}</Text>
                  </View>
                </View>
                
                <View style={styles.settlementToSection}>
                  <View style={[styles.settlementAvatarCircle, styles.settlementAvatarCircleTo]}>
                    <Text style={styles.settlementAvatarText}>{getTravelerAvatar(s.to)}</Text>
                  </View>
                  <Text style={styles.settlementToName}>{s.toName}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.balanceTipsCard}>
          <Text style={styles.balanceTipsTitle}>💡 Quick Tip</Text>
          <Text style={styles.balanceTipsText}>
            Tap on expenses to see who paid and how it was split among the group.
          </Text>
        </View>
      </View>
    );
  };

  // Render Transactions Tab
  const renderTransactionsTab = () => (
    <View>
      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScroll} 
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity 
          style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]} 
          onPress={() => setFilterCategory('all')}
        >
          <Text style={[styles.filterText, filterCategory === 'all' && styles.filterTextActive]}>
            All ({expenses.length})
          </Text>
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
              <Text style={[styles.filterText, filterCategory === cat.key && { color: '#FFF' }]}>
                {cat.emoji} {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Transactions List */}
      <View style={styles.transactionsSection}>
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>Start tracking your spending</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyBtnText}>+ Add Expense</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                        {isMultiUser && expense.paidBy && (
                          <View style={styles.expenseSplitInfo}>
                            <Text style={styles.expensePaidBy}>💳 {getTravelerName(expense.paidBy)}</Text>
                            <Text style={styles.expenseSplitType}>
                              {expense.splitType === 'equal' ? '⚖️ Equal' : 
                               expense.splitType === 'custom' ? '✏️ Custom' : '👤 No split'}
                            </Text>
                          </View>
                        )}
                        {expense.notes ? <Text style={styles.expenseNotes}>📝 {expense.notes}</Text> : null}
                      </View>
                      <View style={styles.expenseRight}>
                        <Text style={styles.expenseAmount}>-{safeFormatCurrency(expense.amount)}</Text>
                        <TouchableOpacity 
                          onPress={() => handleDeleteExpense(expense.id, expense.title)} 
                          style={styles.deleteBtn}
                        >
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💳 Expenses</Text>
          <Text style={styles.headerSubtitle}>
            {isMultiUser 
              ? `${tripInfo?.tripType || 'Group'} Trip • ${travelers.length} travelers` 
              : 'Track your spending'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Debug Button - Long press to add test participants */}
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.cardLight }]} 
            onLongPress={addTestParticipants}
            onPress={() => setShowDebug(!showDebug)}
          >
            <Text style={[styles.addBtnText, { color: colors.text }]}>🔧</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Debug Info Card */}
        {showDebug && (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>🔧 Debug Info</Text>
            <Text style={styles.debugText}>Trip Type: {tripInfo?.tripType || 'Not set'}</Text>
            <Text style={styles.debugText}>Participants: {tripInfo?.participants?.length || 0}</Text>
            <Text style={styles.debugText}>Is Multi-User: {isMultiUser ? 'YES ✅' : 'NO ❌'}</Text>
            <Text style={styles.debugText}>Travelers: {travelers.map(t => t.name).join(', ')}</Text>
            <TouchableOpacity 
              style={styles.debugBtn} 
              onPress={addTestParticipants}
            >
              <Text style={styles.debugBtnText}>+ Add Test Participants</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Budget Summary Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetTop}>
            <View style={styles.budgetMain}>
              <Text style={styles.budgetLabel}>Total Spent</Text>
              <Text style={styles.budgetAmount}>{safeFormatCurrency(totalExpenses)}</Text>
              <Text style={styles.budgetOf}>of {safeFormatCurrency(budgetTotal)} budget</Text>
            </View>
            <View style={[styles.percentCircle, { borderColor: spentPercentage > 90 ? '#EF4444' : spentPercentage > 70 ? '#F59E0B' : colors.primary }]}>
              <Text style={[styles.percentText, { color: spentPercentage > 90 ? '#EF4444' : spentPercentage > 70 ? '#F59E0B' : colors.primary }]}>
                {Math.min(spentPercentage, 100).toFixed(0)}%
              </Text>
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
              <Text style={[styles.statValue, { color: remainingBudget >= 0 ? '#10B981' : '#EF4444' }]}>
                {safeFormatCurrency(Math.abs(remainingBudget))}
              </Text>
              <Text style={styles.statLabel}>{remainingBudget >= 0 ? 'Remaining' : 'Over budget'}</Text>
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
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher - Only for multi-user trips */}
        {isMultiUser && travelers.length > 1 && (
          <View style={styles.tabSwitcher}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'transactions' && styles.tabBtnActive]} 
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={styles.tabIcon}>💳</Text>
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
                Transactions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'balances' && styles.tabBtnActive]} 
              onPress={() => setActiveTab('balances')}
            >
              <Text style={styles.tabIcon}>👥</Text>
              <Text style={[styles.tabText, activeTab === 'balances' && styles.tabTextActive]}>
                Balances
              </Text>
              {settlements.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{settlements.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Content */}
        {isMultiUser && activeTab === 'balances' ? renderBalancesTab() : renderTransactionsTab()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Add</Text>
      </TouchableOpacity>

      {/* Add Expense Modal - Redesigned */}
      <Modal 
        animationType="slide" 
        transparent 
        visible={modalVisible} 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconCircle}>
                  <Text style={styles.modalIconText}>💸</Text>
                </View>
                <View>
                  <Text style={styles.modalTitle}>Add Expense</Text>
                  <Text style={styles.modalSubtitle}>
                    {isMultiUser ? `Split with ${travelers.length} travelers` : 'Track your spending'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => { setModalVisible(false); resetNewExpense(); }} 
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Amount Section - Hero Style */}
              <View style={styles.amountSection}>
                <Text style={styles.amountSectionLabel}>How much?</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountCurrency}>{currency.symbol}</Text>
                  <TextInput
                    style={styles.amountInputField}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={newExpense.amount}
                    onChangeText={(t) => setNewExpense({...newExpense, amount: t.replace(/[^0-9.]/g, '')})}
                    autoFocus={false}
                  />
                </View>
                {isMultiUser && splitPreview && (
                  <View style={styles.amountSplitBadge}>
                    <Text style={styles.amountSplitText}>
                      ⚖️ {safeFormatCurrency(splitPreview.perPerson)} × {splitPreview.selectedCount} people
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Info Cards */}
              <View style={styles.quickInfoRow}>
                <View style={styles.quickInfoCard}>
                  <Text style={styles.quickInfoEmoji}>📅</Text>
                  <Text style={styles.quickInfoValue}>{newExpense.date}</Text>
                  <Text style={styles.quickInfoLabel}>Date</Text>
                </View>
                <View style={styles.quickInfoCard}>
                  <Text style={styles.quickInfoEmoji}>{getCategoryInfo(newExpense.category).emoji}</Text>
                  <Text style={styles.quickInfoValue}>{getCategoryInfo(newExpense.category).label}</Text>
                  <Text style={styles.quickInfoLabel}>Category</Text>
                </View>
                {isMultiUser && (
                  <View style={styles.quickInfoCard}>
                    <Text style={styles.quickInfoEmoji}>{getTravelerAvatar(newExpense.paidBy)}</Text>
                    <Text style={styles.quickInfoValue}>{getTravelerName(newExpense.paidBy)}</Text>
                    <Text style={styles.quickInfoLabel}>Paid by</Text>
                  </View>
                )}
              </View>

              {/* Description Input */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Text style={styles.formSectionIcon}>📝</Text>
                  <Text style={styles.formSectionTitle}>Description</Text>
                </View>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="What was this expense for?"
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.title}
                  onChangeText={(t) => setNewExpense({...newExpense, title: t})}
                />
              </View>

              {/* Category Selection */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Text style={styles.formSectionIcon}>🏷️</Text>
                  <Text style={styles.formSectionTitle}>Category</Text>
                </View>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = newExpense.category === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.categoryCard,
                          isSelected && { backgroundColor: cat.color, borderColor: cat.color }
                        ]}
                        onPress={() => setNewExpense({...newExpense, category: cat.key})}
                      >
                        <Text style={styles.categoryCardEmoji}>{cat.emoji}</Text>
                        <Text style={[styles.categoryCardLabel, isSelected && { color: '#FFF' }]}>
                          {cat.label}
                        </Text>
                        {isSelected && (
                          <View style={styles.categoryCheckmark}>
                            <Text style={styles.categoryCheckmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Split Options - Only for multi-user trips */}
              {isMultiUser && travelers.length > 1 && (
                <View style={styles.splitOptionsSection}>
                  <View style={styles.splitOptionsHeader}>
                    <View style={styles.splitOptionsHeaderLeft}>
                      <Text style={styles.splitOptionsIcon}>👥</Text>
                      <View>
                        <Text style={styles.splitOptionsTitle}>Split Options</Text>
                        <Text style={styles.splitOptionsSubtitle}>{travelers.length} people in this trip</Text>
                      </View>
                    </View>
                  </View>

                  {/* Paid By Selection */}
                  <View style={styles.splitSubSection}>
                    <Text style={styles.splitSubLabel}>Who paid?</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.paidByScroll}
                    >
                      {travelers.map((t) => {
                        const isSelected = newExpense.paidBy === t.id;
                        return (
                          <TouchableOpacity
                            key={t.id}
                            style={[styles.paidByCard, isSelected && styles.paidByCardActive]}
                            onPress={() => setNewExpense({...newExpense, paidBy: t.id})}
                          >
                            <View style={[styles.paidByAvatarCircle, isSelected && styles.paidByAvatarCircleActive]}>
                              <Text style={styles.paidByAvatarEmoji}>{t.avatar || '👤'}</Text>
                            </View>
                            <Text style={[styles.paidByCardName, isSelected && styles.paidByCardNameActive]}>
                              {t.name}
                            </Text>
                            {isSelected && (
                              <View style={styles.paidByCheckBadge}>
                                <Text style={styles.paidByCheckText}>✓</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Split Type Selection */}
                  <View style={styles.splitSubSection}>
                    <Text style={styles.splitSubLabel}>How to split?</Text>
                    <View style={styles.splitTypeCards}>
                      {[
                        { key: 'equal', icon: '⚖️', label: 'Equal', desc: 'Split evenly' },
                        { key: 'custom', icon: '✏️', label: 'Custom', desc: 'Set amounts' },
                        { key: 'full', icon: '👤', label: 'Single', desc: 'One pays all' },
                      ].map((type) => {
                        const isSelected = newExpense.splitType === type.key;
                        return (
                          <TouchableOpacity
                            key={type.key}
                            style={[styles.splitTypeCard, isSelected && styles.splitTypeCardActive]}
                            onPress={() => setNewExpense({...newExpense, splitType: type.key})}
                          >
                            <Text style={styles.splitTypeCardIcon}>{type.icon}</Text>
                            <Text style={[styles.splitTypeCardLabel, isSelected && styles.splitTypeCardLabelActive]}>
                              {type.label}
                            </Text>
                            <Text style={[styles.splitTypeCardDesc, isSelected && styles.splitTypeCardDescActive]}>
                              {type.desc}
                            </Text>
                            {isSelected && (
                              <View style={styles.splitTypeCheckCircle}>
                                <Text style={styles.splitTypeCheckText}>✓</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Beneficiaries Selection */}
                  {newExpense.splitType !== 'full' && (
                    <View style={styles.splitSubSection}>
                      <View style={styles.splitSubLabelRow}>
                        <Text style={styles.splitSubLabel}>Split among</Text>
                        <TouchableOpacity onPress={selectAllBeneficiaries} style={styles.selectAllChip}>
                          <Text style={styles.selectAllChipText}>Select All</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.beneficiariesCards}>
                        {travelers.map((t) => {
                          const isSelected = newExpense.beneficiaries?.includes(t.id);
                          const equalAmount = newExpense.splitType === 'equal' && newExpense.amount && isSelected
                            ? (parseFloat(newExpense.amount) / (newExpense.beneficiaries?.length || 1))
                            : 0;
                          
                          return (
                            <TouchableOpacity
                              key={t.id}
                              style={[styles.beneficiaryCard, isSelected && styles.beneficiaryCardActive]}
                              onPress={() => toggleBeneficiary(t.id)}
                            >
                              <View style={styles.beneficiaryCardLeft}>
                                <View style={[styles.beneficiaryCheckBox, isSelected && styles.beneficiaryCheckBoxActive]}>
                                  {isSelected && <Text style={styles.beneficiaryCheckIcon}>✓</Text>}
                                </View>
                                <Text style={styles.beneficiaryCardAvatar}>{t.avatar || '👤'}</Text>
                                <Text style={[styles.beneficiaryCardName, isSelected && styles.beneficiaryCardNameActive]}>
                                  {t.name}
                                </Text>
                              </View>
                              <View style={styles.beneficiaryCardRight}>
                                {newExpense.splitType === 'equal' && isSelected && equalAmount > 0 && (
                                  <View style={styles.beneficiaryAmountBadge}>
                                    <Text style={styles.beneficiaryAmountText}>{safeFormatCurrency(equalAmount)}</Text>
                                  </View>
                                )}
                                {newExpense.splitType === 'custom' && isSelected && (
                                  <View style={styles.customSplitInputBox}>
                                    <Text style={styles.customSplitCurrency}>{currency.symbol}</Text>
                                    <TextInput
                                      style={styles.customSplitInput}
                                      placeholder="0"
                                      placeholderTextColor={colors.textMuted}
                                      keyboardType="decimal-pad"
                                      value={newExpense.splitAmounts?.[t.id]?.toString() || ''}
                                      onChangeText={(val) => updateCustomSplit(t.id, val)}
                                    />
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Notes Section */}
              <View style={styles.formSection}>
                <View style={styles.formSectionHeader}>
                  <Text style={styles.formSectionIcon}>💬</Text>
                  <Text style={styles.formSectionTitle}>Notes</Text>
                  <Text style={styles.formSectionOptional}>(Optional)</Text>
                </View>
                <TextInput
                  style={styles.notesTextarea}
                  placeholder="Add any additional details..."
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.notes}
                  onChangeText={(t) => setNewExpense({...newExpense, notes: t})}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Summary Card */}
              {newExpense.amount && newExpense.title && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>📋 Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Amount</Text>
                    <Text style={styles.summaryValue}>{safeFormatCurrency(parseFloat(newExpense.amount) || 0)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Description</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{newExpense.title}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Category</Text>
                    <Text style={styles.summaryValue}>{getCategoryInfo(newExpense.category).emoji} {getCategoryInfo(newExpense.category).label}</Text>
                  </View>
                  {isMultiUser && (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Paid by</Text>
                        <Text style={styles.summaryValue}>{getTravelerAvatar(newExpense.paidBy)} {getTravelerName(newExpense.paidBy)}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Split</Text>
                        <Text style={styles.summaryValue}>
                          {newExpense.splitType === 'equal' ? `Equal (${newExpense.beneficiaries?.length || 0} people)` :
                           newExpense.splitType === 'custom' ? 'Custom amounts' : 'Single payer'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, (!newExpense.title.trim() || !newExpense.amount) && styles.submitButtonDisabled]}
                onPress={handleAddExpense}
                disabled={!newExpense.title.trim() || !newExpense.amount}
              >
                <Text style={styles.submitButtonIcon}>✓</Text>
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </TouchableOpacity>

              <View style={{ height: 50 }} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: colors.bg, fontSize: 14, fontWeight: 'bold' },
  budgetCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  budgetMain: {},
  budgetLabel: { color: colors.textMuted, fontSize: 12 },
  budgetAmount: { color: colors.text, fontSize: 32, fontWeight: 'bold', marginVertical: 4 },
  budgetOf: { color: colors.textMuted, fontSize: 13 },
  percentCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  percentText: { fontSize: 15, fontWeight: 'bold' },
  progressBar: { height: 8, backgroundColor: colors.cardLight, borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.cardLight, borderRadius: 14, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.primaryBorder },
  tabSwitcher: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.primaryBorder },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  tabBtnActive: { backgroundColor: colors.primary },
  tabIcon: { fontSize: 16, marginRight: 6 },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: colors.bg, fontWeight: '600' },
  tabBadge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  tabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  balancesTabContent: { paddingHorizontal: 20, paddingTop: 8 },
  balanceSummaryCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  balanceSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  balanceSummaryEmoji: { fontSize: 32, marginRight: 14 },
  balanceSummaryTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  balanceSummarySubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  balanceSummaryStats: { flexDirection: 'row', backgroundColor: colors.cardLight, borderRadius: 14, padding: 16 },
  balanceSummaryStat: { flex: 1, alignItems: 'center' },
  balanceSummaryStatValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  balanceSummaryStatLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  balanceSummaryDivider: { width: 1, backgroundColor: colors.primaryBorder, marginHorizontal: 8 },
  balanceSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  balanceSectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  balanceCardsContainer: { gap: 12, marginBottom: 20 },
  balanceUserCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  balanceUserHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  balanceUserInfo: { flexDirection: 'row', alignItems: 'center' },
  balanceUserAvatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  balanceUserAvatar: { fontSize: 24 },
  balanceUserName: { fontSize: 15, fontWeight: '600', color: colors.text },
  balanceUserContribution: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  balanceStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  balanceStatusText: { fontSize: 11, fontWeight: '600' },
  balanceUserStats: { flexDirection: 'row', backgroundColor: colors.cardLight, borderRadius: 12, padding: 12, marginBottom: 12 },
  balanceUserStatItem: { flex: 1, alignItems: 'center' },
  balanceUserStatLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  balanceUserStatValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  balanceUserStatValueHighlight: { fontSize: 15, fontWeight: 'bold' },
  balanceProgressContainer: { marginTop: 4 },
  balanceProgressTrack: { height: 4, backgroundColor: colors.cardLight, borderRadius: 2, overflow: 'hidden' },
  balanceProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  settlementCountBadge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  settlementCountText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  settledContainer: { backgroundColor: colors.card, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: 20 },
  settledIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B98115', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  settledIcon: { fontSize: 32 },
  settledTitle: { fontSize: 18, fontWeight: 'bold', color: '#10B981', marginBottom: 8 },
  settledDescription: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  settlementsContainer: { gap: 12, marginBottom: 20 },
  settlementRow: { backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  settlementFromSection: { flex: 1, alignItems: 'center' },
  settlementToSection: { flex: 1, alignItems: 'center' },
  settlementAvatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EF444415', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  settlementAvatarCircleTo: { backgroundColor: '#10B98115' },
  settlementAvatarText: { fontSize: 24 },
  settlementFromName: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  settlementToName: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  settlementMiddle: { flex: 1.2, alignItems: 'center', justifyContent: 'center' },
  settlementArrowLine: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  settlementDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  settlementLine: { flex: 1, height: 2, backgroundColor: colors.textMuted },
  settlementArrowHead: { width: 0, height: 0, borderLeftWidth: 8, borderTopWidth: 5, borderBottomWidth: 5, borderLeftColor: colors.textMuted, borderTopColor: 'transparent', borderBottomColor: 'transparent' },
  settlementAmountBubble: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  settlementAmountText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  balanceTipsCard: { backgroundColor: colors.cardLight, borderRadius: 14, padding: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: colors.primary },
  balanceTipsTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  balanceTipsText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  // Transactions Tab styles
  filterScroll: { marginBottom: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primaryBorder },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: colors.bg },
  transactionsSection: { paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  emptyBtn: { marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: colors.bg, fontWeight: 'bold' },
  transactionsList: { gap: 16 },
  dateGroup: { marginBottom: 8 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateText: { color: colors.primary, fontSize: 12, fontWeight: '600', backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: colors.primaryBorder, marginHorizontal: 10 },
  dateTotal: { color: colors.textMuted, fontSize: 12 },
  expenseCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.primaryBorder, borderLeftWidth: 4 },
  expenseIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expenseEmoji: { fontSize: 20 },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  expenseCategory: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  expenseSplitInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  expensePaidBy: { color: colors.primary, fontSize: 11, fontWeight: '500' },
  expenseSplitType: { color: colors.textMuted, fontSize: 11 },
  expenseNotes: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { marginTop: 6, padding: 4 },
  deleteBtnText: { fontSize: 14 },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabIcon: { color: colors.bg, fontSize: 20, fontWeight: 'bold', marginRight: 6 },
  fabText: { color: colors.bg, fontSize: 15, fontWeight: 'bold' },

  // Debug styles
  debugCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F59E0B' },
  debugTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400E', marginBottom: 8 },
  debugText: { fontSize: 12, color: '#78350F', marginBottom: 4 },
  debugBtn: { marginTop: 12, backgroundColor: '#F59E0B', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  debugBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // ========== REDESIGNED MODAL STYLES ==========
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: colors.bg, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    maxHeight: '94%',
    paddingTop: 8,
  },
  modalHandle: { 
    width: 48, 
    height: 5, 
    backgroundColor: colors.textMuted + '50', 
    borderRadius: 3, 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalIconText: {
    fontSize: 24,
  },
  modalTitle: { 
    color: colors.text, 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  modalSubtitle: { 
    color: colors.textMuted, 
    fontSize: 13, 
    marginTop: 2 
  },
  modalClose: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: colors.cardLight, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalCloseText: { 
    color: colors.textMuted, 
    fontSize: 20,
    fontWeight: '300',
  },

  // Amount Section
  amountSection: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  amountSectionLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountCurrency: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  amountInputField: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 100,
    textAlign: 'center',
    padding: 0,
  },
  amountSplitBadge: {
    marginTop: 16,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  amountSplitText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },

  // Quick Info Row
  quickInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  quickInfoEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  quickInfoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  quickInfoLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Form Sections
  formSection: {
    marginBottom: 20,
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formSectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  formSectionOptional: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
  },
  descriptionInput: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: (width - 60) / 3,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    position: 'relative',
  },
  categoryCardEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  categoryCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCheckmarkText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Split Options Section
  splitOptionsSection: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  splitOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  splitOptionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitOptionsIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  splitOptionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  splitOptionsSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Split Sub Sections
  splitSubSection: {
    marginBottom: 20,
  },
  splitSubLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
  },
  splitSubLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectAllChip: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectAllChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // Paid By Cards
  paidByScroll: {
    gap: 10,
  },
  paidByCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.cardLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  paidByCardActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  paidByAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  paidByAvatarCircleActive: {
    backgroundColor: colors.primary,
  },
  paidByAvatarEmoji: {
    fontSize: 22,
  },
  paidByCardName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  paidByCardNameActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  paidByCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paidByCheckText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Split Type Cards
  splitTypeCards: {
    flexDirection: 'row',
    gap: 10,
  },
  splitTypeCard: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  splitTypeCardActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  splitTypeCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  splitTypeCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  splitTypeCardLabelActive: {
    color: colors.primary,
  },
  splitTypeCardDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  splitTypeCardDescActive: {
    color: colors.primary,
  },
  splitTypeCheckCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitTypeCheckText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Beneficiary Cards
  beneficiariesCards: {
    gap: 10,
  },
  beneficiaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  beneficiaryCardActive: {
    backgroundColor: colors.bg,
    borderColor: colors.primary,
  },
  beneficiaryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  beneficiaryCheckBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beneficiaryCheckBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  beneficiaryCheckIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  beneficiaryCardAvatar: {
    fontSize: 22,
    marginRight: 10,
  },
  beneficiaryCardName: {
    fontSize: 14,
    color: colors.text,
  },
  beneficiaryCardNameActive: {
    fontWeight: '600',
  },
  beneficiaryCardRight: {
    alignItems: 'flex-end',
  },
  beneficiaryAmountBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  beneficiaryAmountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  customSplitInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  customSplitCurrency: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 4,
  },
  customSplitInput: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    minWidth: 50,
    textAlign: 'right',
    padding: 0,
  },

  // Notes Textarea
  notesTextarea: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.cardLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  submitButtonIcon: {
    fontSize: 18,
    color: '#FFF',
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
