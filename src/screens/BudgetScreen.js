import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
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

export default function BudgetScreen() {
  const { budget, setBudget, getExpensesByCategory } = useTravelContext();
  const { colors } = useTheme();
  const [totalBudget, setTotalBudget] = useState(budget.total.toString());
  const expensesByCategory = getExpensesByCategory();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSaveBudget = () => {
    setBudget({ ...budget, total: parseFloat(totalBudget) || 0 });
  };

  const updateCategoryBudget = (category, value) => {
    setBudget({
      ...budget,
      categories: { ...budget.categories, [category]: parseFloat(value) || 0 }
    });
  };

  const allocatedTotal = Object.values(budget.categories).reduce((sum, val) => sum + val, 0);
  const unallocated = budget.total - allocatedTotal;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget Planner 💰</Text>
          <Text style={styles.subtitle}>Plan your travel budget wisely</Text>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Trip Budget</Text>
          <View style={styles.totalInputRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.totalInput}
              keyboardType="numeric"
              value={totalBudget}
              onChangeText={setTotalBudget}
              onBlur={handleSaveBudget}
              placeholderTextColor={colors.textMuted}
              placeholder="0"
            />
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: colors.primary + '50' }]}>
            <Text style={styles.summaryLabel}>Allocated</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>${allocatedTotal}</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: colors.secondary + '50' }]}>
            <Text style={styles.summaryLabel}>Unallocated</Text>
            <Text style={[styles.summaryValue, { color: unallocated >= 0 ? colors.secondary : '#EF4444' }]}>
              ${unallocated}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Budget by Category</Text>
        {CATEGORIES.map((category) => {
          const spent = expensesByCategory[category.key] || 0;
          const allocated = budget.categories[category.key] || 0;
          const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
          
          return (
            <View key={category.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <View>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categorySpent}>Spent: ${spent} / ${allocated}</Text>
                  </View>
                </View>
                <View style={styles.categoryInputWrap}>
                  <Text style={styles.categoryDollar}>$</Text>
                  <TextInput
                    style={styles.categoryInput}
                    keyboardType="numeric"
                    value={allocated.toString()}
                    onChangeText={(text) => updateCategoryBudget(category.key, text)}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: percentage > 90 ? '#EF4444' : colors.primary }]} />
              </View>
            </View>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { marginTop: 16, marginBottom: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, marginTop: 4 },
  totalCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.primary + '50' },
  totalLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { color: colors.text, fontSize: 24, marginRight: 8 },
  totalInput: { flex: 1, backgroundColor: colors.cardLight, color: colors.text, fontSize: 28, fontWeight: 'bold', padding: 16, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: colors.card + '50', borderRadius: 16, padding: 16, marginHorizontal: 4, borderWidth: 1 },
  summaryLabel: { color: colors.textMuted, fontSize: 12 },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  categoryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryEmoji: { fontSize: 24, marginRight: 12 },
  categoryLabel: { color: colors.text, fontWeight: '500' },
  categorySpent: { color: colors.textMuted, fontSize: 12 },
  categoryInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 12, paddingHorizontal: 12 },
  categoryDollar: { color: colors.textMuted },
  categoryInput: { color: colors.text, fontSize: 16, padding: 8, width: 70, textAlign: 'right' },
  progressBar: { height: 8, backgroundColor: colors.cardLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
});
