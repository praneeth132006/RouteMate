import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation', emoji: '🏨' },
  { key: 'transport', label: 'Transport', emoji: '🚗' },
  { key: 'food', label: 'Food & Drinks', emoji: '🍽️' },
  { key: 'activities', label: 'Activities', emoji: '🎭' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { key: 'other', label: 'Other', emoji: '📦' },
];

export default function ExpenseScreen() {
  const { expenses, addExpense, deleteExpense, getTotalExpenses, budget, getRemainingBudget } = useTravelContext();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '', amount: '', category: 'food',
    date: new Date().toLocaleDateString(), notes: ''
  });

  const styles = useMemo(() => createStyles(colors), [colors]);

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
        <View style={styles.expenseRow}>
          <View style={styles.expenseIcon}><Text style={styles.expenseEmoji}>{category.emoji}</Text></View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle}>{item.title}</Text>
            <Text style={styles.expenseMeta}>{category.label} • {item.date}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>-${item.amount}</Text>
            <TouchableOpacity onPress={() => deleteExpense(item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses 💳</Text>
        <Text style={styles.subtitle}>Track every penny you spend</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View><Text style={styles.summaryLabel}>Total Spent</Text><Text style={styles.summarySpent}>${getTotalExpenses()}</Text></View>
          <View style={styles.summaryRight}><Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryRemaining, { color: remainingBudget >= 0 ? colors.primary : '#EF4444' }]}>${remainingBudget}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(spentPercentage, 100)}%`, backgroundColor: spentPercentage > 90 ? '#EF4444' : colors.primary }]} />
        </View>
        <Text style={styles.progressText}>{spentPercentage.toFixed(0)}% of budget used</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add New Expense</Text>
      </TouchableOpacity>

      <FlatList
        data={expenses.sort((a, b) => new Date(b.date) - new Date(a.date))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseItem item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyEmoji}>🧾</Text><Text style={styles.emptyText}>No expenses yet.{'\n'}Start tracking your spending!</Text></View>}
      />

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="What did you spend on?" placeholderTextColor={colors.textMuted} value={newExpense.title} onChangeText={(text) => setNewExpense({...newExpense, title: text})} />
            <View style={styles.amountInput}>
              <Text style={styles.amountDollar}>$</Text>
              <TextInput style={styles.amountField} placeholder="0.00" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={newExpense.amount} onChangeText={(text) => setNewExpense({...newExpense, amount: text})} />
            </View>
            <Text style={styles.categoryLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat.key} style={[styles.categoryChip, newExpense.category === cat.key && styles.categoryChipActive]} onPress={() => setNewExpense({...newExpense, category: cat.key})}>
                  <Text>{cat.emoji}</Text><Text style={[styles.categoryChipText, newExpense.category === cat.key && styles.categoryChipTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.submitButton} onPress={handleAddExpense}><Text style={styles.submitButtonText}>Add Expense</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, marginTop: 16, marginBottom: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, marginTop: 4 },
  summaryCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { color: colors.textMuted, fontSize: 12 },
  summarySpent: { color: colors.secondary, fontSize: 28, fontWeight: 'bold' },
  summaryRight: { alignItems: 'flex-end' },
  summaryRemaining: { fontSize: 22, fontWeight: 'bold' },
  progressBar: { height: 12, backgroundColor: colors.cardLight, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  progressText: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  addButton: { marginHorizontal: 16, backgroundColor: colors.primary, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  expenseCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  expenseRow: { flexDirection: 'row', alignItems: 'center' },
  expenseIcon: { backgroundColor: colors.cardLight, borderRadius: 12, padding: 12, marginRight: 12 },
  expenseEmoji: { fontSize: 24 },
  expenseInfo: { flex: 1 },
  expenseTitle: { color: colors.text, fontWeight: '500', fontSize: 16 },
  expenseMeta: { color: colors.textMuted, fontSize: 12 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { color: colors.secondary, fontSize: 16, fontWeight: 'bold' },
  deleteText: { color: '#F87171', fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  modalClose: { color: colors.textMuted, fontSize: 24 },
  input: { backgroundColor: colors.cardLight, color: colors.text, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  amountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  amountDollar: { color: colors.text, fontSize: 20, paddingLeft: 16 },
  amountField: { flex: 1, color: colors.text, padding: 16, fontSize: 20 },
  categoryLabel: { color: colors.textMuted, marginBottom: 8 },
  categoryScroll: { marginBottom: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { color: colors.text, marginLeft: 8 },
  categoryChipTextActive: { color: colors.bg, fontWeight: '500' },
  submitButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitButtonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
});
