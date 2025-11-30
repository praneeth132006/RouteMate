import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const DEFAULT_CATEGORIES = [
  { key: 'accommodation', label: 'Stay', emoji: '🏨', color: '#8B5CF6', tip: '30-40%' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3B82F6', tip: '15-25%' },
  { key: 'food', label: 'Food', emoji: '🍽️', color: '#F59E0B', tip: '20-30%' },
  { key: 'activities', label: 'Activities', emoji: '🎭', color: '#10B981', tip: '10-15%' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#EC4899', tip: '5-10%' },
  { key: 'other', label: 'Other', emoji: '📦', color: '#6B7280', tip: '5-10%' },
];

const EMOJI_OPTIONS = ['🏨', '🚗', '🍽️', '🎭', '🛍️', '📦', '✈️', '🚆', '🏖️', '⛷️', '🎫', '💊', '📱', '🎁', '🍺', '☕', '🎮', '📸', '💇', '🏥'];
const COLOR_OPTIONS = ['#8B5CF6', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#6B7280', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

export default function BudgetScreen() {
  const { 
    budget = { total: 0, categories: {} }, 
    setBudget, 
    getExpensesByCategory,
    formatCurrency,
    currency = { symbol: '₹', code: 'INR' },
    tripInfo = {},
    customCategories,
    setCustomCategories
  } = useTravelContext();
  const { colors } = useTheme();
  
  const [totalBudget, setTotalBudget] = useState((budget.total || 0).toString());
  const [categoryInputs, setCategoryInputs] = useState({});
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ key: '', label: '', emoji: '📦', color: '#6B7280', tip: '5-10%' });
  
  // Use custom categories if available, otherwise default
  const CATEGORIES = customCategories?.length > 0 ? customCategories : DEFAULT_CATEGORIES;
  
  // Sync totalBudget with budget.total when it changes externally
  useEffect(() => {
    setTotalBudget((budget.total || 0).toString());
  }, [budget.total]);

  // Initialize category inputs from budget
  useEffect(() => {
    const inputs = {};
    CATEGORIES.forEach(cat => {
      inputs[cat.key] = (budget.categories?.[cat.key] || 0).toString();
    });
    setCategoryInputs(inputs);
  }, [budget.categories, CATEGORIES]);
  
  const expensesByCategory = getExpensesByCategory ? getExpensesByCategory() : {};
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSaveBudget = () => {
    const newTotal = parseFloat(totalBudget) || 0;
    setBudget({ ...budget, total: newTotal });
  };

  const handleCategoryChange = (category, value) => {
    setCategoryInputs(prev => ({ ...prev, [category]: value }));
  };

  const handleCategoryBlur = (category) => {
    const newValue = parseFloat(categoryInputs[category]) || 0;
    setBudget({
      ...budget,
      categories: { ...budget.categories, [category]: newValue }
    });
    setFocusedCategory(null);
  };

  const handleCategoryFocus = (category) => {
    setFocusedCategory(category);
    if (categoryInputs[category] === '0') {
      setCategoryInputs(prev => ({ ...prev, [category]: '' }));
    }
  };

  const safeFormat = (amount) => {
    if (formatCurrency) return formatCurrency(amount);
    const num = parseFloat(amount) || 0;
    return `${currency.symbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Category management functions
  const handleAddCategory = () => {
    if (!newCategory.label.trim()) return;
    
    const key = newCategory.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const categoryToAdd = { ...newCategory, key };
    
    const updatedCategories = [...CATEGORIES, categoryToAdd];
    if (setCustomCategories) {
      setCustomCategories(updatedCategories);
    }
    
    setNewCategory({ key: '', label: '', emoji: '📦', color: '#6B7280', tip: '5-10%' });
    setShowCategoryModal(false);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({ ...category });
    setShowCategoryModal(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.label.trim()) return;
    
    const updatedCategories = CATEGORIES.map(cat => 
      cat.key === editingCategory.key ? { ...newCategory, key: editingCategory.key } : cat
    );
    
    if (setCustomCategories) {
      setCustomCategories(updatedCategories);
    }
    
    setEditingCategory(null);
    setNewCategory({ key: '', label: '', emoji: '📦', color: '#6B7280', tip: '5-10%' });
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (categoryKey) => {
    const updatedCategories = CATEGORIES.filter(cat => cat.key !== categoryKey);
    if (setCustomCategories) {
      setCustomCategories(updatedCategories);
    }
    
    // Also remove from budget categories
    const newBudgetCategories = { ...budget.categories };
    delete newBudgetCategories[categoryKey];
    setBudget({ ...budget, categories: newBudgetCategories });
  };

  const resetToDefaults = () => {
    if (setCustomCategories) {
      setCustomCategories(DEFAULT_CATEGORIES);
    }
  };

  const allocatedTotal = Object.values(budget.categories || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const unallocated = (budget.total || 0) - allocatedTotal;
  const totalSpent = Object.values(expensesByCategory).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const remainingBudget = (budget.total || 0) - totalSpent;
  const spentPercentage = budget.total > 0 ? (totalSpent / budget.total) * 100 : 0;
  const allocatedPercentage = budget.total > 0 ? (allocatedTotal / budget.total) * 100 : 0;

  const getStatusColor = (pct) => {
    if (pct > 90) return '#EF4444';
    if (pct > 70) return '#F59E0B';
    return '#10B981';
  };

  const quickAllocate = () => {
    if (budget.total <= 0) return;
    
    const perCategory = Math.round(budget.total / CATEGORIES.length);
    const newCategories = {};
    CATEGORIES.forEach((cat, index) => {
      // Give first category remainder to balance
      if (index === 0) {
        newCategories[cat.key] = budget.total - (perCategory * (CATEGORIES.length - 1));
      } else {
        newCategories[cat.key] = perCategory;
      }
    });
    
    setBudget({ ...budget, categories: newCategories });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💰 Budget</Text>
          <Text style={styles.headerSubtitle}>
            {tripInfo.destination ? `${tripInfo.destination} Trip` : 'Plan your spending'}
          </Text>
        </View>
        {budget.total > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{spentPercentage.toFixed(0)}% used</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Total Budget Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardInner}>
            <View style={styles.totalCardLeft}>
              <Text style={styles.totalLabel}>Total Budget</Text>
              <View style={styles.totalInputRow}>
                <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                <TextInput
                  style={styles.totalInput}
                  keyboardType="decimal-pad"
                  value={totalBudget}
                  onChangeText={setTotalBudget}
                  onBlur={handleSaveBudget}
                  placeholderTextColor={colors.textMuted}
                  placeholder="0"
                  selectTextOnFocus
                />
              </View>
            </View>
            <View style={styles.totalCardRight}>
              <View style={[styles.circleProgress, { borderColor: getStatusColor(spentPercentage) }]}>
                <Text style={styles.circleText}>{spentPercentage.toFixed(0)}%</Text>
                <Text style={styles.circleLabel}>spent</Text>
              </View>
            </View>
          </View>

          {/* Dual Progress Bar */}
          <View style={styles.dualProgressContainer}>
            <View style={styles.dualProgressBar}>
              <View style={[styles.dualProgressAllocated, { width: `${Math.min(allocatedPercentage, 100)}%` }]} />
              <View style={[styles.dualProgressSpent, { width: `${Math.min(spentPercentage, 100)}%`, backgroundColor: getStatusColor(spentPercentage) }]} />
            </View>
            <View style={styles.dualProgressLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primaryMuted }]} />
                <Text style={styles.legendText}>Allocated {allocatedPercentage.toFixed(0)}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: getStatusColor(spentPercentage) }]} />
                <Text style={styles.legendText}>Spent {spentPercentage.toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#10B98120' }]}>
              <Text style={styles.statIcon}>💵</Text>
            </View>
            <Text style={[styles.statValue, { color: remainingBudget >= 0 ? '#10B981' : '#EF4444' }]}>
              {safeFormat(Math.abs(remainingBudget))}
            </Text>
            <Text style={styles.statLabel}>{remainingBudget >= 0 ? 'Remaining' : 'Over Budget'}</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#3B82F620' }]}>
              <Text style={styles.statIcon}>💸</Text>
            </View>
            <Text style={styles.statValue}>{safeFormat(totalSpent)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#F59E0B20' }]}>
              <Text style={styles.statIcon}>📊</Text>
            </View>
            <Text style={[styles.statValue, { color: unallocated >= 0 ? colors.text : '#EF4444' }]}>
              {safeFormat(Math.abs(unallocated))}
            </Text>
            <Text style={styles.statLabel}>{unallocated >= 0 ? 'Unallocated' : 'Over Allocated'}</Text>
          </View>
        </View>

        {/* Category Breakdown with Customize Option */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Category Budgets</Text>
            <View style={styles.sectionActions}>
              {budget.total > 0 && (
                <TouchableOpacity style={styles.quickAllocateBtn} onPress={quickAllocate}>
                  <Text style={styles.quickAllocateText}>⚡ Auto</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.customizeBtn} onPress={() => { setEditingCategory(null); setShowCategoryModal(true); }}>
                <Text style={styles.customizeText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {CATEGORIES.map((category) => {
            const allocated = parseFloat(budget.categories?.[category.key]) || 0;
            const spent = parseFloat(expensesByCategory[category.key]) || 0;
            const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
            const remaining = allocated - spent;
            const inputValue = categoryInputs[category.key] || '';
            const isFocused = focusedCategory === category.key;
            
            return (
              <TouchableOpacity 
                key={category.key} 
                style={[styles.categoryCard, isFocused && styles.categoryCardFocused]}
                onLongPress={() => handleEditCategory(category)}
                delayLongPress={500}
              >
                <View style={styles.categoryTop}>
                  <View style={[styles.categoryColorBar, { backgroundColor: category.color }]} />
                  <View style={styles.categoryMain}>
                    <View style={styles.categoryHeader}>
                      <View style={[styles.categoryIconBg, { backgroundColor: category.color + '15' }]}>
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryLabel}>{category.label}</Text>
                        <Text style={styles.categoryHint}>Suggested: {category.tip}</Text>
                      </View>
                      <View style={[styles.categoryInputBox, isFocused && styles.categoryInputBoxFocused]}>
                        <Text style={styles.categoryInputSymbol}>{currency.symbol}</Text>
                        <TextInput
                          style={styles.categoryInput}
                          keyboardType="decimal-pad"
                          value={inputValue}
                          onChangeText={(text) => handleCategoryChange(category.key, text.replace(/[^0-9.]/g, ''))}
                          onFocus={() => handleCategoryFocus(category.key)}
                          onBlur={() => handleCategoryBlur(category.key)}
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          selectTextOnFocus
                        />
                      </View>
                    </View>
                    
                    <View style={styles.categoryProgressRow}>
                      <View style={styles.categoryProgressBar}>
                        <View style={[styles.categoryProgressFill, { width: `${percentage}%`, backgroundColor: getStatusColor(percentage) }]} />
                      </View>
                      <Text style={[styles.categoryPercent, { color: getStatusColor(percentage) }]}>{percentage.toFixed(0)}%</Text>
                    </View>

                    <View style={styles.categoryFooter}>
                      <Text style={styles.categorySpentText}>{safeFormat(spent)} spent</Text>
                      {allocated > 0 && (
                        <Text style={[styles.categoryRemainingText, { color: remaining >= 0 ? '#10B981' : '#EF4444' }]}>
                          {remaining >= 0 ? `${safeFormat(remaining)} left` : `${safeFormat(Math.abs(remaining))} over`}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* Add Category Button */}
          <TouchableOpacity style={styles.addCategoryBtn} onPress={() => { setEditingCategory(null); setNewCategory({ key: '', label: '', emoji: '📦', color: '#6B7280', tip: '5-10%' }); setShowCategoryModal(true); }}>
            <Text style={styles.addCategoryIcon}>+</Text>
            <Text style={styles.addCategoryText}>Add Custom Category</Text>
          </TouchableOpacity>
        </View>

        {/* Smart Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>💡 Smart Insights</Text>
          <View style={styles.insightsList}>
            {spentPercentage > 80 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>⚠️</Text>
                <Text style={styles.insightText}>You've used {spentPercentage.toFixed(0)}% of your budget. Consider slowing down!</Text>
              </View>
            )}
            {unallocated > 0 && budget.total > 0 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>💰</Text>
                <Text style={styles.insightText}>{safeFormat(unallocated)} is unallocated. Tap "Auto" to distribute it.</Text>
              </View>
            )}
            {budget.total === 0 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>🎯</Text>
                <Text style={styles.insightText}>Set a total budget above to start planning your trip expenses.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Category Edit Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Medical, Entertainment"
                  placeholderTextColor={colors.textMuted}
                  value={newCategory.label}
                  onChangeText={(t) => setNewCategory({ ...newCategory, label: t })}
                />
              </View>

              {/* Emoji Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Icon</Text>
                <View style={styles.emojiGrid}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.emojiOption, newCategory.emoji === emoji && styles.emojiOptionSelected]}
                      onPress={() => setNewCategory({ ...newCategory, emoji })}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Color</Text>
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorOption, { backgroundColor: color }, newCategory.color === color && styles.colorOptionSelected]}
                      onPress={() => setNewCategory({ ...newCategory, color })}
                    >
                      {newCategory.color === color && <Text style={styles.colorCheck}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Suggested % */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Suggested Budget %</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10-15%"
                  placeholderTextColor={colors.textMuted}
                  value={newCategory.tip}
                  onChangeText={(t) => setNewCategory({ ...newCategory, tip: t })}
                />
              </View>

              {/* Preview */}
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>Preview</Text>
                <View style={[styles.previewCategory, { borderLeftColor: newCategory.color }]}>
                  <View style={[styles.previewIcon, { backgroundColor: newCategory.color + '20' }]}>
                    <Text style={styles.previewEmoji}>{newCategory.emoji}</Text>
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>{newCategory.label || 'Category Name'}</Text>
                    <Text style={styles.previewTip}>Suggested: {newCategory.tip || '0%'}</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <TouchableOpacity
                style={[styles.submitBtn, !newCategory.label.trim() && { opacity: 0.5 }]}
                onPress={editingCategory ? handleUpdateCategory : handleAddCategory}
                disabled={!newCategory.label.trim()}
              >
                <Text style={styles.submitBtnText}>{editingCategory ? '✓ Update Category' : '+ Add Category'}</Text>
              </TouchableOpacity>

              {editingCategory && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { handleDeleteCategory(editingCategory.key); setShowCategoryModal(false); }}>
                  <Text style={styles.deleteBtnText}>🗑️ Delete Category</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.resetBtn} onPress={resetToDefaults}>
                <Text style={styles.resetBtnText}>↺ Reset to Defaults</Text>
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
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  headerBadge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  // Total Card - Softer, theme-matching colors
  totalCard: { 
    marginHorizontal: 20, 
    backgroundColor: colors.card, 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  totalCardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCardLeft: { flex: 1 },
  totalLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { color: colors.primary, fontSize: 32, fontWeight: 'bold' },
  totalInput: { color: colors.text, fontSize: 40, fontWeight: 'bold', padding: 0, minWidth: 100 },
  totalCardRight: { marginLeft: 16 },
  circleProgress: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    borderWidth: 4, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.cardLight 
  },
  circleText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  circleLabel: { color: colors.textMuted, fontSize: 10 },

  // Dual Progress - Softer colors
  dualProgressContainer: { marginTop: 20 },
  dualProgressBar: { 
    height: 10, 
    backgroundColor: colors.cardLight, 
    borderRadius: 5, 
    overflow: 'hidden', 
    position: 'relative' 
  },
  dualProgressAllocated: { 
    position: 'absolute', 
    height: '100%', 
    backgroundColor: colors.primaryMuted, 
    borderRadius: 5 
  },
  dualProgressSpent: { 
    position: 'absolute', 
    height: '100%', 
    borderRadius: 5 
  },
  dualProgressLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { color: colors.textMuted, fontSize: 11 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  statIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statIcon: { fontSize: 18 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 4, textAlign: 'center' },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  sectionActions: { flexDirection: 'row', gap: 8 },
  quickAllocateBtn: { backgroundColor: colors.primaryMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  quickAllocateText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  customizeBtn: { backgroundColor: colors.cardLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  customizeText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  
  // Category Card
  categoryCard: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.primaryBorder },
  categoryCardFocused: { borderColor: colors.primary, borderWidth: 2 },
  categoryTop: { flexDirection: 'row' },
  categoryColorBar: { width: 4 },
  categoryMain: { flex: 1, padding: 14 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryIconBg: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryEmoji: { fontSize: 20 },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  categoryHint: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  categoryInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryInputBoxFocused: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  categoryInputSymbol: { color: colors.textMuted, fontSize: 14 },
  categoryInput: { color: colors.text, fontSize: 15, fontWeight: '600', width: 70, textAlign: 'right', padding: 0 },
  
  categoryProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryProgressBar: { flex: 1, height: 6, backgroundColor: colors.cardLight, borderRadius: 3, overflow: 'hidden' },
  categoryProgressFill: { height: '100%', borderRadius: 3 },
  categoryPercent: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },

  categoryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  categorySpentText: { color: colors.textMuted, fontSize: 12 },
  categoryRemainingText: { fontSize: 12, fontWeight: '600' },

  addCategoryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardLight, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.primaryBorder, borderStyle: 'dashed', marginTop: 4 },
  addCategoryIcon: { color: colors.primary, fontSize: 20, marginRight: 8 },
  addCategoryText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  // Insights
  insightsCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  insightsTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  insightsList: { gap: 10 },
  insightItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.cardLight, padding: 12, borderRadius: 10 },
  insightIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  insightText: { color: colors.text, fontSize: 13, flex: 1, lineHeight: 18 },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: colors.textMuted, fontSize: 18 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: colors.cardLight, color: colors.text, padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: colors.primaryBorder },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  emojiOptionSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryMuted },
  emojiText: { fontSize: 22 },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  colorOptionSelected: { borderWidth: 3, borderColor: '#FFF' },
  colorCheck: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  previewCard: { backgroundColor: colors.cardLight, borderRadius: 14, padding: 14, marginBottom: 16 },
  previewLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 10 },
  previewCategory: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12, borderLeftWidth: 4 },
  previewIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  previewEmoji: { fontSize: 20 },
  previewInfo: { marginLeft: 12 },
  previewName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  previewTip: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#EF444420', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  deleteBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  resetBtn: { padding: 14, alignItems: 'center', marginTop: 8 },
  resetBtnText: { color: colors.textMuted, fontSize: 14 },
});
