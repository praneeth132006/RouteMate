import React, { useState, useMemo } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, TextInput, 
  StyleSheet, Modal, Switch, Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTravelContext } from '../context/TravelContext';

export default function ProfileScreen({ onBack }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { tripHistory, deleteTripFromHistory, getTotalExpenses } = useTravelContext();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [userName, setUserName] = useState('Traveler');
  const [userEmail, setUserEmail] = useState('traveler@email.com');
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSaveProfile = () => {
    setUserName(editName);
    setUserEmail(editEmail);
    setShowEditModal(false);
  };

  // Calculate stats from history
  const totalTrips = tripHistory.length;
  const totalDays = tripHistory.reduce((sum, trip) => {
    // Calculate days from trip dates if available
    return sum + (trip.activitiesCount || 0);
  }, 0);
  const totalSpent = tripHistory.reduce((sum, trip) => sum + (trip.totalSpent || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileGlow} />
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>✈️</Text>
            </View>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <Pressable 
            style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.8 }]}
            onPress={() => { setEditName(userName); setEditEmail(userEmail); setShowEditModal(true); }}
          >
            <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: '#3B82F620' }]}>
              <Text style={styles.statIcon}>🧳</Text>
            </View>
            <Text style={styles.statValue}>{totalTrips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: '#10B98120' }]}>
              <Text style={styles.statIcon}>📅</Text>
            </View>
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: '#F59E0B20' }]}>
              <Text style={styles.statIcon}>💰</Text>
            </View>
            <Text style={styles.statValue}>${totalSpent}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
        </View>

        {/* Trip History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📜 Trip History</Text>
            {tripHistory.length > 0 && (
              <Text style={styles.sectionCount}>{tripHistory.length} trips</Text>
            )}
          </View>
          
          {tripHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <View style={styles.emptyIconBg}>
                <Text style={styles.emptyIcon}>🗺️</Text>
              </View>
              <Text style={styles.emptyTitle}>No completed trips yet</Text>
              <Text style={styles.emptyText}>Your completed trips will appear here</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {tripHistory.map((trip) => (
                <View key={trip.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyIconBg}>
                      <Text style={styles.historyIcon}>✈️</Text>
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDestination}>{trip.destination}</Text>
                      <Text style={styles.historyDates}>{trip.startDate} → {trip.endDate}</Text>
                    </View>
                    <Pressable 
                      style={styles.historyDeleteBtn}
                      onPress={() => deleteTripFromHistory(trip.id)}
                    >
                      <Text style={styles.historyDeleteText}>🗑️</Text>
                    </Pressable>
                  </View>
                  
                  <View style={styles.historyStats}>
                    <View style={styles.historyStatItem}>
                      <Text style={styles.historyStatEmoji}>💰</Text>
                      <Text style={styles.historyStatValue}>${trip.totalSpent || 0}</Text>
                      <Text style={styles.historyStatLabel}>Spent</Text>
                    </View>
                    <View style={styles.historyStatDivider} />
                    <View style={styles.historyStatItem}>
                      <Text style={styles.historyStatEmoji}>🎯</Text>
                      <Text style={styles.historyStatValue}>{trip.activitiesCount || 0}</Text>
                      <Text style={styles.historyStatLabel}>Activities</Text>
                    </View>
                    <View style={styles.historyStatDivider} />
                    <View style={styles.historyStatItem}>
                      <Text style={styles.historyStatEmoji}>👥</Text>
                      <Text style={styles.historyStatValue}>{(trip.participants?.length || 0) + 1}</Text>
                      <Text style={styles.historyStatLabel}>Travelers</Text>
                    </View>
                  </View>

                  <View style={styles.historyFooter}>
                    <Text style={styles.historyCompleted}>✅ Completed {trip.completedDate}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Appearance</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#8B5CF620' }]}>
                  <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Text style={styles.settingDesc}>{isDark ? 'Dark theme active' : 'Light theme active'}</Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.cardLight, true: colors.primary }}
                thumbColor={colors.bg}
              />
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          <View style={styles.settingCard}>
            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#10B98120' }]}>
                  <Text style={styles.settingIcon}>💵</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Currency</Text>
                  <Text style={styles.settingDesc}>USD ($)</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </Pressable>

            <View style={styles.settingDivider} />

            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#3B82F620' }]}>
                  <Text style={styles.settingIcon}>🌐</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingDesc}>English</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </Pressable>

            <View style={styles.settingDivider} />

            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#F59E0B20' }]}>
                  <Text style={styles.settingIcon}>🔔</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingDesc}>Manage alerts</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </Pressable>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <View style={styles.settingCard}>
            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#EC489920' }]}>
                  <Text style={styles.settingIcon}>❤️</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Rate App</Text>
                  <Text style={styles.settingDesc}>Love the app? Rate us!</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </Pressable>

            <View style={styles.settingDivider} />

            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#6B728020' }]}>
                  <Text style={styles.settingIcon}>📄</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                  <Text style={styles.settingDesc}>Read our privacy terms</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </Pressable>

            <View style={styles.settingDivider} />

            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#6B728020' }]}>
                  <Text style={styles.settingIcon}>📋</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Terms of Service</Text>
                  <Text style={styles.settingDesc}>Read our terms</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>✈️</Text>
          <Text style={styles.footerText}>TravelMate</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.modalAvatar}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{editName.charAt(0).toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Your email"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
              />
            </View>

            <Pressable 
              style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.9 }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: colors.card, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  backButtonText: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  headerRight: { width: 44 },

  // Profile Card
  profileCard: { 
    marginHorizontal: 20, 
    backgroundColor: colors.card, 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileGlow: { 
    position: 'absolute', 
    top: -50, 
    right: -50, 
    width: 150, 
    height: 150, 
    backgroundColor: colors.primary, 
    opacity: 0.08, 
    borderRadius: 75,
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 24, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  avatarText: { color: colors.bg, fontSize: 32, fontWeight: 'bold' },
  avatarBadge: { 
    position: 'absolute', 
    bottom: -4, 
    right: -4, 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: colors.card, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  avatarBadgeText: { fontSize: 14 },
  userName: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  userEmail: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  editButton: { 
    marginTop: 16, 
    backgroundColor: colors.primaryMuted, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  editButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  // Stats Card
  statsCard: { 
    marginHorizontal: 20, 
    backgroundColor: colors.card, 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIconBg: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8,
  },
  statIcon: { fontSize: 20 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.primaryBorder, marginHorizontal: 12 },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  sectionCount: { color: colors.textMuted, fontSize: 13 },

  // Empty History
  emptyHistory: { 
    backgroundColor: colors.card, 
    borderRadius: 20, 
    padding: 40, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  emptyIconBg: { 
    width: 72, 
    height: 72, 
    borderRadius: 20, 
    backgroundColor: colors.primaryMuted, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },

  // History List
  historyList: { gap: 12 },
  historyCard: { 
    backgroundColor: colors.card, 
    borderRadius: 18, 
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  historyIconBg: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: colors.primaryMuted, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  historyIcon: { fontSize: 22 },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyDestination: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  historyDates: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  historyDeleteBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: colors.cardLight, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  historyDeleteText: { fontSize: 16 },
  historyStats: { 
    flexDirection: 'row', 
    backgroundColor: colors.cardLight, 
    borderRadius: 12, 
    padding: 12,
  },
  historyStatItem: { flex: 1, alignItems: 'center' },
  historyStatEmoji: { fontSize: 16, marginBottom: 4 },
  historyStatValue: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  historyStatLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  historyStatDivider: { width: 1, backgroundColor: colors.primaryBorder },
  historyFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  historyCompleted: { color: colors.primary, fontSize: 12, fontWeight: '500' },

  // Settings Card
  settingCard: { 
    backgroundColor: colors.card, 
    borderRadius: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  settingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIconBg: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  settingIcon: { fontSize: 18 },
  settingInfo: { marginLeft: 12, flex: 1 },
  settingLabel: { color: colors.text, fontSize: 15, fontWeight: '500' },
  settingDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  settingArrow: { color: colors.textMuted, fontSize: 18 },
  settingDivider: { height: 1, backgroundColor: colors.primaryBorder, marginLeft: 66 },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerLogo: { fontSize: 32 },
  footerText: { color: colors.textMuted, fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  footerVersion: { color: colors.textLight, fontSize: 12, marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: colors.card, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    padding: 24,
  },
  modalHandle: { 
    width: 40, 
    height: 4, 
    backgroundColor: colors.textMuted, 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginBottom: 20,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
  },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalCloseBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: colors.cardLight, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  modalCloseBtnText: { color: colors.textMuted, fontSize: 22 },
  modalAvatar: { alignItems: 'center', marginBottom: 24 },
  avatarLarge: { 
    width: 80, 
    height: 80, 
    borderRadius: 24, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  avatarLargeText: { color: colors.bg, fontSize: 32, fontWeight: 'bold' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  input: { 
    backgroundColor: colors.cardLight, 
    color: colors.text, 
    padding: 16, 
    borderRadius: 12, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  saveButton: { 
    backgroundColor: colors.primary, 
    borderRadius: 14, 
    padding: 16, 
    alignItems: 'center', 
    marginTop: 8,
  },
  saveButtonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
});
