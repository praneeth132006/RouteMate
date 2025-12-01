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
    transferTo: null, // Added for transfer type
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
      } else if (expense.splitType === 'transfer' && expense.transferTo) {
        // For transfers: payer sends money, recipient receives it
        // The recipient "owes" the amount (meaning they received it)
        if (result[expense.transferTo]) {
          result[expense.transferTo].owes += amount;
        }
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
          <View style={styles.balanceSummaryStats}>
            <View style={styles.balanceSummaryStat}>
              <Text style={styles.balanceSummaryStatLabel}>Total Spent</Text>
              <Text style={styles.balanceSummaryStatValue}>{safeFormatCurrency(totalPaid)}</Text>
            </View>
            <View style={styles.balanceSummaryDivider} />
            <View style={styles.balanceSummaryStat}>
              <Text style={styles.balanceSummaryStatLabel}>Per Person</Text>
              <Text style={styles.balanceSummaryStatValue}>{safeFormatCurrency(totalPaid / travelers.length)}</Text>
            </View>
            <View style={styles.balanceSummaryDivider} />
            <View style={styles.balanceSummaryStat}>
              <Text style={styles.balanceSummaryStatLabel}>Expenses</Text>
              <Text style={styles.balanceSummaryStatValue}>{expenses.length}</Text>
            </View>
          </View>
        </View>

        {/* Individual Balances */}
        <Text style={styles.sectionTitle}>Who Owes Who?</Text>
        
        <View style={styles.balanceCardsContainer}>
          {Object.entries(balances).map(([id, data]) => {
            const isPositive = data.balance >= 0;
            const balanceAbs = Math.abs(data.balance);
            
            return (
              <View key={id} style={styles.balanceCard}>
                <View style={styles.balanceCardLeft}>
                  <View style={styles.balanceAvatar}>
                    <Text style={styles.balanceAvatarText}>{getTravelerAvatar(id)}</Text>
                  </View>
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceName}>{data.name}</Text>
                    <Text style={styles.balanceDetail}>
                      Paid {safeFormatCurrency(data.paid)} • Share {safeFormatCurrency(data.owes)}
                    </Text>
                  </View>
                </View>
                <View style={styles.balanceCardRight}>
                  <Text style={[
                    styles.balanceAmount,
                    { color: isPositive ? '#059669' : '#DC2626' }
                  ]}>
                    {isPositive ? '+' : '-'}{safeFormatCurrency(balanceAbs)}
                  </Text>
                  <Text style={[
                    styles.balanceStatus,
                    { color: isPositive ? '#059669' : '#DC2626' }
                  ]}>
                    {balanceAbs < 1 ? 'Settled' : isPositive ? 'to receive' : 'to pay'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Settlements Section */}
        <View style={styles.settlementsHeader}>
          <Text style={styles.sectionTitle}>Settle Up</Text>
          {settlements.length > 0 && (
            <Text style={styles.settlementCount}>{settlements.length} payment{settlements.length > 1 ? 's' : ''}</Text>
          )}
        </View>

        {settlements.length === 0 ? (
          <View style={styles.settledCard}>
            <Text style={styles.settledEmoji}>✓</Text>
            <Text style={styles.settledText}>All settled! No payments needed.</Text>
          </View>
        ) : (
          <View style={styles.settlementsContainer}>
            {settlements.map((s, idx) => (
              <View key={idx} style={styles.settlementCard}>
                <View style={styles.settlementPerson}>
                  <Text style={styles.settlementAvatar}>{getTravelerAvatar(s.from)}</Text>
                  <Text style={styles.settlementName}>{s.fromName}</Text>
                </View>
                
                <View style={styles.settlementArrow}>
                  <Text style={styles.settlementArrowText}>pays</Text>
                  <Text style={styles.settlementAmountText}>{safeFormatCurrency(s.amount)}</Text>
                  <Text style={styles.settlementArrowIcon}>→</Text>
                </View>
                
                <View style={styles.settlementPerson}>
                  <Text style={styles.settlementAvatar}>{getTravelerAvatar(s.to)}</Text>
                  <Text style={styles.settlementName}>{s.toName}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
                  const isTransfer = expense.splitType === 'transfer';
                  
                  return (
                    <View key={expense.id} style={[
                      styles.expenseCard, 
                      { borderLeftColor: isTransfer ? '#10B981' : cat.color }
                    ]}>
                      <View style={[
                        styles.expenseIcon, 
                        { backgroundColor: isTransfer ? '#10B98120' : cat.color + '20' }
                      ]}>
                        <Text style={styles.expenseEmoji}>{isTransfer ? '💸' : cat.emoji}</Text>
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                        {isTransfer ? (
                          <View style={styles.transferInfoRow}>
                            <Text style={styles.transferFromText}>
                              {getTravelerAvatar(expense.paidBy)} {getTravelerName(expense.paidBy)}
                            </Text>
                            <Text style={styles.transferArrowSmall}>→</Text>
                            <Text style={styles.transferToText}>
                              {getTravelerAvatar(expense.transferTo)} {getTravelerName(expense.transferTo)}
                            </Text>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.expenseCategory}>{cat.label}</Text>
                            {isMultiUser && expense.paidBy && (
                              <View style={styles.expenseSplitInfo}>
                                <Text style={styles.expensePaidBy}>💳 {getTravelerName(expense.paidBy)}</Text>
                                <Text style={styles.expenseSplitType}>
                                  {expense.splitType === 'equal' ? '⚖️ Equal' : 
                                   expense.splitType === 'custom' ? '✏️ Custom' : ''}
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                        {expense.notes ? <Text style={styles.expenseNotes}>📝 {expense.notes}</Text> : null}
                      </View>
                      <View style={styles.expenseRight}>
                        <Text style={[
                          styles.expenseAmount, 
                          isTransfer && { color: '#10B981' }
                        ]}>
                          {isTransfer ? '' : '-'}{safeFormatCurrency(expense.amount)}
                        </Text>
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
              {/* Amount Input - Inline */}
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount</Text>
                <View style={styles.amountInputBox}>
                  <Text style={styles.amountSymbol}>{currency.symbol}</Text>
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

              {/* Description Input */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Description *</Text>
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
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = newExpense.category === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.categoryChip,
                          isSelected && { backgroundColor: cat.color, borderColor: cat.color }
                        ]}
                        onPress={() => setNewExpense({...newExpense, category: cat.key})}
                      >
                        <Text style={styles.categoryChipEmoji}>{cat.emoji}</Text>
                        <Text style={[styles.categoryChipLabel, isSelected && { color: '#FFF' }]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Split Options - Only for multi-user trips */}
              {isMultiUser && travelers.length > 1 && (
                <View style={styles.splitSection}>
                  <Text style={styles.inputLabel}>👥 Split Options</Text>

                  {/* Paid By Selection */}
                  <View style={styles.splitRow}>
                    <Text style={styles.splitLabel}>Paid by</Text>
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
                            style={[styles.paidByChip, isSelected && styles.paidByChipActive]}
                            onPress={() => setNewExpense({...newExpense, paidBy: t.id})}
                          >
                            <Text style={styles.paidByAvatar}>{t.avatar || '👤'}</Text>
                            <Text style={[styles.paidByName, isSelected && styles.paidByNameActive]}>
                              {t.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Split Type Selection */}
                  <View style={styles.splitRow}>
                    <Text style={styles.splitLabel}>Split</Text>
                    <View style={styles.splitTypeRow}>
                      {[
                        { key: 'equal', label: 'Equal' },
                        { key: 'custom', label: 'Custom' },
                        { key: 'transfer', label: 'Transfer' },
                      ].map((type) => {
                        const isSelected = newExpense.splitType === type.key;
                        return (
                          <TouchableOpacity
                            key={type.key}
                            style={[styles.splitTypeChip, isSelected && styles.splitTypeChipActive]}
                            onPress={() => setNewExpense({...newExpense, splitType: type.key})}
                          >
                            <Text style={[styles.splitTypeText, isSelected && styles.splitTypeTextActive]}>
                              {type.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Transfer Selection */}
                  {newExpense.splitType === 'transfer' && (
                    <View style={styles.splitRow}>
                      <Text style={styles.splitLabel}>To</Text>
                      <View style={styles.transferToRow}>
                        {travelers.filter(t => t.id !== newExpense.paidBy).map((t) => {
                          const isSelected = newExpense.transferTo === t.id;
                          return (
                            <TouchableOpacity
                              key={t.id}
                              style={[styles.transferToChip, isSelected && styles.transferToChipActive]}
                              onPress={() => setNewExpense({...newExpense, transferTo: t.id, beneficiaries: [t.id]})}
                            >
                              <Text style={styles.transferToAvatar}>{t.avatar || '👤'}</Text>
                              <Text style={[styles.transferToName, isSelected && styles.transferToNameActive]}>
                                {t.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Beneficiaries Selection - Equal & Custom */}
                  {(newExpense.splitType === 'equal' || newExpense.splitType === 'custom') && (
                    <View style={styles.beneficiarySection}>
                      <View style={styles.beneficiaryHeader}>
                        <Text style={styles.splitLabel}>Among</Text>
                        <TouchableOpacity onPress={selectAllBeneficiaries}>
                          <Text style={styles.selectAllText}>All</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {travelers.map((t) => {
                        const isSelected = newExpense.beneficiaries?.includes(t.id);
                        const equalAmount = newExpense.splitType === 'equal' && newExpense.amount && isSelected
                          ? (parseFloat(newExpense.amount) / (newExpense.beneficiaries?.length || 1))
                          : 0;
                        
                        return (
                          <View key={t.id} style={styles.beneficiaryRow}>
                            <TouchableOpacity 
                              style={styles.beneficiaryLeft}
                              onPress={() => toggleBeneficiary(t.id)}
                            >
                              <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                {isSelected && <Text style={styles.checkmark}>✓</Text>}
                              </View>
                              <Text style={styles.beneficiaryAvatar}>{t.avatar || '👤'}</Text>
                              <Text style={styles.beneficiaryName}>{t.name}</Text>
                            </TouchableOpacity>
                            
                            {isSelected && (
                              <View style={styles.beneficiaryRight}>
                                {newExpense.splitType === 'equal' ? (
                                  <Text style={styles.equalAmount}>{safeFormatCurrency(equalAmount)}</Text>
                                ) : (
                                  <TextInput
                                    style={styles.customInput}
                                    placeholder="0"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="decimal-pad"
                                    value={newExpense.splitAmounts?.[t.id]?.toString() || ''}
                                    onChangeText={(val) => updateCustomSplit(t.id, val.replace(/[^0-9.]/g, ''))}
                                  />
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* Notes */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Optional details..."
                  placeholderTextColor={colors.textMuted}
                  value={newExpense.notes}
                  onChangeText={(t) => setNewExpense({...newExpense, notes: t})}
                  multiline
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, (!newExpense.title.trim() || !newExpense.amount) && styles.submitButtonDisabled]}
                onPress={handleAddExpense}
                disabled={!newExpense.title.trim() || !newExpense.amount}
              >
                <Text style={styles.submitButtonText}>Add Expense</Text>
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
  tabBadge: { backgroundColor: '#DC2626', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  tabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // Balance Tab - Redesigned
  balancesTabContent: { paddingHorizontal: 20, paddingTop: 8 },
  balanceSummaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  balanceSummaryStats: { flexDirection: 'row' },
  balanceSummaryStat: { flex: 1, alignItems: 'center' },
  balanceSummaryStatLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  balanceSummaryStatValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  balanceSummaryDivider: { width: 1, backgroundColor: colors.primaryBorder, marginHorizontal: 12 },
  
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 },
  
  // Balance Cards - Clean Design
  balanceCardsContainer: { gap: 8, marginBottom: 24 },
  balanceCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: colors.card, 
    borderRadius: 12, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: colors.primaryBorder 
  },
  balanceCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  balanceAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: colors.cardLight, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  balanceAvatarText: { fontSize: 20 },
  balanceInfo: { flex: 1 },
  balanceName: { fontSize: 14, fontWeight: '600', color: colors.text },
  balanceDetail: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  balanceCardRight: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: 16, fontWeight: 'bold' },
  balanceStatus: { fontSize: 10, marginTop: 2 },

  // Settlements - Cleaner
  settlementsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  settlementCount: { fontSize: 12, color: colors.textMuted },
  settledCard: { 
    backgroundColor: colors.card, 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.primaryBorder,
    marginBottom: 20,
  },
  settledEmoji: { fontSize: 24, color: '#059669', marginBottom: 8 },
  settledText: { fontSize: 14, color: colors.textMuted },
  settlementsContainer: { gap: 10, marginBottom: 20 },
  settlementCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.card, 
    borderRadius: 12, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: colors.primaryBorder 
  },
  settlementPerson: { flex: 1, alignItems: 'center' },
  settlementAvatar: { fontSize: 24, marginBottom: 4 },
  settlementName: { fontSize: 12, color: colors.text, fontWeight: '500' },
  settlementArrow: { alignItems: 'center', paddingHorizontal: 8 },
  settlementArrowText: { fontSize: 10, color: colors.textMuted },
  settlementAmountText: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginVertical: 2 },
  settlementArrowIcon: { fontSize: 16, color: colors.textMuted },

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
  expenseAmount: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { marginTop: 6, padding: 4 },
  deleteBtnText: { fontSize: 14 },
  transferInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  transferFromText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  transferArrowSmall: { fontSize: 14, color: colors.textMuted },
  transferToText: { fontSize: 12, color: '#059669', fontWeight: '500' },

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

  // ========== MODAL STYLES ==========
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingTop: 8 },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.textMuted + '40', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  modalScrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, marginBottom: 12 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  modalIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  modalIconText: { fontSize: 18 },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  modalSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cardLight, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: colors.textMuted, fontSize: 16 },

  // Amount - Inline Row
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  amountSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 80,
    padding: 0,
  },

  // Form Sections
  formSection: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  descriptionInput: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    minHeight: 50,
    textAlignVertical: 'top',
  },

  // Category
  categoryScroll: { gap: 6 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: 4,
  },
  categoryChipEmoji: { fontSize: 13 },
  categoryChipLabel: { fontSize: 11, fontWeight: '500', color: colors.text },

  // Split Section
  splitSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  splitRow: { marginBottom: 12 },
  splitLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },

  // Paid By
  paidByScroll: { gap: 6 },
  paidByChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paidByChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  paidByAvatar: { fontSize: 14 },
  paidByName: { fontSize: 12, color: colors.text },
  paidByNameActive: { color: colors.primary, fontWeight: '600' },

  // Split Type
  splitTypeRow: { flexDirection: 'row', gap: 6 },
  splitTypeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  splitTypeChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  splitTypeText: { fontSize: 11, color: colors.text },
  splitTypeTextActive: { color: colors.primary, fontWeight: '600' },

  // Transfer To
  transferToRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  transferToChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  transferToChipActive: {
    backgroundColor: '#05966910',
    borderColor: '#059669',
  },
  transferToAvatar: { fontSize: 14 },
  transferToName: { fontSize: 12, color: colors.text },
  transferToNameActive: { color: '#059669', fontWeight: '600' },

  // Beneficiaries
  beneficiarySection: { marginTop: 4 },
  beneficiaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectAllText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  beneficiaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  beneficiaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  beneficiaryAvatar: { fontSize: 16, marginRight: 6 },
  beneficiaryName: { fontSize: 13, color: colors.text },
  beneficiaryRight: { alignItems: 'flex-end' },
  equalAmount: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  customInput: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: colors.cardLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    textAlign: 'right',
  },

  // Submit Button
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },
});
