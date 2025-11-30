import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'accommodation', label: 'Stay', emoji: '🏨', color: '#8B5CF6' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3B82F6' },
  { key: 'food', label: 'Food', emoji: '🍽️', color: '#F59E0B' },
  { key: 'activities', label: 'Activities', emoji: '🎭', color: '#10B981' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#EC4899' },
  { key: 'other', label: 'Other', emoji: '📦', color: '#6B7280' },
];

export default function BudgetScreen() {
  const { 
    budget = { total: 0, categories: {} }, 
    setBudget, 
    getExpensesByCategory,
    formatCurrency,
    currency = { symbol: '₹', code: 'INR' }
  } = useTravelContext();
  const { colors } = useTheme();
  
  const [totalBudget, setTotalBudget] = useState((budget.total || 0).toString());
  const [editingCategory, setEditingCategory] = useState(null);
  
  const expensesByCategory = getExpensesByCategory ? getExpensesByCategory() : {};
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSaveBudget = () => {
    const newTotal = parseFloat(totalBudget) || 0;
    setBudget({ ...budget, total: newTotal });
  };

  const updateCategoryBudget = (category, value) => {
    const newValue = parseFloat(value) || 0;
    setBudget({
      ...budget,
      categories: { ...budget.categories, [category]: newValue }
    });
  };

  const safeFormat = (amount) => {
    if (formatCurrency) return formatCurrency(amount);
    const num = parseFloat(amount) || 0;
    return `${currency.symbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const allocatedTotal = Object.values(budget.categories || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const unallocated = (budget.total || 0) - allocatedTotal;
  const totalSpent = Object.values(expensesByCategory).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const remainingBudget = (budget.total || 0) - totalSpent;
  const spentPercentage = budget.total > 0 ? (totalSpent / budget.total) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Budget</Text>
        <Text style={styles.headerSubtitle}>Plan your travel spending</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Budget Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardHeader}>
            <View style={styles.totalIconBg}>
              <Text style={styles.totalIcon}>💵</Text>
            </View>
            <Text style={styles.totalLabel}>Total Trip Budget</Text>
          </View>
          
          <View style={styles.totalInputContainer}>
            <Text style={styles.currencySymbol}>{currency.symbol}</Text>
            <TextInput
              style={styles.totalInput}
              keyboardType="decimal-pad"
              value={totalBudget}
              onChangeText={setTotalBudget}
              onBlur={handleSaveBudget}
              placeholderTextColor="rgba(255,255,255,0.5)"
              placeholder="0"
            />
          </View>

          {/* Progress Bar */}
          <View style={styles.totalProgress}>
            <View style={styles.totalProgressBar}>
              <View style={[styles.totalProgressFill, { 
                width: `${Math.min(spentPercentage, 100)}%`,
                backgroundColor: spentPercentage > 90 ? '#EF4444' : spentPercentage > 70 ? '#FCD34D' : '#34D399'
              }]} />
            </View>
            <Text style={styles.totalProgressText}>{spentPercentage.toFixed(0)}% spent</Text>
          </View>
          
          {/* Budget Summary */}
          <View style={styles.budgetSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>📊</Text>
              <Text style={styles.summaryValue}>{safeFormat(allocatedTotal)}</Text>
              <Text style={styles.summaryLabel}>Allocated</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>💸</Text>
              <Text style={styles.summaryValue}>{safeFormat(totalSpent)}</Text>
              <Text style={styles.summaryLabel}>Spent</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>💵</Text>
              <Text style={[styles.summaryValue, { color: remainingBudget >= 0 ? '#34D399' : '#EF4444' }]}>
                {safeFormat(remainingBudget)}
              </Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatEmoji}>📅</Text>
            <Text style={styles.quickStatValue}>{safeFormat(unallocated)}</Text>
            <Text style={styles.quickStatLabel}>Unallocated</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatEmoji}>🎯</Text>
            <Text style={styles.quickStatValue}>{CATEGORIES.length}</Text>
            <Text style={styles.quickStatLabel}>Categories</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Budget by Category</Text>
          
          {CATEGORIES.map((category) => {
            const allocated = parseFloat(budget.categories?.[category.key]) || 0;
            const spent = parseFloat(expensesByCategory[category.key]) || 0;
            const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
            const remaining = allocated - spent;
            
            return (
              <View key={category.key} style={[styles.categoryCard, { borderLeftColor: category.color }]}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryIconBg, { backgroundColor: category.color + '20' }]}>
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    </View>
                    <View style={styles.categoryText}>
                      <Text style={styles.categoryLabel}>{category.label}</Text>
                      <Text style={styles.categorySpent}>
                        {safeFormat(spent)} of {safeFormat(allocated)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.categoryInputWrapper}>
                    <Text style={styles.categoryDollar}>{currency.symbol}</Text>
                    <TextInput
                      style={styles.categoryInput}
                      keyboardType="decimal-pad"
                      value={allocated.toString()}
                      onChangeText={(text) => updateCategoryBudget(category.key, text)}
                      onFocus={() => setEditingCategory(category.key)}
                      onBlur={() => setEditingCategory(null)}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
                
                <View style={styles.categoryProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${percentage}%`, 
                          backgroundColor: percentage > 90 ? '#EF4444' : percentage > 70 ? '#F59E0B' : category.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressPercent, { color: percentage > 90 ? '#EF4444' : colors.textMuted }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                </View>

                {allocated > 0 && (
                  <View style={styles.categoryFooter}>
                    <Text style={[styles.categoryRemaining, { color: remaining >= 0 ? '#10B981' : '#EF4444' }]}>
                      {remaining >= 0 ? `${safeFormat(remaining)} left` : `${safeFormat(Math.abs(remaining))} over`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Budget Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipItem}>Allocate 30-40% for accommodation</Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipItem}>Keep 10-15% as emergency fund</Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipItem}>Track expenses daily to stay on budget</Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipItem}>Book transport & stays early for savings</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 20 },
  
  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },

  // Total Card
  totalCard: { 
    marginHorizontal: 20, 
    backgroundColor: colors.primary, 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16 
  },
  totalCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  totalIconBg: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  totalIcon: { fontSize: 22 },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginLeft: 12 },
  
  totalInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  currencySymbol: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginRight: 4 },
  totalInput: { flex: 1, color: '#FFF', fontSize: 44, fontWeight: 'bold', padding: 0 },

  totalProgress: { marginBottom: 16 },
  totalProgressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  totalProgressFill: { height: '100%', borderRadius: 4 },
  totalProgressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 6, textAlign: 'right' },
  
  budgetSummary: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 16, 
    padding: 14 
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryEmoji: { fontSize: 18, marginBottom: 4 },
  summaryValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Quick Stats
  quickStats: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  quickStatCard: { 
    flex: 1, 
    backgroundColor: colors.card, 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  quickStatEmoji: { fontSize: 24, marginBottom: 8 },
  quickStatValue: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  quickStatLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: 'bold', marginBottom: 14 },
  
  // Category Card
  categoryCard: { 
    backgroundColor: colors.card, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.primaryBorder, 
    borderLeftWidth: 4 
  },
  categoryHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryEmoji: { fontSize: 20 },
  categoryText: { marginLeft: 12, flex: 1 },
  categoryLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  categorySpent: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  
  categoryInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.cardLight, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  categoryDollar: { color: colors.textMuted, fontSize: 16, marginRight: 2 },
  categoryInput: { color: colors.text, fontSize: 16, fontWeight: '600', width: 70, textAlign: 'right', padding: 0 },
  
  categoryProgress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: colors.cardLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPercent: { fontSize: 12, width: 40, textAlign: 'right', fontWeight: '600' },

  categoryFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  categoryRemaining: { fontSize: 12, fontWeight: '600' },

  // Tips
  tipsCard: { 
    marginHorizontal: 20, 
    backgroundColor: colors.card, 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: colors.primaryBorder 
  },
  tipsTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  tipsList: { gap: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tipBullet: { color: colors.primary, fontSize: 16, marginRight: 8, marginTop: -2 },
  tipItem: { color: colors.textMuted, fontSize: 14, lineHeight: 20, flex: 1 },
});
