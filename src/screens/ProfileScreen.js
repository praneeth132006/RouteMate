import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, THEMES } from '../context/ThemeContext';

export default function ProfileScreen({ onBack }) {
  const { colors, currentTheme, changeTheme, themes } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const styles = createStyles(colors);

  const MENU_ITEMS = [
    { icon: '👤', label: 'Edit Profile', subtitle: 'Update your details', action: null },
    { icon: '🔔', label: 'Notifications', subtitle: 'Manage alerts', action: null },
    { icon: '💳', label: 'Payment Methods', subtitle: 'Cards & wallets', action: null },
    { icon: '🌍', label: 'Currency', subtitle: 'USD ($)', action: null },
    { icon: '🎨', label: 'Appearance', subtitle: themes[currentTheme].name, action: () => setShowThemeModal(true) },
    { icon: '🔒', label: 'Privacy', subtitle: 'Security settings', action: null },
    { icon: '❓', label: 'Help & Support', subtitle: 'FAQs & contact', action: null },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.profileName}>Traveler</Text>
          <Text style={styles.profileEmail}>traveler@email.com</Text>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>3</Text>
              <Text style={styles.profileStatLabel}>Trips</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>5</Text>
              <Text style={styles.profileStatLabel}>Countries</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>20</Text>
              <Text style={styles.profileStatLabel}>Days</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={item.action}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showThemeModal}
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select your preferred appearance</Text>

            <View style={styles.themeGrid}>
              {Object.values(themes).map((themeOption) => {
                const isActive = currentTheme === themeOption.id;
                return (
                  <TouchableOpacity
                    key={themeOption.id}
                    style={[styles.themeCard, isActive && styles.themeCardActive]}
                    onPress={() => {
                      changeTheme(themeOption.id);
                      setShowThemeModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    {/* Theme Preview */}
                    <View style={styles.themePreview}>
                      <View style={[styles.themePreviewBg, { backgroundColor: themeOption.colors.bg }]}>
                        <View style={[styles.themePreviewCard, { backgroundColor: themeOption.colors.card, borderColor: themeOption.colors.primaryBorder }]}>
                          <View style={[styles.themePreviewAccent, { backgroundColor: themeOption.colors.primary }]} />
                          <View style={styles.themePreviewLines}>
                            <View style={[styles.themePreviewLine, { backgroundColor: themeOption.colors.text }]} />
                            <View style={[styles.themePreviewLine, styles.themePreviewLineShort, { backgroundColor: themeOption.colors.textMuted }]} />
                          </View>
                        </View>
                        <View style={[styles.themePreviewButton, { backgroundColor: themeOption.colors.primary }]} />
                      </View>
                    </View>

                    {/* Theme Name */}
                    <View style={styles.themeInfo}>
                      <Text style={[styles.themeName, isActive && styles.themeNameActive]}>{themeOption.name}</Text>
                      {isActive && (
                        <View style={styles.activeIndicator}>
                          <Text style={styles.activeCheck}>✓</Text>
                        </View>
                      )}
                    </View>

                    {/* Color Dots */}
                    <View style={styles.colorDots}>
                      <View style={[styles.colorDot, { backgroundColor: themeOption.preview[0] }]} />
                      <View style={[styles.colorDot, { backgroundColor: themeOption.preview[1] }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  backButtonText: { color: colors.primary, fontSize: 24, fontWeight: 'bold' },
  title: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  
  profileCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary, marginBottom: 16 },
  avatarEmoji: { fontSize: 40 },
  profileName: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  profileEmail: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  profileStats: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.primaryBorder, width: '100%' },
  profileStat: { flex: 1, alignItems: 'center' },
  profileStatValue: { color: colors.primary, fontSize: 22, fontWeight: 'bold' },
  profileStatLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  profileStatDivider: { width: 1, backgroundColor: colors.primaryBorder },
  
  menuSection: { marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  menuIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  menuEmoji: { fontSize: 20 },
  menuContent: { flex: 1, marginLeft: 14 },
  menuLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  menuSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  menuArrow: { color: colors.primary, fontSize: 18 },
  
  logoutButton: { backgroundColor: 'rgba(255,68,68,0.1)', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)' },
  logoutText: { color: '#FF4444', fontSize: 16, fontWeight: '600' },
  version: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 20 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardLight, borderRadius: 10 },
  modalCloseText: { color: colors.textMuted, fontSize: 22 },
  modalSubtitle: { color: colors.textMuted, fontSize: 14, marginBottom: 24 },

  // Theme Grid
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCard: { 
    width: '47%', 
    backgroundColor: colors.cardLight, 
    borderRadius: 16, 
    padding: 12, 
    borderWidth: 2, 
    borderColor: colors.primaryBorder 
  },
  themeCardActive: { borderColor: colors.primary, borderWidth: 2 },
  
  themePreview: { marginBottom: 12, borderRadius: 10, overflow: 'hidden' },
  themePreviewBg: { padding: 10, height: 80, justifyContent: 'space-between' },
  themePreviewCard: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  themePreviewAccent: { width: 24, height: 24, borderRadius: 6 },
  themePreviewLines: { marginLeft: 8, flex: 1 },
  themePreviewLine: { height: 4, borderRadius: 2, marginBottom: 4, width: '80%' },
  themePreviewLineShort: { width: '50%' },
  themePreviewButton: { height: 16, borderRadius: 8, width: '40%', alignSelf: 'center' },

  themeInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  themeName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  themeNameActive: { color: colors.primary },
  activeIndicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  activeCheck: { color: colors.bg, fontSize: 12, fontWeight: 'bold' },
  
  colorDots: { flexDirection: 'row', gap: 6 },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
});
