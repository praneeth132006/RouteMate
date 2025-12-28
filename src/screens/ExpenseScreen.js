import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, StyleSheet, Dimensions, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// Fallback if context fails
const DEFAULT_CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍽️', color: '#F59E0B' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3B82F6' },
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
    setTripInfo,
  } = useTravelContext();
  const { colors } = useTheme();

  // Use context categories
  const CATEGORIES = customCategories && customCategories.length > 0 ? customCategories : DEFAULT_CATEGORIES;

  const [modalVisible, setModalVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('transactions');

  // New Expense State
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: CATEGORIES[0]?.key || 'food',
    paidBy: 'main_user',
    splitType: 'equal', // 'equal', 'custom'
    beneficiaries: [], // List of user IDs involved
    splitAmounts: {}, // For custom split: { userId: amount }
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  });

  const getTravelerName = (id) => travelers.find(t => t.id === id)?.name || 'Unknown';
  const getTravelerAvatar = (id) => travelers.find(t => t.id === id)?.avatar || '👤';

  // Determine travelers
  const travelers = useMemo(() => {
    const mainUser = { id: 'main_user', name: 'You', avatar: '👤' };
    const participants = (tripInfo.participants || []).map((p, i) => ({
      ...p,
      id: p.id || `part_${i}_${(p.name || '').replace(/\s+/g, '')}`
    }));
    return [mainUser, ...participants];
  }, [tripInfo.participants]);

  // Is this a group trip?
  const isMultiUser = travelers.length > 1;

  // Initialize beneficiaries when modal opens or travelers change
  useEffect(() => {
    if (travelers.length > 0 && newExpense.beneficiaries.length === 0) {
      setNewExpense(prev => ({
        ...prev,
        beneficiaries: travelers.map(t => t.id)
      }));
    }
  }, [travelers, modalVisible]);

  // --- Logic for Split Validation ---
  const currentTotalAmount = parseFloat(newExpense.amount) || 0;

  const getSplitValidation = () => {
    if (!isMultiUser) return { isValid: true, message: '' };

    if (newExpense.splitType === 'equal') {
      return { isValid: newExpense.beneficiaries.length > 0, message: '' };
    }

    if (newExpense.splitType === 'custom') {
      let allocated = 0;
      travelers.forEach(t => {
        allocated += parseFloat(newExpense.splitAmounts[t.id] || 0);
      });

      const diff = currentTotalAmount - allocated;

      if (Math.abs(diff) < 0.01) return { isValid: true, message: 'Perfectly split! ✅' };
      if (diff > 0) return { isValid: false, message: `Remaining: ${formatCurrency ? formatCurrency(diff) : diff.toFixed(0)}` };
      return { isValid: false, message: `Over allocated: ${formatCurrency ? formatCurrency(Math.abs(diff)) : Math.abs(diff).toFixed(0)}` };
    }

    return { isValid: true };
  };

  const splitStatus = getSplitValidation();

  const handleAddExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount) {
      Alert.alert('Missing Info', 'Please enter amount and description');
      return;
    }

    // Final validation check
    if (!splitStatus.isValid && isMultiUser) {
      Alert.alert('Invalid Split', splitStatus.message);
      return;
    }

    const expenseData = {
      ...newExpense,
      id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: parseFloat(newExpense.amount),
      timestamp: Date.now(),
    };

    addExpense(expenseData);
    setModalVisible(false);
    // Reset form
    setNewExpense({
      title: '',
      amount: '',
      category: CATEGORIES[0]?.key,
      paidBy: 'main_user',
      splitType: 'equal',
      beneficiaries: travelers.map(t => t.id),
      splitAmounts: {},
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
  };

  // --- Calculations for Balances ---
  // Simplified debt simplification logic
  const balances = useMemo(() => {
    if (!isMultiUser) return {};
    const bal = {};
    travelers.forEach(t => bal[t.id] = 0);

    expenses.forEach(e => {
      const amt = parseFloat(e.amount);
      const payer = e.paidBy || 'main_user';

      // Payer +ve
      bal[payer] = (bal[payer] || 0) + amt;

      // Debtors -ve
      if (e.splitType === 'custom') {
        Object.keys(e.splitAmounts || {}).forEach(uid => {
          bal[uid] = (bal[uid] || 0) - parseFloat(e.splitAmounts[uid]);
        });
      } else {
        // Equal split
        const bens = e.beneficiaries || [];
        const splitAmt = amt / (bens.length || 1);
        bens.forEach(uid => {
          bal[uid] = (bal[uid] || 0) - splitAmt;
        });
      }
    });
    return bal; // Positive means "owed money", Negative means "owes money"
  }, [expenses, travelers]);

  // Styles
  const styles = useMemo(() => createStyles(colors), [colors]);

  const safeFormat = (val) => {
    if (formatCurrency) return formatCurrency(val);
    return `${currency.symbol}${parseFloat(val).toFixed(0)}`;
  };

  const totalSpent = getTotalExpenses ? getTotalExpenses() : 0;
  const remainingBudget = (budget.total || 0) - totalSpent;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💳 Expenses</Text>
          <Text style={styles.headerSubtitle}>
            {isMultiUser ? `${travelers.length} Travelers • Group Trip` : 'Personal Spending'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
            <Text style={styles.summaryValue}>{safeFormat(totalSpent)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>REMAINING</Text>
            <Text style={[styles.summaryValue, { color: remainingBudget < 0 ? '#EF4444' : '#10B981' }]}>
              {safeFormat(remainingBudget)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryBar}>
          <View style={[styles.summaryFill, { width: `${Math.min((totalSpent / budget.total) * 100, 100)}%`, backgroundColor: remainingBudget < 0 ? '#EF4444' : colors.primary }]} />
        </View>
      </View>

      {/* Tabs */}
      {isMultiUser && (
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('transactions')} style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('balances')} style={[styles.tab, activeTab === 'balances' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'balances' && styles.tabTextActive]}>Balances</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'transactions' ? (
          <>
            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💸</Text>
                <Text style={styles.emptyText}>No expenses yet. Tap + to add one!</Text>
              </View>
            ) : (
              expenses.slice().reverse().map(expense => {
                const cat = CATEGORIES.find(c => c.key === expense.category) || CATEGORIES[0];
                return (
                  <View key={expense.id} style={styles.expenseCard}>
                    <View style={[styles.exIcon, { backgroundColor: cat.color + '20' }]}>
                      <Text style={styles.exEmoji}>{cat.emoji}</Text>
                    </View>
                    <View style={styles.exContent}>
                      <Text style={styles.exTitle}>{expense.title}</Text>
                      <Text style={styles.exSub}>
                        {getTravelerName(expense.paidBy)} paid • {cat.label}
                      </Text>
                    </View>
                    <View style={styles.exRight}>
                      <Text style={styles.exAmount}>{safeFormat(expense.amount)}</Text>
                      <TouchableOpacity onPress={() => deleteExpense && deleteExpense(expense.id)} style={styles.exDelete}>
                        <Text style={styles.exDeleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <View style={styles.balanceList}>
            {Object.entries(balances).map(([uid, bal]) => {
              // Show all balances, even if 0
              const isOwed = bal > 0;
              return (
                <View key={uid} style={styles.balCard}>
                  <View style={styles.balUser}>
                    <Text style={styles.balAvatar}>{getTravelerAvatar(uid)}</Text>
                    <Text style={styles.balName}>{getTravelerName(uid)}</Text>
                  </View>
                  <Text style={[styles.balAmount, { color: isOwed ? '#10B981' : '#EF4444' }]}>
                    {isOwed ? `gets back ${safeFormat(bal)}` : `owes ${safeFormat(Math.abs(bal))}`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ADD EXPENSE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View style={styles.amtContainer}>
                <Text style={styles.amtSymbol}>{currency.symbol}</Text>
                <TextInput
                  style={styles.amtInput}
                  placeholder="0"
                  value={newExpense.amount}
                  onChangeText={t => setNewExpense({ ...newExpense, amount: t })}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              {/* Title */}
              <Text style={styles.inputLabel}>For what?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Dinner, Taxi"
                value={newExpense.title}
                onChangeText={t => setNewExpense({ ...newExpense, title: t })}
                placeholderTextColor={colors.textMuted}
              />

              {/* Category */}
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.key} onPress={() => setNewExpense({ ...newExpense, category: cat.key })}
                    style={[styles.catChip, newExpense.category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catLabel, newExpense.category === cat.key && { color: 'white' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Split Section */}
              {isMultiUser && (
                <View style={styles.splitSection}>
                  {/* Paid By Section Removed as per User Request (Defaulting to main_user internally) */}

                  <View style={styles.splitHeader}>
                    <Text style={styles.inputLabel}>Split</Text>
                    <View style={styles.splitToggle}>
                      <TouchableOpacity onPress={() => setNewExpense({ ...newExpense, splitType: 'equal' })}
                        style={[styles.splitOpt, newExpense.splitType === 'equal' && styles.splitOptActive]}>
                        <Text style={[styles.splitText, newExpense.splitType === 'equal' && styles.splitTextActive]}>Equally</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setNewExpense({ ...newExpense, splitType: 'custom' })}
                        style={[styles.splitOpt, newExpense.splitType === 'custom' && styles.splitOptActive]}>
                        <Text style={[styles.splitText, newExpense.splitType === 'custom' && styles.splitTextActive]}>Custom</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {newExpense.splitType === 'equal' ? (
                    <View style={styles.checkList}>
                      {travelers.map(t => {
                        const isIncluded = newExpense.beneficiaries.includes(t.id);
                        return (
                          <TouchableOpacity key={t.id} style={styles.checkRow} onPress={() => {
                            const current = newExpense.beneficiaries;
                            if (current.includes(t.id)) {
                              setNewExpense({ ...newExpense, beneficiaries: current.filter(id => id !== t.id) });
                            } else {
                              setNewExpense({ ...newExpense, beneficiaries: [...current, t.id] });
                            }
                          }}>
                            <Text style={styles.checkName}>{t.avatar} {t.name}</Text>
                            <View style={[styles.checkBox, isIncluded && styles.checkBoxActive]}>
                              {isIncluded && <Text style={styles.checkIcon}>✓</Text>}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.customSplitList}>
                      {/* Validation Message */}
                      <View style={[styles.valMsg, splitStatus.isValid ? styles.valSuccess : styles.valError]}>
                        <Text style={styles.valText}>{splitStatus.message || 'Adjust amounts below'}</Text>
                      </View>

                      {travelers.map(t => (
                        <View key={t.id} style={styles.customRow}>
                          <Text style={styles.customName}>{t.avatar} {t.name}</Text>
                          <View style={styles.customInputWrap}>
                            <Text style={styles.customSymbol}>{currency.symbol}</Text>
                            <TextInput
                              style={styles.customInput}
                              placeholder="0"
                              keyboardType="decimal-pad"
                              value={newExpense.splitAmounts[t.id] || ''}
                              onChangeText={v => setNewExpense({
                                ...newExpense,
                                splitAmounts: { ...newExpense.splitAmounts, [t.id]: v }
                              })}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, (!newExpense.title || !newExpense.amount || (!splitStatus.isValid && isMultiUser)) && { opacity: 0.5 }]}
                disabled={!newExpense.title || !newExpense.amount || (!splitStatus.isValid && isMultiUser)}
                onPress={handleAddExpense}
              >
                <Text style={styles.saveBtnText}>Save Expense</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textMuted },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: 'white', fontWeight: '700' },

  summaryCard: { backgroundColor: colors.card, margin: 20, marginTop: 0, padding: 20, borderRadius: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4 },
  summaryBar: { height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' },
  summaryFill: { height: '100%', borderRadius: 4 },

  scrollContent: { padding: 20 },

  // Tabs
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, backgroundColor: colors.card, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.bg },
  tabText: { fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.text },

  // Expenses
  expenseCard: { flexDirection: 'row', backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  exIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exEmoji: { fontSize: 20 },
  exContent: { flex: 1 },
  exTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  exSub: { fontSize: 12, color: colors.textMuted },
  exRight: { alignItems: 'flex-end' },
  exAmount: { fontSize: 16, fontWeight: '700', color: colors.text },
  exDelete: { marginTop: 4, padding: 4 },
  exDeleteText: { color: colors.textMuted, fontSize: 12 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: colors.textMuted },

  // Balances
  balCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  balUser: { flexDirection: 'row', alignItems: 'center' },
  balAvatar: { fontSize: 20, marginRight: 8 },
  balName: { fontWeight: '600', color: colors.text },
  balAmount: { fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  closeBtn: { padding: 8, backgroundColor: colors.bg, borderRadius: 20 },
  closeText: { fontSize: 16, color: colors.text },

  amtContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  amtSymbol: { fontSize: 32, fontWeight: '700', color: colors.primary, marginRight: 8 },
  amtInput: { fontSize: 48, fontWeight: '800', color: colors.text, minWidth: 100, textAlign: 'center', padding: 0 },

  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: colors.bg, padding: 16, borderRadius: 16, fontSize: 16, color: colors.text, fontWeight: '600' },

  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.primaryBorder },
  catEmoji: { marginRight: 6 },
  catLabel: { fontWeight: '600', color: colors.text },

  splitSection: { marginTop: 24, padding: 16, backgroundColor: colors.bg, borderRadius: 20 },
  userChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.card, marginRight: 8 },
  userChipSelected: { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary },

  splitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  splitToggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 10, padding: 2 },
  splitOpt: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  splitOptActive: { backgroundColor: colors.primary },
  splitText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  splitTextActive: { color: 'white' },

  checkList: { gap: 8 },
  checkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  checkName: { fontWeight: '600', color: colors.text },
  checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkBoxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkIcon: { color: 'white', fontSize: 14, fontWeight: '800' },

  customSplitList: { gap: 12 },
  customRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customName: { fontWeight: '600', color: colors.text },
  customInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, flex: 1, marginLeft: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  customSymbol: { color: colors.text, marginRight: 8, fontSize: 16, fontWeight: '700' },
  customInput: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'right', padding: 0 },

  valMsg: { padding: 8, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  valSuccess: { backgroundColor: '#10B98120' },
  valError: { backgroundColor: '#EF444420' },
  valText: { fontWeight: '700', fontSize: 12, color: colors.text },

  saveBtn: { backgroundColor: colors.primary, padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
