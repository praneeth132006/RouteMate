import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
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
};

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
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'clothing' });

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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
              {/* Unpacked */}
              {packingItems.filter(i => !i.packed).length > 0 && (
                <>
                  <Text style={styles.listLabel}>TO PACK</Text>
                  {packingItems.filter(i => !i.packed).map(item => (
                    <View key={item.id} style={styles.itemCard}>
                      <TouchableOpacity 
                        style={styles.checkbox}
                        onPress={() => togglePackingItem(item.id)}
                      />
                      <Text style={styles.itemIcon}>{getCategoryIcon(item.category)}</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <TouchableOpacity onPress={() => deletePackingItem(item.id)}>
                        <Text style={styles.deleteButton}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              {/* Packed */}
              {packingItems.filter(i => i.packed).length > 0 && (
                <>
                  <Text style={[styles.listLabel, { marginTop: 24 }]}>PACKED ✓</Text>
                  {packingItems.filter(i => i.packed).map(item => (
                    <View key={item.id} style={[styles.itemCard, styles.itemCardPacked]}>
                      <TouchableOpacity 
                        style={[styles.checkbox, styles.checkboxChecked]}
                        onPress={() => togglePackingItem(item.id)}
                      >
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

        <View style={{ height: 30 }} />
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
              placeholderTextColor={COLORS.textMuted}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.green,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: COLORS.bg, fontSize: 28, fontWeight: 'bold', marginTop: -2 },
  progressCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  progressCircleContainer: { marginRight: 20 },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: { color: COLORS.green, fontSize: 20, fontWeight: 'bold' },
  progressInfo: { flex: 1 },
  progressTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: COLORS.cardLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 4 },
  quickAddSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  quickAddGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAddChip: {
    backgroundColor: COLORS.greenMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  quickAddText: { color: COLORS.green, fontSize: 13, fontWeight: '600' },
  itemsSection: { marginTop: 30, paddingHorizontal: 20 },
  listLabel: { color: COLORS.green, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  itemCardPacked: { opacity: 0.6 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.green,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.green },
  checkmark: { color: COLORS.bg, fontSize: 14, fontWeight: 'bold' },
  itemIcon: { fontSize: 20, marginRight: 12 },
  itemName: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '500' },
  itemNamePacked: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  deleteButton: { color: COLORS.textMuted, fontSize: 24, paddingLeft: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
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
  inputLabel: { color: COLORS.textMuted, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  categoryChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { color: COLORS.text, fontSize: 13 },
  categoryTextActive: { color: COLORS.bg, fontWeight: '600' },
  submitButton: { backgroundColor: COLORS.green, padding: 18, borderRadius: 14, alignItems: 'center' },
  submitButtonText: { color: COLORS.bg, fontSize: 17, fontWeight: 'bold' },
});
