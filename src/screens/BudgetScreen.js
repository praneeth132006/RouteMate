import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { key: 'transport', label: 'Transport', icon: '✈️' },
  { key: 'food', label: 'Food & Drinks', icon: '🍽️' },
  { key: 'activities', label: 'Activities', icon: '🎭' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️' },
  { key: 'other', label: 'Other', icon: '📦' },
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Plan your expenses</Text>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL BUDGET</Text>
          <View style={styles.totalInputContainer}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.totalInput}
              keyboardType="numeric"
              value={totalBudget}
              onChangeText={setTotalBudget}
              onBlur={handleSaveBudget}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.totalStats}>
            <View style={styles.totalStatItem}>
              <Text style={styles.totalStatValue}>${allocatedTotal}</Text>
              <Text style={styles.totalStatLabel}>Allocated</Text>
            </View>
            <View style={styles.totalStatDivider} />
            <View style={styles.totalStatItem}>
              <Text style={[styles.totalStatValue, { color: colors.primary }]}>${budget.total - allocatedTotal}</Text>
              <Text style={styles.totalStatLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {CATEGORIES.map((category) => {
            const spent = expensesByCategory[category.key] || 0;
            const allocated = budget.categories[category.key] || 0;
            const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
            return (
              <View key={category.key} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}><Text style={styles.categoryEmoji}>{category.icon}</Text></View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.label}</Text>
                    <Text style={styles.categorySpent}>${spent} spent of ${allocated}</Text>
                  </View>
                  <View style={styles.categoryInputWrapper}>
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
                <View style={styles.categoryProgress}><View style={[styles.categoryProgressFill, { width: `${percentage}%` }]} /></View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 20 },
  title: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, fontSize: 16, marginTop: 4 },
  totalCard: { marginHorizontal: 20, marginTop: 24, backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.primaryBorder },
  totalLabel: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  totalInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  currency: { color: colors.primary, fontSize: 40, fontWeight: 'bold', marginRight: 4 },
  totalInput: { flex: 1, color: colors.text, fontSize: 48, fontWeight: 'bold' },
  totalStats: { flexDirection: 'row', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  totalStatItem: { flex: 1 },
  totalStatValue: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  totalStatLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  totalStatDivider: { width: 1, backgroundColor: colors.primaryBorder, marginHorizontal: 20 },
  categoriesSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  categoryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 44, height: 44, backgroundColor: colors.primaryMuted, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryEmoji: { fontSize: 20 },
  categoryInfo: { flex: 1, marginLeft: 14 },
  categoryName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  categorySpent: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  categoryInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryDollar: { color: colors.primary, fontSize: 14 },
  categoryInput: { color: colors.text, fontSize: 16, fontWeight: '600', padding: 10, width: 60, textAlign: 'right' },
  categoryProgress: { height: 4, backgroundColor: colors.cardLight, borderRadius: 2, marginTop: 14, overflow: 'hidden' },
  categoryProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
});
