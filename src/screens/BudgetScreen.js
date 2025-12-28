import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, Dimensions, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

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

  // Use custom categories from context (which now defaults to the correct set)
  const CATEGORIES = customCategories || [];

  const [totalBudget, setTotalBudget] = useState((budget.total || 0).toString());
  const [categoryInputs, setCategoryInputs] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ key: '', label: '', emoji: '📦', color: '#6B7280', tip: '5-10%' });

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
  };

  const safeFormat = (amount) => {
    if (formatCurrency) return formatCurrency(amount);
    const num = parseFloat(amount) || 0;
    return `${currency.symbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Category management functions
  const handleAddCategory = () => {
    if (!newCategory.label.trim()) return;

    // Generate simple key
    const key = newCategory.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);
    const categoryToAdd = { ...newCategory, key };

    const updatedCategories = [...CATEGORIES, categoryToAdd];
    if (setCustomCategories) {
      setCustomCategories(updatedCategories);
    }

    // Initialize input for new category
    setCategoryInputs(prev => ({ ...prev, [key]: '0' }));

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

  const allocatedTotal = Object.values(budget.categories || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const unallocated = (budget.total || 0) - allocatedTotal;
  const totalSpent = Object.values(expensesByCategory).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const remainingBudget = (budget.total || 0) - totalSpent;
  const spentPercentage = budget.total > 0 ? (totalSpent / budget.total) * 100 : 0;

  const getStatusColor = (pct) => {
    if (pct > 90) return '#EF4444';
    if (pct > 75) return '#F59E0B';
    return colors.primary;
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

    // Update inputs
    const inputs = {};
    Object.keys(newCategories).forEach(key => inputs[key] = newCategories[key].toString());
    setCategoryInputs(inputs);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💰 Budget Planner</Text>
          <Text style={styles.headerSubtitle}>
            {tripInfo.destination || 'Your Trip'}
          </Text>
        </View>
        <TouchableOpacity style={styles.quickActionBtn} onPress={quickAllocate}>
          <Text style={styles.quickActionEmoji}>⚡</Text>
          <Text style={styles.quickActionText}>Auto-Fill</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Total Budget Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalHeader}>
            <Text style={styles.totalLabel}>TOTAL BUDGET</Text>
            {budget.total > 0 && <View style={[styles.statusPill, { backgroundColor: getStatusColor(spentPercentage) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(spentPercentage) }]}>
                {spentPercentage.toFixed(0)}% Spent
              </Text>
            </View>}
          </View>

          <View style={styles.totalInputContainer}>
            <Text style={styles.currencyPrefix}>{currency.symbol}</Text>
            <TextInput
              style={[styles.totalInput, { outlineStyle: 'none' }]}
              keyboardType="decimal-pad"
              value={totalBudget}
              onChangeText={setTotalBudget}
              onBlur={handleSaveBudget}
              placeholder="0"
              placeholderTextColor={colors.textMuted + '80'}
            />
          </View>

          {/* Progress Bar */}
          <View style={styles.mainProgressContainer}>
            <View style={styles.mainTrack}>
              <View style={[styles.mainFill, { width: `${Math.min(spentPercentage, 100)}%`, backgroundColor: getStatusColor(spentPercentage) }]} />
            </View>
            <View style={styles.mainStats}>
              <Text style={styles.mainStatText}>Spent: {safeFormat(totalSpent)}</Text>
              <Text style={[styles.mainStatText, { color: remainingBudget < 0 ? '#EF4444' : colors.textMuted }]}>
                {remainingBudget >= 0 ? `Left: ${safeFormat(remainingBudget)}` : `Over: ${safeFormat(Math.abs(remainingBudget))}`}
              </Text>
            </View>
          </View>

          {/* Allocation Warning */}
          {unallocated !== 0 && Math.abs(unallocated) > 1 && (
            <View style={styles.allocationWarning}>
              <Text style={styles.warningIcon}>{unallocated > 0 ? '⚠️' : '🛑'}</Text>
              <Text style={styles.warningText}>
                {unallocated > 0
                  ? `You have ${safeFormat(unallocated)} unallocated`
                  : `You allocated ${safeFormat(Math.abs(unallocated))} more than budget`}
              </Text>
            </View>
          )}
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>CATEGORIES</Text>

          {CATEGORIES.map((cat) => {
            const allocated = parseFloat(budget.categories?.[cat.key]) || 0;
            const spent = parseFloat(expensesByCategory[cat.key]) || 0;
            const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
            const remaining = allocated - spent;

            return (
              <TouchableOpacity key={cat.key} style={styles.catCard} onPress={() => handleEditCategory(cat)} onLongPress={() => handleEditCategory(cat)} delayLongPress={200}>
                <View style={styles.catIconContainer}>
                  <View style={[styles.catIconBg, { backgroundColor: cat.color + '20' }]}>
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  </View>
                </View>

                <View style={styles.catContent}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{cat.label}</Text>
                    <View style={styles.catInputWrapper}>
                      <Text style={styles.catCurrency}>{currency.symbol}</Text>
                      <TextInput
                        style={[styles.catInput, { outlineStyle: 'none' }]}
                        value={categoryInputs[cat.key]}
                        onChangeText={(t) => handleCategoryChange(cat.key, t)}
                        onBlur={() => handleCategoryBlur(cat.key)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                      />
                    </View>
                  </View>

                  {/* Mini Progress */}
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: `${percentage}%`, backgroundColor: cat.color }]} />
                  </View>

                  <View style={styles.catFooter}>
                    <Text style={styles.catSpent}>Spent: {safeFormat(spent)}</Text>
                    <Text style={[styles.catRemaining, { color: remaining < 0 ? '#EF4444' : colors.textMuted }]}>
                      {remaining >= 0 ? `${safeFormat(remaining)} left` : `${safeFormat(Math.abs(remaining))} over`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.newCatBtn} onPress={() => { setEditingCategory(null); setNewCategory({ key: '', label: '', emoji: '📦', color: '#6B7280', tip: '5-10%' }); setShowCategoryModal(true); }}>
            <Text style={styles.newCatIcon}>+</Text>
            <Text style={styles.newCatText}>Add New Category</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit/Add Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'New Category'}</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={[styles.modalInput, { outlineStyle: 'none' }]}
                value={newCategory.label}
                onChangeText={t => setNewCategory({ ...newCategory, label: t })}
                placeholder="e.g. Souvenirs"
                placeholderTextColor={colors.textMuted}
              />

              {/* Emojis */}
              <Text style={styles.inputLabel}>Icon</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(e => (
                  <TouchableOpacity key={e} onPress={() => setNewCategory({ ...newCategory, emoji: e })} style={[styles.emojiItem, newCategory.emoji === e && styles.emojiSelected]}>
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Colors */}
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map(c => (
                  <TouchableOpacity key={c} onPress={() => setNewCategory({ ...newCategory, color: c })} style={[styles.colorItem, { backgroundColor: c }, newCategory.color === c && styles.colorSelected]}>
                    {newCategory.color === c && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <TouchableOpacity style={styles.saveBtn} onPress={editingCategory ? handleUpdateCategory : handleAddCategory}>
                <Text style={styles.saveBtnText}>{editingCategory ? 'Update Category' : 'Create Category'}</Text>
              </TouchableOpacity>

              {editingCategory && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { handleDeleteCategory(editingCategory.key); setShowCategoryModal(false); }}>
                  <Text style={styles.deleteBtnText}>Delete Category</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  quickActionBtn: { backgroundColor: colors.cardLight, flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  quickActionEmoji: { fontSize: 14, marginRight: 4 },
  quickActionText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  // Total Card
  totalCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  totalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },

  totalInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  currencyPrefix: { fontSize: 32, fontWeight: '700', color: colors.primary, marginRight: 8 },
  totalInput: { fontSize: 42, fontWeight: '800', color: colors.text, flex: 1, padding: 0 },

  mainProgressContainer: { marginTop: 8 },
  mainTrack: { height: 12, backgroundColor: colors.bg, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  mainFill: { height: '100%', borderRadius: 6 },
  mainStats: { flexDirection: 'row', justifyContent: 'space-between' },
  mainStatText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },

  allocationWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 10, borderRadius: 12, marginTop: 16 },
  warningIcon: { marginRight: 8 },
  warningText: { fontSize: 12, color: '#D97706', fontWeight: '600' },

  // Categories
  categoriesSection: { gap: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginLeft: 4 },

  catCard: { flexDirection: 'row', backgroundColor: colors.card, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  catIconContainer: { marginRight: 16 },
  catIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 24 },

  catContent: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catName: { fontSize: 16, fontWeight: '700', color: colors.text },
  catInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  catCurrency: { fontSize: 12, color: colors.textMuted, marginRight: 4 },
  catInput: { fontSize: 14, fontWeight: '700', color: colors.text, minWidth: 40, textAlign: 'right', padding: 0 },

  miniTrack: { height: 6, backgroundColor: colors.bg, borderRadius: 3, marginBottom: 6 },
  miniFill: { height: '100%', borderRadius: 3 },
  catFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  catSpent: { fontSize: 11, color: colors.textMuted },
  catRemaining: { fontSize: 11, fontWeight: '600' },

  newCatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 2, borderColor: colors.primary + '30', borderStyle: 'dashed', borderRadius: 20, marginTop: 8 },
  newCatIcon: { fontSize: 18, color: colors.primary, marginRight: 8, fontWeight: '700' },
  newCatText: { fontSize: 14, color: colors.primary, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '80%' },
  modalHandle: { width: 40, height: 5, backgroundColor: colors.textMuted + '40', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  closeBtn: { padding: 8, backgroundColor: colors.bg, borderRadius: 20 },
  closeText: { fontSize: 16, color: colors.text },

  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 16 },
  modalInput: { backgroundColor: colors.bg, padding: 16, borderRadius: 16, fontSize: 16, color: colors.text, fontWeight: '600' },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiItem: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  emojiSelected: { backgroundColor: colors.primary + '20', borderWidth: 2, borderColor: colors.primary },
  emojiText: { fontSize: 20 },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorItem: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  checkMark: { color: 'black', fontSize: 16, fontWeight: 'bold' },

  saveBtn: { backgroundColor: colors.primary, padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: 'black', fontSize: 16, fontWeight: '800' },
  deleteBtn: { backgroundColor: '#EF444415', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 16 },
  deleteBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});
