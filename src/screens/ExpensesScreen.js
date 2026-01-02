import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTravelContext } from '../context/TravelContext';

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { expenses, addExpense, deleteExpense, getTotalExpenses, formatCurrency, customCategories } = useTravelContext();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');

  const handleAddExpense = () => {
    if (title.trim() && amount) {
      addExpense({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
      setTitle('');
      setAmount('');
      setCategory('food');
      setShowAddModal(false);
    }
  };

  const getCategoryInfo = (key) => {
    const cat = customCategories.find(c => c.key === key);
    return cat || { emoji: '📦', color: '#6B7280', label: 'Other' };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Expenses 💳</Text>
          <Text style={styles.subtitle}>Track your spending</Text>
        </View>

        {/* Total Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalAmount}>{formatCurrency(getTotalExpenses())}</Text>
        </View>

        {/* Expenses List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>

          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>Tap + to add your first expense</Text>
            </View>
          ) : (
            expenses.map((expense) => {
              const catInfo = getCategoryInfo(expense.category);
              return (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={[styles.expenseIcon, { backgroundColor: catInfo.color + '20' }]}>
                    <Text style={styles.expenseEmoji}>{catInfo.emoji}</Text>
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseName}>{expense.title}</Text>
                    <Text style={styles.expenseDate}>{typeof expense.date === 'string' ? expense.date : expense.date?.toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
                  <TouchableOpacity onPress={() => deleteExpense(expense.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Expense</Text>

            <TextInput
              style={styles.input}
              placeholder="Expense title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.categoryLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {customCategories.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[styles.categoryChip, category === cat.key && { backgroundColor: cat.color + '30', borderColor: cat.color }]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryText, category === cat.key && { color: cat.color }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable style={styles.saveButton} onPress={handleAddExpense}>
              <Text style={styles.saveButtonText}>Add Expense</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  header: { paddingTop: 20, marginBottom: 24 },
  title: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  totalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.primaryBorder },
  totalLabel: { color: colors.textMuted, fontSize: 14 },
  totalAmount: { color: colors.text, fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  expenseIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  expenseEmoji: { fontSize: 20 },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseName: { color: colors.text, fontSize: 15, fontWeight: '500' },
  expenseDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  expenseAmount: { color: '#EF4444', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },
  addButton: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  addButtonText: { color: colors.bg, fontSize: 32, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: colors.cardLight, borderRadius: 12, padding: 16, fontSize: 16, color: colors.text, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  categoryScroll: { marginBottom: 20 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.cardLight, marginRight: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryEmoji: { fontSize: 16, marginRight: 6 },
  categoryText: { color: colors.text, fontSize: 13 },
  saveButton: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveButtonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  cancelButton: { padding: 16, alignItems: 'center' },
  cancelButtonText: { color: colors.textMuted, fontSize: 15 },
});
