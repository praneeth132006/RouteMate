import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';

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
};

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
  const [totalBudget, setTotalBudget] = useState(budget.total.toString());
  const expensesByCategory = getExpensesByCategory();

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Plan your expenses</Text>
        </View>

        {/* Total Budget Input */}
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
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={styles.totalStats}>
            <View style={styles.totalStatItem}>
              <Text style={styles.totalStatValue}>${allocatedTotal}</Text>
              <Text style={styles.totalStatLabel}>Allocated</Text>
            </View>
            <View style={styles.totalStatDivider} />
            <View style={styles.totalStatItem}>
              <Text style={[styles.totalStatValue, { color: COLORS.green }]}>
                ${budget.total - allocatedTotal}
              </Text>
              <Text style={styles.totalStatLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          
          {CATEGORIES.map((category) => {
            const spent = expensesByCategory[category.key] || 0;
            const allocated = budget.categories[category.key] || 0;
            const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
            
            return (
              <View key={category.key} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Text style={styles.categoryEmoji}>{category.icon}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.label}</Text>
                    <Text style={styles.categorySpent}>
                      ${spent} spent of ${allocated}
                    </Text>
                  </View>
                  <View style={styles.categoryInputWrapper}>
                    <Text style={styles.categoryDollar}>$</Text>
                    <TextInput
                      style={styles.categoryInput}
                      keyboardType="numeric"
                      value={allocated.toString()}
                      onChangeText={(text) => updateCategoryBudget(category.key, text)}
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                </View>
                <View style={styles.categoryProgress}>
                  <View style={[styles.categoryProgressFill, { width: `${percentage}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginTop: 4,
  },
  totalCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  totalLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  totalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  currency: {
    color: COLORS.green,
    fontSize: 40,
    fontWeight: 'bold',
    marginRight: 4,
  },
  totalInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 48,
    fontWeight: 'bold',
  },
  totalStats: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.greenBorder,
  },
  totalStatItem: {
    flex: 1,
  },
  totalStatValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalStatLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  totalStatDivider: {
    width: 1,
    backgroundColor: COLORS.greenBorder,
    marginHorizontal: 20,
  },
  categoriesSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.greenMuted,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  categoryName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  categorySpent: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  categoryInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  categoryDollar: {
    color: COLORS.green,
    fontSize: 14,
  },
  categoryInput: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    padding: 10,
    width: 60,
    textAlign: 'right',
  },
  categoryProgress: {
    height: 4,
    backgroundColor: COLORS.cardLight,
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 2,
  },
});
