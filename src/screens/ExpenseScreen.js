import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#000000',
  card: '#0A0A0A',
  cardLight: '#111111',
  green: '#00FF7F',
  greenMuted: 'rgba(0, 255, 127, 0.1)',
  greenBorder: 'rgba(0, 255, 127, 0.3)',
  text: '#FFFFFF',
  textMuted: '#666666',
  textLight: '#999999',
  red: '#FF4444',
};

const CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { key: 'transport', label: 'Transport', icon: '✈️' },
  { key: 'food', label: 'Food', icon: '🍽️' },
  { key: 'activities', label: 'Activities', icon: '🎭' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️' },
  { key: 'other', label: 'Other', icon: '📦' },
];

export default function ExpenseScreen() {
  const { expenses, addExpense, deleteExpense, getTotalExpenses, budget, getRemainingBudget } = useTravelContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '', amount: '', category: 'food',
    date: new Date().toLocaleDateString(), notes: ''
  });

  const handleAddExpense = () => {
    if (newExpense.title && newExpense.amount) {
      addExpense({ ...newExpense, amount: parseFloat(newExpense.amount) });
      setNewExpense({ title: '', amount: '', category: 'food', date: new Date().toLocaleDateString(), notes: '' });
      setModalVisible(false);
    }
  };

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];
  const remainingBudget = getRemainingBudget();
  const spentPercentage = budget.total > 0 ? (getTotalExpenses() / budget.total) * 100 : 0;

  const ExpenseItem = ({ item }) => {
    const category = getCategoryInfo(item.category);
    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseIcon}>
          <Text style={styles.expenseEmoji}>{category.icon}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <Text style={styles.expenseMeta}>{category.label} • {item.date}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>-${item.amount}</Text>
          <TouchableOpacity onPress={() => deleteExpense(item.id)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addButtonSmall} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonSmallText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
          <Text style={styles.summaryAmount}>${getTotalExpenses()}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(spentPercentage, 100)}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{spentPercentage.toFixed(0)}% used</Text>
            <Text style={[styles.progressLabel, { color: COLORS.green }]}>${remainingBudget} left</Text>
          </View>
        </View>
      </View>

      {/* Expense List */}
      <FlatList
        data={expenses.sort((a, b) => new Date(b.date) - new Date(a.date))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseItem item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          expenses.length > 0 ? (
            <Text style={styles.listHeader}>Recent Transactions</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>💸</Text>
            </View>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>Start tracking your spending</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyButtonText}>Add First Expense</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Expense Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountCurrency}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={newExpense.amount}
                onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="What did you spend on?"
              placeholderTextColor={COLORS.textMuted}
              value={newExpense.title}
              onChangeText={(text) => setNewExpense({...newExpense, title: text})}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, newExpense.category === cat.key && styles.categoryChipActive]}
                  onPress={() => setNewExpense({...newExpense, category: cat.key})}
                >
                  <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryChipText, newExpense.category === cat.key && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddExpense}>
              <Text style={styles.submitButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 10,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: 'bold' },
  addButtonSmall: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonSmallText: { color: COLORS.bg, fontWeight: 'bold', fontSize: 14 },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  summaryMain: { marginBottom: 20 },
  summaryLabel: { color: COLORS.green, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  summaryAmount: { color: COLORS.text, fontSize: 42, fontWeight: 'bold', marginTop: 4 },
  progressContainer: {},
  progressTrack: { height: 8, backgroundColor: COLORS.cardLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  progressLabel: { color: COLORS.textMuted, fontSize: 13 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  listHeader: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 16 },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.greenMuted,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseEmoji: { fontSize: 22 },
  expenseInfo: { flex: 1, marginLeft: 14 },
  expenseTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  expenseMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { color: COLORS.red, fontSize: 18, fontWeight: 'bold' },
  deleteButton: { marginTop: 6, padding: 4 },
  deleteText: { color: COLORS.textMuted, fontSize: 20 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.greenMuted,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: { color: COLORS.bg, fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: COLORS.textMuted, fontSize: 28 },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  amountCurrency: { color: COLORS.green, fontSize: 48, fontWeight: 'bold' },
  amountInput: { flex: 1, color: COLORS.text, fontSize: 48, fontWeight: 'bold', marginLeft: 8 },
  input: {
    backgroundColor: COLORS.cardLight,
    color: COLORS.text,
    padding: 18,
    borderRadius: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    marginBottom: 20,
  },
  inputLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
  categoryScroll: { marginBottom: 24 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  categoryChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  categoryChipIcon: { fontSize: 16, marginRight: 8 },
  categoryChipText: { color: COLORS.text, fontSize: 14 },
  categoryChipTextActive: { color: COLORS.bg, fontWeight: '600' },
  submitButton: { backgroundColor: COLORS.green, padding: 18, borderRadius: 14, alignItems: 'center' },
  submitButtonText: { color: COLORS.bg, fontSize: 17, fontWeight: 'bold' },
});
