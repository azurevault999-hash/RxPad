import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import { usePrescription } from '@/state/PrescriptionContext';
import { DoctorProfile } from '@/types/prescription';

function ProfileField({ label, value, onChangeText, placeholder, multiline }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }, multiline && styles.multiline]} /></View>;
}

export default function SettingsScreen() {
  const colors = useColors();
  const { doctor, setDoctor } = usePrescription();
  const [form, setForm] = useState<DoctorProfile>(doctor);
  const update = <K extends keyof DoctorProfile>(key: K, value: DoctorProfile[K]) => setForm((current) => ({ ...current, [key]: value }));
  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) update('logoUri', result.assets[0].uri);
  };
  const save = async () => { await setDoctor(form); Alert.alert('Profile saved', 'These details will appear on new prescriptions.'); };
  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>PROFILE & TEMPLATE</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>Your prescription header</Text>
    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Set this up once. It stays on this device and automatically populates the A4 document.</Text>
    <Pressable onPress={pickLogo} style={[styles.logoPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>{form.logoUri ? <Image source={{ uri: form.logoUri }} style={styles.logo} /> : <View style={[styles.logoPlaceholder, { backgroundColor: colors.secondary }]}><Feather name="image" size={22} color={colors.primary} /></View>}<View style={{ flex: 1 }}><Text style={[styles.logoTitle, { color: colors.foreground }]}>{form.logoUri ? 'Change clinic logo' : 'Add clinic logo'}</Text><Text style={[styles.logoHint, { color: colors.mutedForeground }]}>Optional · appears in the header</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Professional details</Text><ProfileField label="Doctor name" value={form.name} onChangeText={(value) => update('name', value)} placeholder="e.g. Dr. Riya Mehta" /><View style={styles.row}><View style={styles.half}><ProfileField label="Qualifications" value={form.qualifications} onChangeText={(value) => update('qualifications', value)} placeholder="MBBS, MD" /></View><View style={styles.half}><ProfileField label="Specialty" value={form.specialty} onChangeText={(value) => update('specialty', value)} placeholder="General Medicine" /></View></View><ProfileField label="Medical registration / licence number" value={form.registrationNumber} onChangeText={(value) => update('registrationNumber', value)} placeholder="Registration number" /></View>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Clinic details</Text><ProfileField label="Clinic / hospital name" value={form.clinicName} onChangeText={(value) => update('clinicName', value)} placeholder="Clinic name" /><ProfileField label="Address" value={form.address} onChangeText={(value) => update('address', value)} placeholder="Full address" multiline /><View style={styles.row}><View style={styles.half}><ProfileField label="Phone" value={form.phone} onChangeText={(value) => update('phone', value)} placeholder="Phone" /></View><View style={styles.half}><ProfileField label="Email" value={form.email} onChangeText={(value) => update('email', value)} placeholder="Email" /></View></View></View>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Footer</Text><ProfileField label="Optional footer text" value={form.footerText} onChangeText={(value) => update('footerText', value)} placeholder="Footer shown on each PDF" multiline /></View>
    <Pressable onPress={save} style={[styles.saveButton, { backgroundColor: colors.primary }]}><Feather name="check" size={18} color={colors.primaryForeground} /><Text style={[styles.saveText, { color: colors.primaryForeground }]}>Save profile</Text></Pressable>
    <View style={[styles.privacy, { backgroundColor: colors.secondary }]}><Feather name="shield" size={17} color={colors.primary} /><Text style={[styles.privacyText, { color: colors.secondaryForeground }]}>Private by default. Doctor and patient data stays on this device. No account or cloud sync is required.</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 6 },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 22 },
  logoPicker: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 25 },
  logo: { width: 52, height: 52, borderRadius: 13 },
  logoPlaceholder: { width: 52, height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  logoTitle: { fontSize: 14, fontWeight: '700' },
  logoHint: { fontSize: 11, marginTop: 4 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  field: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 11, minHeight: 46, paddingHorizontal: 13, fontSize: 14 },
  multiline: { minHeight: 72, paddingTop: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  saveButton: { minHeight: 52, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveText: { fontSize: 15, fontWeight: '700' },
  privacy: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 13, borderRadius: 13, marginTop: 16 },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
});