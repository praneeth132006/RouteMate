import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DatePickerModal({ visible, onClose, onSelect, selectedDate, title }) {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null, key: `empty-${i}` });
    for (let day = 1; day <= daysInMonth; day++) days.push({ day, key: `day-${day}`, date: new Date(year, month, day) });
    return days;
  };

  const changeMonth = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setViewDate(newDate);
  };

  const handleDayPress = (date) => setCurrentDate(date);

  const handleConfirm = () => {
    const formatted = `${currentDate.getDate()} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    onSelect(formatted);
    onClose();
  };

  const isSelected = (date) => date && currentDate && date.toDateString() === currentDate.toDateString();
  const isToday = (date) => date && date.toDateString() === new Date().toDateString();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}><Text style={styles.title}>{title || 'Select Date'}</Text><TouchableOpacity onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></TouchableOpacity></View>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}><Text style={styles.navButtonText}>←</Text></TouchableOpacity>
            <Text style={styles.monthText}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}><Text style={styles.navButtonText}>→</Text></TouchableOpacity>
          </View>
          <View style={styles.dayHeaders}>{DAYS.map((day) => <Text key={day} style={styles.dayHeader}>{day}</Text>)}</View>
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((item) => (
              <TouchableOpacity key={item.key} style={[styles.dayCell, isSelected(item.date) && styles.dayCellSelected, isToday(item.date) && styles.dayCellToday]} onPress={() => item.day && handleDayPress(item.date)} disabled={!item.day}>
                {item.day && <Text style={[styles.dayText, isSelected(item.date) && styles.dayTextSelected, isToday(item.date) && styles.dayTextToday]}>{item.day}</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.selectedDisplay}><Text style={styles.selectedLabel}>Selected</Text><Text style={styles.selectedDate}>{currentDate.getDate()} {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</Text></View>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}><Text style={styles.confirmText}>Confirm Date</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: colors.primaryBorder },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textMuted, fontSize: 28 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  navButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  navButtonText: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  monthText: { color: colors.text, fontSize: 18, fontWeight: '600' },
  dayHeaders: { flexDirection: 'row', marginBottom: 10 },
  dayHeader: { flex: 1, textAlign: 'center', color: colors.primary, fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  dayCellSelected: { backgroundColor: colors.primary },
  dayCellToday: { borderWidth: 2, borderColor: colors.primaryBorder },
  dayText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  dayTextSelected: { color: colors.bg, fontWeight: 'bold' },
  dayTextToday: { color: colors.primary },
  selectedDisplay: { marginTop: 20, alignItems: 'center', padding: 16, backgroundColor: colors.primaryMuted, borderRadius: 16, borderWidth: 1, borderColor: colors.primaryBorder },
  selectedLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  selectedDate: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  confirmButton: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  confirmText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
});
