import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ onBack }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const pastTrips = [
    { id: 1, name: 'Paris Adventure', destination: 'Paris, France', date: 'Mar 2024', days: 7, spent: 2500, emoji: '🗼' },
    { id: 2, name: 'Tokyo Explorer', destination: 'Tokyo, Japan', date: 'Jan 2024', days: 10, spent: 4200, emoji: '🗾' },
    { id: 3, name: 'Beach Getaway', destination: 'Bali, Indonesia', date: 'Nov 2023', days: 5, spent: 1800, emoji: '🏝️' },
  ];

  const totalTrips = pastTrips.length;
  const totalDays = pastTrips.reduce((sum, t) => sum + t.days, 0);
  const totalSpent = pastTrips.reduce((sum, t) => sum + t.spent, 0);

  const menuItems = [
    { icon: '💱', label: 'Currency', value: 'USD', type: 'value' },
    { icon: '🌐', label: 'Language', value: 'English', type: 'value' },
    { icon: '🔔', label: 'Notifications', value: true, type: 'toggle' },
    { icon: '📤', label: 'Export Data', type: 'action' },
    { icon: '❓', label: 'Help & Support', type: 'action' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🧑‍✈️</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>✨</Text>
            </View>
          </View>
          <Text style={styles.profileName}>Traveler</Text>
          <Text style={styles.profileEmail}>traveler@travelmate.app</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTrips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${(totalSpent / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
        </View>

        {/* Trip History Section */}
        <TouchableOpacity style={styles.historyCard} onPress={() => setShowHistoryModal(true)}>
          <View style={styles.historyHeader}>
            <View style={styles.historyIcon}>
              <Text style={styles.historyIconEmoji}>📜</Text>
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>Trip History</Text>
              <Text style={styles.historySubtitle}>{totalTrips} past adventures</Text>
            </View>
            <Text style={styles.historyArrow}>→</Text>
          </View>
          <View style={styles.tripPreview}>
            {pastTrips.slice(0, 3).map((trip, index) => (
              <View key={trip.id} style={[styles.tripPreviewItem, index > 0 && { marginLeft: -12 }]}>
                <Text style={styles.tripPreviewEmoji}>{trip.emoji}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Theme Toggle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Appearance</Text>
        </View>
        <View style={styles.themeCard}>
          <View style={styles.themeRow}>
            <View style={styles.themeIconWrap}>
              <Text style={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <View style={styles.themeInfo}>
              <Text style={styles.themeLabel}>Dark Mode</Text>
              <Text style={styles.themeDescription}>
                {isDark ? 'Night theme active' : 'Sunrise theme active'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.cardLight, true: colors.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
            >
              <View style={styles.menuIconWrap}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.type === 'value' && <Text style={styles.menuValue}>{item.value}</Text>}
              {item.type === 'toggle' && (
                <Switch value={item.value} trackColor={{ false: colors.cardLight, true: colors.primary }} thumbColor={'#FFFFFF'} />
              )}
              {item.type === 'action' && <Text style={styles.menuArrow}>→</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.dangerCard}>
          <View style={styles.dangerIcon}>
            <Text style={styles.dangerIconEmoji}>🗑️</Text>
          </View>
          <View style={styles.dangerInfo}>
            <Text style={styles.dangerLabel}>Clear All Data</Text>
            <Text style={styles.dangerDescription}>Delete all trips and settings</Text>
          </View>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appLogo}>✈️</Text>
          <Text style={styles.appName}>TravelMate</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* History Modal */}
      <Modal animationType="slide" transparent visible={showHistoryModal} onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trip History 📜</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {pastTrips.map((trip) => (
                <View key={trip.id} style={styles.historyItem}>
                  <View style={styles.historyItemIcon}>
                    <Text style={styles.historyItemEmoji}>{trip.emoji}</Text>
                  </View>
                  <View style={styles.historyItemInfo}>
                    <Text style={styles.historyItemName}>{trip.name}</Text>
                    <Text style={styles.historyItemDestination}>{trip.destination}</Text>
                    <View style={styles.historyItemMeta}>
                      <Text style={styles.historyItemDate}>📅 {trip.date}</Text>
                      <Text style={styles.historyItemDays}>• {trip.days} days</Text>
                    </View>
                  </View>
                  <View style={styles.historyItemSpent}>
                    <Text style={styles.historyItemSpentValue}>${trip.spent}</Text>
                    <Text style={styles.historyItemSpentLabel}>spent</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  
  // Header with Back
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  backArrow: { fontSize: 22, color: colors.text },
  title: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  placeholder: { width: 44 },

  // Profile Card
  profileCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary },
  avatarEmoji: { fontSize: 40 },
  avatarBadge: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.card },
  avatarBadgeText: { fontSize: 14 },
  profileName: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  profileEmail: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  editProfileButton: { marginTop: 16, backgroundColor: colors.primaryMuted, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryBorder },
  editProfileText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  statValue: { color: colors.primary, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },

  // History Card
  historyCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.primaryBorder },
  historyHeader: { flexDirection: 'row', alignItems: 'center' },
  historyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  historyIconEmoji: { fontSize: 24 },
  historyInfo: { flex: 1, marginLeft: 14 },
  historyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  historySubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  historyArrow: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  tripPreview: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  tripPreviewItem: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card },
  tripPreviewEmoji: { fontSize: 20 },

  // Sections
  sectionHeader: { marginBottom: 12, marginTop: 8 },
  sectionTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  // Theme Card
  themeCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  themeRow: { flexDirection: 'row', alignItems: 'center' },
  themeIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  themeIcon: { fontSize: 22 },
  themeInfo: { flex: 1, marginLeft: 14 },
  themeLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  themeDescription: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  // Menu Card
  menuCard: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, color: colors.text, fontSize: 15, marginLeft: 14 },
  menuValue: { color: colors.textMuted, fontSize: 14 },
  menuArrow: { color: colors.textMuted, fontSize: 18 },

  // Danger Card
  dangerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 30 },
  dangerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center' },
  dangerIconEmoji: { fontSize: 20 },
  dangerInfo: { flex: 1, marginLeft: 14 },
  dangerLabel: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  dangerDescription: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  // App Info
  appInfo: { alignItems: 'center', paddingVertical: 20 },
  appLogo: { fontSize: 32, marginBottom: 8 },
  appName: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  appVersion: { color: colors.textMuted, fontSize: 12, marginTop: 4, opacity: 0.6 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardLight, borderRadius: 10 },
  modalCloseText: { color: colors.textMuted, fontSize: 22 },

  // History Items
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 16, padding: 16, marginBottom: 12 },
  historyItemIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  historyItemEmoji: { fontSize: 24 },
  historyItemInfo: { flex: 1, marginLeft: 14 },
  historyItemName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  historyItemDestination: { color: colors.primary, fontSize: 13, marginTop: 2 },
  historyItemMeta: { flexDirection: 'row', marginTop: 6 },
  historyItemDate: { color: colors.textMuted, fontSize: 12 },
  historyItemDays: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
  historyItemSpent: { alignItems: 'flex-end' },
  historyItemSpentValue: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  historyItemSpentLabel: { color: colors.textMuted, fontSize: 11 },

  // Empty State
  emptyHistory: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
});
