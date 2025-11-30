import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTravelContext } from '../context/TravelContext';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = [
  { key: 'clothing', label: 'Clothing', icon: '👕' },
  { key: 'toiletries', label: 'Toiletries', icon: '🧴' },
  { key: 'electronics', label: 'Electronics', icon: '📱' },
  { key: 'documents', label: 'Documents', icon: '📄' },
  { key: 'other', label: 'Other', icon: '📦' },
];

const QUICK_ADD = ['Passport', 'Phone Charger', 'Toothbrush', 'Clothes', 'Wallet', 'Sunglasses'];

export default function PackingScreen() {
  const { packingItems, addPackingItem, togglePackingItem, deletePackingItem } = useTravelContext();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'clothing' });

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      addPackingItem({ name: newItem.name, category: newItem.category, quantity: 1 });
      setNewItem({ name: '', category: 'clothing' });
      setModalVisible(false);
    }
  };

  const packedCount = packingItems.filter(i => i.packed).length;
  const totalCount = packingItems.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  const getCategoryIcon = (key) => CATEGORIES.find(c => c.key === key)?.icon || '📦';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Packing</Text>
            <Text style={styles.subtitle}>{packedCount} of {totalCount} items packed</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
            </View>
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>
              {progress === 100 ? '🎉 All Packed!' : 'Keep going!'}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        {/* Quick Add */}
        <View style={styles.quickAddSection}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            {QUICK_ADD.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAddChip}
                onPress={() => addPackingItem({ name: item, category: 'other', quantity: 1 })}
              >
                <Text style={styles.quickAddText}>+ {item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsSection}>
          {packingItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎒</Text>
              <Text style={styles.emptyText}>No items yet</Text>
            </View>
          ) : (
            <>
              {packingItems.filter(i => !i.packed).length > 0 && (
                <>
                  <Text style={styles.listLabel}>TO PACK</Text>
                  {packingItems.filter(i => !i.packed).map(item => (
                    <View key={item.id} style={styles.itemCard}>
                      <TouchableOpacity style={styles.checkbox} onPress={() => togglePackingItem(item.id)} />
                      <Text style={styles.itemIcon}>{getCategoryIcon(item.category)}</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <TouchableOpacity onPress={() => deletePackingItem(item.id)}>
                        <Text style={styles.deleteButton}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              {packingItems.filter(i => i.packed).length > 0 && (
                <>
                  <Text style={[styles.listLabel, { marginTop: 24 }]}>PACKED ✓</Text>
                  {packingItems.filter(i => i.packed).map(item => (
                    <View key={item.id} style={[styles.itemCard, styles.itemCardPacked]}>
                      <TouchableOpacity style={[styles.checkbox, styles.checkboxChecked]} onPress={() => togglePackingItem(item.id)}>
                        <Text style={styles.checkmark}>✓</Text>
                      </TouchableOpacity>
                      <Text style={styles.itemIcon}>{getCategoryIcon(item.category)}</Text>
                      <Text style={[styles.itemName, styles.itemNamePacked]}>{item.name}</Text>
                      <TouchableOpacity onPress={() => deletePackingItem(item.id)}>
                        <Text style={styles.deleteButton}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Item</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Item name"
              placeholderTextColor={colors.textMuted}
              value={newItem.name}
              onChangeText={(t) => setNewItem({...newItem, name: t})}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, newItem.category === cat.key && styles.categoryChipActive]}
                  onPress={() => setNewItem({...newItem, category: cat.key})}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryText, newItem.category === cat.key && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddItem}>
              <Text style={styles.submitButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 },
  title: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  addButton: { width: 48, height: 48, backgroundColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: colors.bg, fontSize: 28, fontWeight: 'bold', marginTop: -2 },
  
  progressCard: { marginTop: 24, backgroundColor: colors.card, borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  progressCircleContainer: { marginRight: 20 },
  progressCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  progressPercent: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  progressInfo: { flex: 1 },
  progressTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: colors.cardLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  
  quickAddSection: { marginTop: 30 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  quickAddGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAddChip: { backgroundColor: colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  quickAddText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  
  itemsSection: { marginTop: 30 },
  listLabel: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  itemCardPacked: { opacity: 0.6 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.primary, marginRight: 14, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary },
  checkmark: { color: colors.bg, fontSize: 14, fontWeight: 'bold' },
  itemIcon: { fontSize: 20, marginRight: 12 },
  itemName: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '500' },
  itemNamePacked: { textDecorationLine: 'line-through', color: colors.textMuted },
  deleteButton: { color: colors.textMuted, fontSize: 24, paddingLeft: 10 },
  
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: colors.cardLight, color: colors.text, padding: 18, borderRadius: 14, fontSize: 16, borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: 20 },
  inputLabel: { color: colors.textMuted, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { color: colors.text, fontSize: 13 },
  categoryTextActive: { color: colors.bg, fontWeight: '600' },
  submitButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 14, alignItems: 'center' },
  submitButtonText: { color: colors.bg, fontSize: 17, fontWeight: 'bold' },
});
