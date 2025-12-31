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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTravelContext } from '../context/TravelContext';
import Icon from '../components/Icon';

const AVATARS = [
  'profile_avatar', 'man1', 'woman1', 'man2', 'woman2', 'man3', 'woman3',
  'boy', 'girl', 'boy_1', 'girl_1', 'boy_2', 'girl_2', 'man_1', 'woman_1',
  'man_2', 'woman_2', 'user_circle'
];
const TRIP_TYPES = [
  { key: 'solo', label: 'Solo Trip', icon: 'solo', color: '#3B82F6' },
  { key: 'friends', label: 'With Friends', icon: 'friends', color: '#10B981' },
  { key: 'family', label: 'Family Trip', icon: 'family', color: '#F59E0B' },
  { key: 'couple', label: 'Couple Trip', icon: 'couple', color: '#EC4899' },
  { key: 'business', label: 'Business Trip', icon: 'business', color: '#8B5CF6' },
];

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

export default function ProfileScreen({ onBack, onOpenTrip }) {
  const { colors, isDark, toggleTheme, setTheme, currentTheme, availableThemes } = useTheme();
  const { user, signOut, updateUserProfile, resetPassword, deleteAccount } = useAuth();
  const {
    currency,
    setCurrency,
    currencies,
    tripHistory,
    allTrips,
    deleteTripFromHistory,
    switchToTrip,
  } = useTravelContext();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || '',
    avatar: 'profile',
  });
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || 'profile_avatar');

  // Update selected avatar when user profile loads/changes
  useEffect(() => {
    if (user?.photoURL) {
      setSelectedAvatar(user.photoURL);
    }
  }, [user?.photoURL]);

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
        photoURL: selectedAvatar,
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

  const calculateTripDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    try {
      const parts1 = startDate.split(' ');
      const parts2 = endDate.split(' ');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const start = new Date(parseInt(parts1[2]), months.indexOf(parts1[1]), parseInt(parts1[0]));
      const end = new Date(parseInt(parts2[2]), months.indexOf(parts2[1]), parseInt(parts2[0]));
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  const getTripTypeIcon = (type) => {
    const found = TRIP_TYPES.find(t => t.key === type);
    return found ? found.icon : 'packing';
  };

  const handleTripPress = async (trip) => {
    try {
      if (switchToTrip) {
        await switchToTrip(trip);
      }
      setShowHistoryModal(false);
      if (onOpenTrip) {
        onOpenTrip(trip);
      }
    } catch (error) {
      console.error('Error opening trip:', error);
      Alert.alert('Error', 'Could not open trip details.');
    }
  };

  const renderTripListModal = (visible, setVisible, title, trips, emptyMessage, emptyEmoji) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%', height: '90%' }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>{trips.length} adventures</Text>
            </View>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {trips.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Icon name="beach" size={40} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyHistoryText}>{emptyMessage}</Text>
              </View>
            ) : (
              trips.map((trip, index) => {
                const days = calculateTripDays(trip.startDate, trip.endDate);
                return (
                  <TouchableOpacity
                    key={trip.id || index}
                    style={styles.historyCard}
                    activeOpacity={0.7}
                    onPress={() => handleTripPress(trip)}
                  >
                    <View style={styles.historyCardLeft}>
                      <View style={[styles.historyIconContainer, { backgroundColor: isDark ? colors.cardLight : '#F3F4F6' }]}>
                        <Icon name={trip.tripType === 'profile' ? 'solo' : (trip.tripType === 'group' ? 'friends' : (trip.tripType || 'solo'))} size={24} color={colors.primary} />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyDestination}>{trip.destination || trip.name}</Text>
                        <Text style={styles.historyDates}>
                          {trip.startDate} • {days} days
                        </Text>
                        {trip.tripCode && (
                          <Text style={styles.historyCode}>Code: <Text style={{ fontWeight: '700' }}>{trip.tripCode}</Text></Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.historyCardRight}>
                      <TouchableOpacity style={styles.syncButton}>
                        <View style={styles.syncIconContainer}>
                          <Icon name="message" size={16} color={colors.primary} />
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.historyArrow}>→</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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
          <Icon name="back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setEditForm({ displayName: user?.displayName || '' });
            setShowEditModal(true);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="edit" size={16} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.editButtonText}>Edit</Text>
          </View>
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
                  <Icon name={selectedAvatar} size={40} color={colors.primary} />
                </View>
                <View style={styles.avatarBadge}>
                  <Icon name="edit" size={12} color="#FFF" />
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.displayName || 'Traveler'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>

            {/* Verified Badge */}
            {user?.emailVerified && (
              <View style={styles.verifiedContainer}>
                <Icon name="location" size={14} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedText}>Email Verified</Text>
              </View>
            )}
          </View>
        </AnimatedCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Management</Text>

          <AnimatedCard delay={150} onPress={() => setShowHistoryModal(true)}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#3B82F640' : '#3B82F620' }]}>
                  <Icon name="clock" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Trip History</Text>
                  <Text style={styles.settingValue}>View your completed adventures</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <AnimatedCard delay={200} onPress={() => setShowThemePicker(true)}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#8B5CF640' : '#8B5CF620' }]}>
                  <Icon name="settings" size={20} color="#8B5CF6" />
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
                  <Icon name="money" size={20} color="#10B981" />
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
                  <Icon name="notification" size={20} color="#F59E0B" />
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


          <AnimatedCard delay={325} onPress={() => Linking.openURL('https://sites.google.com/view/routemate-privacy-policy/home')}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#6B728040' : '#6B728020' }]}>
                  <Icon name="lock" size={20} color="#6B7280" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                  <Text style={styles.settingValue}>How we handle your data</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard delay={335} onPress={() => Linking.openURL('https://sites.google.com/view/routemate-terms-and-conditions/home')}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBg, { backgroundColor: isDark ? '#6B728040' : '#6B728020' }]}>
                  <Icon name="link" size={20} color="#6B7280" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Terms and Conditions</Text>
                  <Text style={styles.settingValue}>Rules for using RouteMate</Text>
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
                  <Icon name="message" size={20} color="#06B6D4" />
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
                  <Icon name="heart" size={20} color="#EC4899" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Rate RouteMate</Text>
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
                  <Icon name="logout" size={20} color="#EF4444" />
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
                  <Icon name="delete" size={20} color="#EF4444" />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Icon name="route" size={24} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.appLogo}>RouteMate</Text>
            </View>
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
                  onPress={async () => {
                    setSelectedAvatar(avatar);
                    setShowAvatarPicker(false);
                    // Also fire update immediately to persist
                    await updateUserProfile({
                      displayName: user?.displayName || '',
                      photoURL: avatar
                    });
                  }}
                >
                  <Icon name={avatar} size={32} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%', height: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.themeList} showsVerticalScrollIndicator={false}>
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

      {renderTripListModal(
        showHistoryModal,
        setShowHistoryModal,
        'Trip History',
        tripHistory,
        'No completed trips yet.',
        '🏝️'
      )}
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
    backgroundColor: isDark ? colors.primary + '30' : colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: isDark ? colors.primary + '40' : colors.primaryBorder,
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

  // History Modal Styles
  historyList: { padding: 4 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? '#374151' : '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  historyCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  historyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyIcon: { fontSize: 32 },
  historyInfo: { flex: 1 },
  historyDestination: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  historyDates: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  historyCode: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  historyCardRight: { flexDirection: 'row', alignItems: 'center' },
  historyArrow: { fontSize: 22, color: colors.textMuted, marginLeft: 12 },
  syncButton: {
    padding: 8,
  },
  syncIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncIcon: { fontSize: 18 },
  emptyHistory: { alignItems: 'center', paddingVertical: 60 },
  emptyHistoryEmoji: { fontSize: 64, marginBottom: 16 },
  emptyHistoryText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptyHistorySubtext: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  modalSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

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
    outlineStyle: 'none',
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
    backgroundColor: isDark ? colors.primary + '20' : '#F3F4F6',
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
