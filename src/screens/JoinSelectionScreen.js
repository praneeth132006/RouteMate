import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTravelContext } from '../context/TravelContext';

export default function JoinSelectionScreen({ trip, onBack, onJoinComplete }) {
    const { colors, isDark } = useTheme();
    const { joinTripByCode, joinAsNewTraveler, isLoading } = useTravelContext();

    const [selectedParticipantId, setSelectedParticipantId] = useState(null);
    const [joiningAsNew, setJoiningAsNew] = useState(false);
    const [newTravelerName, setNewTravelerName] = useState('');

    const handleConfirmJoin = async () => {
        if (joiningAsNew) {
            if (!newTravelerName.trim()) {
                Alert.alert('Required', 'Please enter your name');
                return;
            }
            const result = await joinAsNewTraveler(trip, newTravelerName);
            if (result.success) {
                onJoinComplete(result.trip);
            } else {
                Alert.alert('Error', result.error || 'Failed to join trip');
            }
        } else if (selectedParticipantId) {
            const result = await joinTripByCode(trip.tripCode, selectedParticipantId);
            if (result.success) {
                onJoinComplete(result.trip);
            } else {
                Alert.alert('Error', result.error || 'Failed to join trip');
            }
        } else {
            Alert.alert('Selection Required', 'Please select who you are or join as a new traveler');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Identity Selection</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconBg, { backgroundColor: colors.primaryMuted }]}>
                        <Text style={styles.icon}>👤</Text>
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Who are you?</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Select your name from the travelers list or join as a new person
                </Text>

                <View style={styles.listContainer}>
                    {/* Join as New Option */}
                    <Pressable
                        style={[
                            styles.card,
                            { backgroundColor: colors.card, borderColor: colors.primaryBorder },
                            joiningAsNew && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                        ]}
                        onPress={() => {
                            setJoiningAsNew(true);
                            setSelectedParticipantId(null);
                        }}
                    >
                        <View style={styles.cardContent}>
                            <Text style={styles.cardEmoji}>✨</Text>
                            <Text style={[styles.cardName, { color: colors.text }]}>Join as new traveler</Text>
                        </View>
                        {joiningAsNew && <View style={[styles.radioActive, { backgroundColor: colors.primary }]} />}
                    </Pressable>

                    {joiningAsNew && (
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.primaryBorder }]}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.textMuted}
                            value={newTravelerName}
                            onChangeText={setNewTravelerName}
                            autoFocus
                        />
                    )}

                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.primaryBorder }]} />
                        <Text style={[styles.dividerText, { color: colors.textMuted }]}>Existing Travelers</Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.primaryBorder }]} />
                    </View>

                    {/* Existing Participants */}
                    {trip?.participants?.map((p) => {
                        const isClaimed = !!p.userId;
                        const isSelected = selectedParticipantId === p.id;

                        return (
                            <Pressable
                                key={p.id}
                                style={[
                                    styles.card,
                                    { backgroundColor: colors.card, borderColor: colors.primaryBorder },
                                    isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                                    isClaimed && { opacity: 0.5, backgroundColor: colors.bg }
                                ]}
                                onPress={() => {
                                    if (!isClaimed) {
                                        setSelectedParticipantId(p.id);
                                        setJoiningAsNew(false);
                                    } else {
                                        Alert.alert('Already Claimed', `${p.name} is already taken by another user.`);
                                    }
                                }}
                                disabled={isClaimed}
                            >
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardEmoji}>👤</Text>
                                    <View>
                                        <Text style={[styles.cardName, { color: colors.text }]}>{p.name}</Text>
                                        {isClaimed && <Text style={[styles.statusText, { color: colors.textMuted }]}>Occupied</Text>}
                                    </View>
                                </View>
                                {isSelected && <View style={[styles.radioActive, { backgroundColor: colors.primary }]} />}
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.primaryBorder }]}>
                <Pressable
                    style={[
                        styles.joinButton,
                        { backgroundColor: colors.primary },
                        (!selectedParticipantId && !joiningAsNew) && { opacity: 0.5 }
                    ]}
                    onPress={handleConfirmJoin}
                    disabled={(!selectedParticipantId && !joiningAsNew) || isLoading}
                >
                    <Text style={styles.joinButtonText}>{isLoading ? 'Joining...' : 'Confirm & Join Trip'}</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 5 },
    backButtonText: { fontSize: 16, fontWeight: '600' },
    content: { padding: 24, paddingBottom: 100 },
    iconContainer: { alignItems: 'center', marginBottom: 24 },
    iconBg: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    icon: { fontSize: 40 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
    listContainer: { width: '100%' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        marginBottom: 12
    },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    cardEmoji: { fontSize: 24, marginRight: 16 },
    cardName: { fontSize: 18, fontWeight: 'bold' },
    radioActive: { width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: '#FFFFFF' },
    statusText: { fontSize: 12, marginTop: 2 },
    input: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        fontSize: 16,
        marginBottom: 20
    },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 16, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1
    },
    joinButton: {
        width: '100%',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center'
    },
    joinButtonText: { color: '#000000', fontSize: 18, fontWeight: 'bold' }
});
