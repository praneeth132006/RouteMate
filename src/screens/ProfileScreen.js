import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  Switch,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTravelContext } from '../context/TravelContext';

const AVATARS = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🧳', '✈️', '🌍', '🏖️', '⛰️', '🗺️'];
const { width } = Dimensions.get('window');

// Animated Card Component
const AnimatedCard = ({ children, style, onPress, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Component
        style={style}
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        activeOpacity={0.9}
      >
        {children}
      </Component>
    </Animated.View>
  );
};

export default function ProfileScreen({ onBack }) {
  const { colors, isDark, toggleTheme, setTheme, currentTheme, availableThemes } = useTheme();
  const { user, signOut, updateUserProfile, resetPassword, deleteAccount } = useAuth();
  const {
    currency,
    setCurrency,
    currencies,
    tripHistory,
    deleteTripFromHistory,
  } = useTravelContext();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || '',
    avatar: '👤',
  });
  const [selectedAvatar, setSelectedAvatar] = useState('👤');

  const headerAnim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignOut = async () => {
    try {
      // Sign out from Firebase
      // Note: TravelContext will automatically clear local state and reload data on next login
      await signOut();
      // If successful, RootNavigator will automatically redirect to login
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (editForm.displayName.trim()) {
      const result = await updateUserProfile({
        displayName: editForm.displayName.trim(),
      });
      if (result.success) {
        setShowEditModal(false);
      }
    }
  };

  const handleResetPassword = async () => {
    if (user?.email) {
      await resetPassword(user.email);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteAccount();
      if (result.success) {
        console.log('Account deleted successfully');
        // User will be automatically signed out and redirected
      } else {
        console.error('Delete account failed:', result.error);
      }
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || '?';
  };

  const getMemberSince = () => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
    }
    return 'Recently';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gradient Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setEditForm({ displayName: user?.displayName || '' });
            setShowEditModal(true);
          }}
        >
          <Text style={styles.editButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card with Gradient */}
        <AnimatedCard delay={100}>
          <View style={styles.profileCard}>
            {/* Gradient Background Overlay */}
            <View style={styles.profileGradientOverlay}>
              <View style={[styles.gradientCircle, styles.gradientCircle1]} />
              <View style={[styles.gradientCircle, styles.gradientCircle2]} />
            </View>

            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => setShowAvatarPicker(true)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{selectedAvatar !== '👤' ? selectedAvatar : getInitials()}</Text>
                </View>
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>✏️</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.displayName || 'Traveler'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>🎖️ Member since {getMemberSince()}</Text>
                </View>
              </View>
            </View>

            {/* Verified Badge */}
            {user?.emailVerified && (
              <View style={styles.verifiedContainer}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Email Verified</Text>
              </View>
            )}
          </View>
        </AnimatedCard>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <AnimatedCard delay={200} onPress={() => setShowThemePicker(true)}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#8B5CF640' : '#8B5CF620' }]}>
                  <Text style={styles.settingIcon}>{THEMES[currentTheme]?.icon || '🎨'}</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Theme</Text>
                  <Text style={styles.settingValue}>
                    {THEMES[currentTheme]?.name || 'Dark Green'} - {THEMES[currentTheme]?.description || 'Charcoal & Light Green'}
                  </Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard delay={225} onPress={() => setShowCurrencyPicker(true)}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#10B98140' : '#10B98120' }]}>
                  <Text style={styles.settingIcon}>{currency.flag}</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Currency</Text>
                  <Text style={styles.settingValue}>{currency.name} ({currency.symbol})</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard delay={250}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#F59E0B40' : '#F59E0B20' }]}>
                  <Text style={styles.settingIcon}>🔔</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingValue}>Trip reminders & updates</Text>
                </View>
              </View>
              <Switch
                value={true}
                trackColor={{ false: colors.cardLight, true: colors.primary + '60' }}
                thumbColor={colors.primary}
              />
            </View>
          </AnimatedCard>
        </View>

        {/* Account & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Security</Text>

          <AnimatedCard delay={300} onPress={() => { }}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#6B728040' : '#6B728020' }]}>
                  <Text style={styles.settingIcon}>📋</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Export Data</Text>
                  <Text style={styles.settingValue}>Download your trip data</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard delay={325} onPress={() => { }}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#6B728040' : '#6B728020' }]}>
                  <Text style={styles.settingIcon}>🔒</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                  <Text style={styles.settingValue}>How we handle your data</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <AnimatedCard delay={350} onPress={() => { }}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#06B6D440' : '#06B6D420' }]}>
                  <Text style={styles.settingIcon}>💬</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Help & Support</Text>
                  <Text style={styles.settingValue}>FAQs and contact us</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard delay={375} onPress={() => { }}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#EC489940' : '#EC489920' }]}>
                  <Text style={styles.settingIcon}>⭐</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Rate TripNest</Text>
                  <Text style={styles.settingValue}>Love the app? Leave a review!</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>

          <AnimatedCard delay={400} onPress={handleSignOut}>
            <View style={[styles.settingItem, styles.dangerItem]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#EF444420' }]}>
                  <Text style={styles.settingIcon}>🚪</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Sign Out</Text>
                  <Text style={styles.settingValue}>Sign out of your account</Text>
                </View>
              </View>
              <Text style={[styles.settingArrow, { color: '#EF4444' }]}>›</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard delay={425} onPress={handleDeleteAccount}>
            <View style={[styles.settingItem, styles.dangerItem]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: '#EF444420' }]}>
                  <Text style={styles.settingIcon}>🗑️</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Delete Account</Text>
                  <Text style={styles.settingValue}>Permanently remove your account</Text>
                </View>
              </View>
              <Text style={[styles.settingArrow, { color: '#EF4444' }]}>›</Text>
            </View>
          </AnimatedCard>
        </View>

        {/* App Version */}
        <AnimatedCard delay={450}>
          <View style={styles.footer}>
            <Text style={styles.appLogo}>✈️ TripNest</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.copyright}>Made with ❤️ for travelers</Text>
          </View>
        </AnimatedCard>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.displayName}
                onChangeText={(text) => setEditForm({ ...editForm, displayName: text })}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Email</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{user?.email}</Text>
                <Text style={styles.disabledBadge}>Cannot change</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.currencyList}>
              {currencies?.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyItem,
                    currency?.code === curr.code && styles.currencyItemActive
                  ]}
                  onPress={() => {
                    setCurrency(curr);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={styles.currencyFlag}>{curr.flag}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{curr.code}</Text>
                    <Text style={styles.currencyName}>{curr.name}</Text>
                  </View>
                  <Text style={styles.currencySymbol}>{curr.symbol}</Text>
                  {currency?.code === curr.code && (
                    <View style={styles.currencyCheck}>
                      <Text style={styles.currencyCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar && styles.avatarOptionActive
                  ]}
                  onPress={() => {
                    setSelectedAvatar(avatar);
                    setShowAvatarPicker(false);
                  }}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.themeList}>
              {availableThemes?.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeItem,
                    currentTheme === theme.id && styles.themeItemActive
                  ]}
                  onPress={() => {
                    setTheme(theme.id);
                    setShowThemePicker(false);
                  }}
                >
                  <View style={styles.themeIconContainer}>
                    <Text style={styles.themeIcon}>{theme.icon}</Text>
                  </View>
                  <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>{theme.name}</Text>
                    <Text style={styles.themeDescription}>{theme.description}</Text>
                    <View style={styles.themeColorPreview}>
                      <View style={[styles.colorDot, { backgroundColor: theme.colors.primary }]} />
                      <View style={[styles.colorDot, { backgroundColor: theme.colors.secondary }]} />
                      <View style={[styles.colorDot, { backgroundColor: theme.colors.bg }]} />
                      <View style={[styles.colorDot, { backgroundColor: theme.colors.card }]} />
                    </View>
                  </View>
                  {currentTheme === theme.id && (
                    <View style={styles.themeCheck}>
                      <Text style={styles.themeCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, letterSpacing: 0.5 },
  editButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  editButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Profile Card with Gradient
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: isDark ? colors.primary : '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  gradientCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  gradientCircle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 18,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: colors.bg },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarBadgeText: { fontSize: 13 },
  profileInfo: {
    flex: 1,
  },
  userName: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4, letterSpacing: 0.3 },
  userEmail: { fontSize: 14, color: colors.textMuted, marginBottom: 10 },
  memberBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  memberBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '600', letterSpacing: 0.3 },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#10B98140',
    zIndex: 1,
  },
  verifiedIcon: { color: '#10B981', fontSize: 16, fontWeight: 'bold', marginRight: 6 },
  verifiedText: { color: '#10B981', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 14,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Enhanced Settings Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    ...Platform.select({
      ios: {
        shadowColor: isDark ? colors.primary : '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.12 : 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dangerItem: {
    borderColor: '#EF444430',
    backgroundColor: isDark ? colors.card : '#FEF2F2',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  settingIcon: { fontSize: 22 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  settingValue: { fontSize: 13, color: colors.textMuted },
  settingArrow: { fontSize: 20, color: colors.textMuted, fontWeight: '600' },

  // Trip History Styles
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  historyIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyIcon: { fontSize: 22 },
  historyInfo: { flex: 1 },
  historyDest: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  historyDate: { fontSize: 12, color: colors.textMuted },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyStats: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 16, fontWeight: '700', color: colors.primary },
  deleteHistoryBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  deleteHistoryText: { fontSize: 14, color: colors.textMuted, fontWeight: 'bold' },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  appLogo: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 10, letterSpacing: 0.5 },
  version: { fontSize: 14, color: colors.textMuted, marginBottom: 6, fontWeight: '500' },
  copyright: { fontSize: 12, color: colors.textLight, fontWeight: '400' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalClose: { fontSize: 20, color: colors.textMuted, padding: 4 },
  modalBody: { padding: 20 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.primaryBorder,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8
  },
  modalInput: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  disabledInput: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  disabledInputText: { fontSize: 16, color: colors.textMuted },
  disabledBadge: {
    fontSize: 10,
    color: colors.textLight,
    backgroundColor: colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center'
  },
  modalCancelText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center'
  },
  modalSaveText: { color: colors.bg, fontWeight: 'bold', fontSize: 15 },

  // Currency List
  currencyList: { maxHeight: 400 },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.cardLight,
  },
  currencyItemActive: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary
  },
  currencyFlag: { fontSize: 28, marginRight: 14 },
  currencyInfo: { flex: 1 },
  currencyCode: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  currencyName: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  currencySymbol: { fontSize: 18, fontWeight: 'bold', color: colors.textMuted, marginRight: 10 },
  currencyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  currencyCheckText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  // Avatar Grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  avatarOptionText: { fontSize: 28 },

  // Theme Picker
  themeList: { maxHeight: 500 },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.cardLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeItemActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  themeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  themeIcon: { fontSize: 26 },
  themeInfo: { flex: 1 },
  themeName: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  themeDescription: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  themeColorPreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  themeCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  themeCheckText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
});
