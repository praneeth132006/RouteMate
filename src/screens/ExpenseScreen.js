import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, ScrollView, TextInput, TouchableOpacity, 
  Modal, StyleSheet, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

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
    isMultiUserTrip,
    getAllTravelers,
    getBalances,
    getSettlements,
    tripInfo,
  } = useTravelContext();
  const { colors } = useTheme();
  
  const CATEGORIES = customCategories || [
    { key: 'accommodation', label: 'Stay', emoji: '🏨', color: '#8B5CF6' },
    { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3B82F6' },
    { key: 'food', label: 'Food', emoji: '🍽️', color: '#F59E0B' },
    { key: 'activities', label: 'Activities', emoji: '🎭', color: '#10B981' },
    { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#EC4899' },
    { key: 'other', label: 'Other', emoji: '📦', color: '#6B7280' },
  ];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('transactions');
  
  // DEBUG: Log trip info to see what's happening
  useEffect(() => {
    console.log('=== EXPENSE SCREEN DEBUG ===');
    console.log('Trip Info:', JSON.stringify(tripInfo, null, 2));
    console.log('Trip Type:', tripInfo?.tripType);
    console.log('Participants:', tripInfo?.participants);
    console.log('isMultiUserTrip function exists:', !!isMultiUserTrip);
    console.log('isMultiUserTrip result:', isMultiUserTrip ? isMultiUserTrip() : 'function not available');
  }, [tripInfo]);

  // FIXED: Better check for multi-user trip
  // It's multi-user if tripType exists AND is not 'solo', OR if there are participants
  const isMultiUser = (() => {
    if (isMultiUserTrip) {
      return isMultiUserTrip();
    }
    // Fallback check
    const hasParticipants = tripInfo?.participants?.length > 0;
    const isNotSolo = tripInfo?.tripType && tripInfo.tripType !== 'solo';
    return hasParticipants || isNotSolo;
  })();

  // Get travelers - always include main user, plus any participants
  const travelers = (() => {
    if (getAllTravelers) {
      return getAllTravelers();
    }
    // Fallback
    const mainUser = { id: 'main_user', name: 'You', avatar: '👤' };
    return [mainUser, ...(tripInfo?.participants || [])];
  })();

  // DEBUG: Log multi-user status
  useEffect(() => {
    console.log('isMultiUser:', isMultiUser);
    console.log('travelers:', travelers);
  }, [isMultiUser, travelers]);
  
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

  useEffect(() => {
    if (travelers.length > 0) {
      setNewExpense(prev => ({
        ...prev,
        beneficiaries: travelers.map(t => t.id),
      }));
    }
  }, [travelers.length]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const resetNewExpense = () => {
    setNewExpense({
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
  };

  const handleAddExpense = () => {
    if (newExpense.title.trim() && newExpense.amount) {
      addExpense({ 
        ...newExpense, 
        amount: parseFloat(newExpense.amount) || 0, 
        timestamp: Date.now() 
      });
      resetNewExpense();
      setModalVisible(false);
    }
  };

  const handleDeleteExpense = (id, title) => {
    Alert.alert('Delete Expense', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) }
    ]);
  };

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

  const selectAllBeneficiaries = () => {
    setNewExpense({ ...newExpense, beneficiaries: travelers.map(t => t.id) });
  };

  const updateCustomSplit = (userId, amount) => {
    setNewExpense({
      ...newExpense,
      splitAmounts: { ...newExpense.splitAmounts, [userId]: amount }
    });
  };

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
  const getTravelerName = (id) => travelers.find(t => t.id === id)?.name || 'Unknown';
  const getTravelerAvatar = (id) => travelers.find(t => t.id === id)?.avatar || '👤';
  
  const totalExpenses = getTotalExpenses ? getTotalExpenses() : 0;
  const remainingBudget = getRemainingBudget ? getRemainingBudget() : (budget.total || 0);
  const budgetTotal = budget.total || 0;
  const spentPercentage = budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : 0;
  const balances = getBalances ? getBalances() : {};
  const settlements = getSettlements ? getSettlements() : [];

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

  const safeFormatCurrency = (amount) => {
    if (formatCurrency) return formatCurrency(amount);
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const getSplitPreview = () => {
    const amount = parseFloat(newExpense.amount) || 0;
    if (amount === 0) return null;
    const selectedCount = newExpense.beneficiaries?.length || 0;
    if (selectedCount === 0) return null;
    if (newExpense.splitType === 'equal') {
      return { perPerson: amount / selectedCount, selectedCount, totalAmount: amount };
    }
    return null;
  };

  const splitPreview = getSplitPreview();

  // Render Balances Tab
  const renderBalancesTab = () => (
    <View style={styles.balancesTabContent}>
      {/* Travelers Overview */}
      <View style={styles.travelersCard}>
        <Text style={styles.travelersTitle}>👥 Travelers ({travelers.length})</Text>
        <View style={styles.travelersList}>
          {travelers.map((t) => (
            <View key={t.id} style={styles.travelerChip}>
              <Text style={styles.travelerAvatar}>{t.avatar || '👤'}</Text>
              <Text style={styles.travelerName}>{t.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Individual Balances */}
      <View style={styles.balancesSection}>
        <Text style={styles.balancesSectionTitle}>💰 Individual Balances</Text>
        <View style={styles.balancesList}>
          {Object.entries(balances).map(([id, data]) => (
            <View key={id} style={styles.balanceCard}>
              <View style={styles.balanceCardLeft}>
                <Text style={styles.balanceAvatar}>{getTravelerAvatar(id)}</Text>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceName}>{data.name}</Text>
                  <Text style={styles.balancePaid}>Paid: {safeFormatCurrency(data.paid)}</Text>
                </View>
              </View>
              <View style={styles.balanceCardRight}>
                <Text style={[styles.balanceAmount, { color: data.balance >= 0 ? '#10B981' : '#EF4444' }]}>
                  {data.balance >= 0 ? '+' : ''}{safeFormatCurrency(data.balance)}
                </Text>
                <Text style={styles.balanceStatus}>
                  {data.balance >= 0 ? 'Gets back' : 'Owes'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Settlements */}
      <View style={styles.settlementsSection}>
        <Text style={styles.settlementsSectionTitle}>💸 To Settle Up</Text>
        {settlements.length === 0 ? (
          <View style={styles.settledCard}>
            <Text style={styles.settledEmoji}>✅</Text>
            <Text style={styles.settledTitle}>All Settled!</Text>
            <Text style={styles.settledText}>No pending settlements</Text>
          </View>
        ) : (
          <View style={styles.settlementsList}>
            {settlements.map((s, idx) => (
              <View key={idx} style={styles.settlementCard}>
                <View style={styles.settlementUsers}>
                  <View style={styles.settlementFrom}>
                    <Text style={styles.settlementAvatar}>{getTravelerAvatar(s.from)}</Text>
                    <Text style={styles.settlementFromName}>{s.fromName}</Text>
                  </View>
                  <View style={styles.settlementArrowContainer}>
                    <Text style={styles.settlementArrow}>→</Text>
                    <Text style={styles.settlementAmount}>{safeFormatCurrency(s.amount)}</Text>
                  </View>
                  <View style={styles.settlementTo}>
                    <Text style={styles.settlementAvatar}>{getTravelerAvatar(s.to)}</Text>
                    <Text style={styles.settlementToName}>{s.toName}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Expense Summary by Payer */}
      <View style={styles.summarySection}>
        <Text style={styles.summarySectionTitle}>📊 Expense Summary</Text>
        <View style={styles.summaryCards}>
          {Object.entries(balances).map(([id, data]) => {
            const payerExpenses = expenses.filter(e => e.paidBy === id);
            return (
              <View key={id} style={styles.summaryCard}>
                <Text style={styles.summaryCardAvatar}>{getTravelerAvatar(id)}</Text>
                <Text style={styles.summaryCardName}>{data.name}</Text>
                <Text style={styles.summaryCardAmount}>{safeFormatCurrency(data.paid)}</Text>
                <Text style={styles.summaryCardCount}>{payerExpenses.length} expenses</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  // Render Transactions Tab
  const renderTransactionsTab = () => (
    <View>
      {/* Quick Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]} onPress={() => setFilterCategory('all')}>
          <Text style={[styles.filterText, filterCategory === 'all' && styles.filterTextActive]}>All ({expenses.length})</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => {
          const count = expenses.filter(e => e.category === cat.key).length;
          if (count === 0) return null;
          return (
            <TouchableOpacity key={cat.key} style={[styles.filterChip, filterCategory === cat.key && { backgroundColor: cat.color }]} onPress={() => setFilterCategory(filterCategory === cat.key ? 'all' : cat.key)}>
              <Text style={[styles.filterText, filterCategory === cat.key && { color: '#FFF' }]}>{cat.emoji} {count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Transactions List */}
      <View style={styles.section}>
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
                  <Text style={styles.dateTotal}>{safeFormatCurrency(groupedExpenses[date].reduce((s, e) => s + (parseFloat(e.amount) || 0), 0))}</Text>
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
                            <Text style={styles.expensePaidBy}>
                              💳 Paid by {getTravelerName(expense.paidBy)}
                            </Text>
                            <Text style={styles.expenseSplitType}>
                              {expense.splitType === 'equal' ? `⚖️ Split equally` : expense.splitType === 'custom' ? '✏️ Custom split' : '👤 No split'}
                            </Text>
                          </View>
                        )}
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
            {isMultiUser ? `${tripInfo?.tripType || 'Group'} Trip • ${travelers.length} travelers` : 'Track your spending'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* DEBUG INFO - Remove after testing */}
        <View style={styles.debugCard}>
          <Text style={styles.debugTitle}>🔧 Debug Info (remove later)</Text>
          <Text style={styles.debugText}>Trip Type: {tripInfo?.tripType || 'NOT SET'}</Text>
          <Text style={styles.debugText}>Participants: {tripInfo?.participants?.length || 0}</Text>
          <Text style={styles.debugText}>Is Multi-User: {isMultiUser ? 'YES ✅' : 'NO ❌'}</Text>
          <Text style={styles.debugText}>Travelers: {travelers.map(t => t.name).join(', ')}</Text>
        </View>

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

        {/* Tab Switcher - ALWAYS SHOW FOR NOW TO DEBUG */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'transactions' && styles.tabBtnActive]} onPress={() => setActiveTab('transactions')}>
            <Text style={styles.tabIcon}>💳</Text>
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'balances' && styles.tabBtnActive]} onPress={() => setActiveTab('balances')}>
            <Text style={styles.tabIcon}>👥</Text>
            <Text style={[styles.tabText, activeTab === 'balances' && styles.tabTextActive]}>Balances</Text>
            {settlements.length > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{settlements.length}</Text></View>
            )}
          </TouchableOpacity>
        </View>

        {activeTab === 'balances' ? renderBalancesTab() : renderTransactionsTab()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Add</Text>
      </TouchableOpacity>

      {/* Add Modal - ALWAYS SHOW SPLIT OPTIONS FOR DEBUGGING */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Expense</Text>
                <Text style={styles.modalSubtitle}>👥 {travelers.length} travelers • Multi-user: {isMultiUser ? 'Yes' : 'No'}</Text>
              </View>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetNewExpense(); }} style={styles.modalClose}>
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
                {splitPreview && (
                  <View style={styles.splitPreview}>
                    <Text style={styles.splitPreviewText}>
                      ⚖️ {safeFormatCurrency(splitPreview.perPerson)} per person ({splitPreview.selectedCount} people)
                    </Text>
                  </View>
                )}
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

              {/* Split Section - ALWAYS SHOW FOR NOW */}
              <View style={styles.splitSection}>
                <View style={styles.splitSectionHeader}>
                  <Text style={styles.splitSectionTitle}>👥 Split Details</Text>
                  <Text style={styles.splitSectionSubtitle}>Who paid and how to split?</Text>
                </View>

                {/* Paid By */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>💳 Who Paid?</Text>
                  <View style={styles.paidByGrid}>
                    {travelers.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.paidByItem, newExpense.paidBy === t.id && styles.paidByItemActive]}
                        onPress={() => setNewExpense({...newExpense, paidBy: t.id})}
                      >
                        <Text style={styles.paidByAvatar}>{t.avatar || '👤'}</Text>
                        <Text style={[styles.paidByName, newExpense.paidBy === t.id && styles.paidByNameActive]}>{t.name}</Text>
                        {newExpense.paidBy === t.id && <Text style={styles.paidByCheck}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Split Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>📊 How to Split?</Text>
                  <View style={styles.splitTypeRow}>
                    <TouchableOpacity
                      style={[styles.splitTypeBtn, newExpense.splitType === 'equal' && styles.splitTypeBtnActive]}
                      onPress={() => setNewExpense({...newExpense, splitType: 'equal'})}
                    >
                      <Text style={styles.splitTypeIcon}>⚖️</Text>
                      <Text style={[styles.splitTypeLabel, newExpense.splitType === 'equal' && styles.splitTypeLabelActive]}>Equal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.splitTypeBtn, newExpense.splitType === 'custom' && styles.splitTypeBtnActive]}
                      onPress={() => setNewExpense({...newExpense, splitType: 'custom'})}
                    >
                      <Text style={styles.splitTypeIcon}>✏️</Text>
                      <Text style={[styles.splitTypeLabel, newExpense.splitType === 'custom' && styles.splitTypeLabelActive]}>Custom</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.splitTypeBtn, newExpense.splitType === 'full' && styles.splitTypeBtnActive]}
                      onPress={() => setNewExpense({...newExpense, splitType: 'full'})}
                    >
                      <Text style={styles.splitTypeIcon}>👤</Text>
                      <Text style={[styles.splitTypeLabel, newExpense.splitType === 'full' && styles.splitTypeLabelActive]}>No Split</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Beneficiaries */}
                {newExpense.splitType !== 'full' && (
                  <View style={styles.inputGroup}>
                    <View style={styles.beneficiariesHeader}>
                      <Text style={styles.inputLabel}>👥 Split Among</Text>
                      <TouchableOpacity style={styles.selectAllBtn} onPress={selectAllBeneficiaries}>
                        <Text style={styles.selectAllText}>Select All</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.beneficiariesGrid}>
                      {travelers.map((t) => {
                        const isSelected = newExpense.beneficiaries?.includes(t.id);
                        const equalAmount = newExpense.splitType === 'equal' && newExpense.amount && isSelected
                          ? (parseFloat(newExpense.amount) / (newExpense.beneficiaries?.length || 1))
                          : 0;
                        
                        return (
                          <TouchableOpacity
                            key={t.id}
                            style={[styles.beneficiaryItem, isSelected && styles.beneficiaryItemActive]}
                            onPress={() => toggleBeneficiary(t.id)}
                          >
                            <View style={[styles.beneficiaryCheck, isSelected && styles.beneficiaryCheckActive]}>
                              {isSelected && <Text style={styles.beneficiaryCheckText}>✓</Text>}
                            </View>
                            <Text style={styles.beneficiaryAvatar}>{t.avatar || '👤'}</Text>
                            <View style={styles.beneficiaryInfo}>
                              <Text style={[styles.beneficiaryName, isSelected && styles.beneficiaryNameActive]}>{t.name}</Text>
                              {newExpense.splitType === 'equal' && isSelected && equalAmount > 0 && (
                                <Text style={styles.beneficiaryAmount}>{safeFormatCurrency(equalAmount)}</Text>
                              )}
                            </View>
                            {newExpense.splitType === 'custom' && isSelected && (
                              <TextInput
                                style={styles.beneficiaryInput}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                                value={newExpense.splitAmounts?.[t.id]?.toString() || ''}
                                onChangeText={(val) => updateCustomSplit(t.id, val)}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Notes (optional)</Text>
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

              <View style={{ height: 40 }} />
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
  
  // Debug Card
  debugCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F59E0B' },
  debugTitle: { color: '#92400E', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  debugText: { color: '#78350F', fontSize: 11, marginBottom: 2 },

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

  tabSwitcher: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.primaryBorder },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  tabBtnActive: { backgroundColor: colors.primary },
  tabIcon: { fontSize: 16, marginRight: 6 },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: colors.bg, fontWeight: '600' },
  tabBadge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  tabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  balancesTabContent: { paddingHorizontal: 20 },
  travelersCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  travelersTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  travelersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  travelerChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  travelerAvatar: { fontSize: 18, marginRight: 6 },
  travelerName: { color: colors.text, fontSize: 13, fontWeight: '500' },
  
  balancesSection: { marginBottom: 16 },
  balancesSectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  balancesList: { gap: 10 },
  balanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.primaryBorder },
  balanceCardLeft: { flexDirection: 'row', alignItems: 'center' },
  balanceAvatar: { fontSize: 28, marginRight: 12 },
  balanceInfo: {},
  balanceName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  balancePaid: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  balanceCardRight: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: 18, fontWeight: 'bold' },
  balanceStatus: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  settlementsSection: { marginBottom: 16 },
  settlementsSectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  settledCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  settledEmoji: { fontSize: 40, marginBottom: 8 },
  settledTitle: { color: '#10B981', fontSize: 18, fontWeight: 'bold' },
  settledText: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  settlementsList: { gap: 10 },
  settlementCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  settlementUsers: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settlementFrom: { alignItems: 'center', flex: 1 },
  settlementTo: { alignItems: 'center', flex: 1 },
  settlementAvatar: { fontSize: 28, marginBottom: 4 },
  settlementFromName: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  settlementToName: { color: '#10B981', fontSize: 13, fontWeight: '600' },
  settlementArrowContainer: { alignItems: 'center', paddingHorizontal: 12 },
  settlementArrow: { color: colors.primary, fontSize: 24 },
  settlementAmount: { color: colors.primary, fontSize: 16, fontWeight: 'bold', marginTop: 4 },

  section: { paddingHorizontal: 20, marginBottom: 16 },
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
  expenseCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.primaryBorder, borderLeftWidth: 4 },
  expenseIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expenseEmoji: { fontSize: 20 },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  expenseCategory: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  expenseSplitInfo: { marginTop: 6, backgroundColor: colors.cardLight, padding: 8, borderRadius: 8 },
  expensePaidBy: { color: colors.primary, fontSize: 12, fontWeight: '500' },
  expenseSplitType: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  expenseNotes: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { marginTop: 6, padding: 4 },
  deleteBtnText: { fontSize: 14 },

  fab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, elevation: 5 },
  fabIcon: { color: colors.bg, fontSize: 20, fontWeight: 'bold', marginRight: 6 },
  fabText: { color: colors.bg, fontSize: 15, fontWeight: 'bold' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, maxHeight: '94%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalSubtitle: { color: colors.primary, fontSize: 13, marginTop: 4 },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: colors.textMuted, fontSize: 18 },

  amountBox: { backgroundColor: colors.cardLight, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  amountLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  amountInput: { color: colors.text, fontSize: 40, fontWeight: 'bold', minWidth: 80, textAlign: 'center' },
  splitPreview: { marginTop: 12, backgroundColor: colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  splitPreviewText: { color: colors.primary, fontSize: 13, fontWeight: '500' },

  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: colors.cardLight, color: colors.text, padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: colors.primaryBorder },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  catEmoji: { fontSize: 16, marginRight: 6 },
  catText: { color: colors.text, fontSize: 12, fontWeight: '500' },

  splitSection: { backgroundColor: colors.cardLight, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primary + '30' },
  splitSectionHeader: { marginBottom: 16 },
  splitSectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  splitSectionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  paidByGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paidByItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.primaryBorder, flex: 1, minWidth: '45%' },
  paidByItemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  paidByAvatar: { fontSize: 22, marginRight: 10 },
  paidByName: { color: colors.text, fontSize: 14, fontWeight: '500', flex: 1 },
  paidByNameActive: { color: colors.bg },
  paidByCheck: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },

  splitTypeRow: { flexDirection: 'row', gap: 8 },
  splitTypeBtn: { flex: 1, alignItems: 'center', backgroundColor: colors.bg, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, borderWidth: 2, borderColor: colors.primaryBorder },
  splitTypeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  splitTypeIcon: { fontSize: 22, marginBottom: 6 },
  splitTypeLabel: { color: colors.text, fontSize: 12, fontWeight: '600' },
  splitTypeLabelActive: { color: colors.bg },

  beneficiariesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectAllBtn: { backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  selectAllText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  beneficiariesGrid: { gap: 8 },
  beneficiaryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.primaryBorder },
  beneficiaryItemActive: { borderColor: colors.primary },
  beneficiaryCheck: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.primaryBorder, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  beneficiaryCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  beneficiaryCheckText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  beneficiaryAvatar: { fontSize: 22, marginRight: 10 },
  beneficiaryInfo: { flex: 1 },
  beneficiaryName: { color: colors.text, fontSize: 14 },
  beneficiaryNameActive: { fontWeight: '600' },
  beneficiaryAmount: { color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  beneficiaryInput: { backgroundColor: colors.cardLight, color: colors.text, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, width: 80, textAlign: 'right', fontSize: 14, fontWeight: '600', borderWidth: 1, borderColor: colors.primaryBorder },

  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
});
