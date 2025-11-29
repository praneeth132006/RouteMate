import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'trip', label: 'Trip', icon: '✈️' },
  { key: 'history', label: 'History', icon: '📜' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

export default function FloatingFooter({ activeTab, onTabPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.footer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[styles.tab, isActive && styles.tabActive]} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
              <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}><Text style={styles.icon}>{tab.icon}</Text></View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  footer: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 24, padding: 8, borderWidth: 1, borderColor: colors.primaryBorder, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 18 },
  tabActive: { backgroundColor: colors.primaryMuted },
  iconContainer: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconContainerActive: { backgroundColor: colors.primary },
  icon: { fontSize: 20 },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  labelActive: { color: colors.primary, fontWeight: '600' },
});
