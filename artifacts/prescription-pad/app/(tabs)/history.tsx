import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePrescription } from '@/state/PrescriptionContext';
import { generatePrescriptionPdf, sharePdf } from '@/utils/pdf';

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { doctor, history, setDraft, duplicatePrescription, deletePrescription } = usePrescription();
  const open = (item: (typeof history)[number]) => { setDraft(item); router.replace('/'); };
  const share = async (item: (typeof history)[number]) => { const uri = await generatePrescriptionPdf(doctor, item); await sharePdf(uri); };
  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>LOCAL HISTORY</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>Previous prescriptions</Text>
    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Saved only on this device.</Text>
    {history.length === 0 ? <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name="file-text" size={22} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No prescriptions yet</Text><Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>Your generated prescriptions will appear here for quick editing and duplication.</Text></View> : history.map((item) => <View key={item.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.itemTop}><View style={{ flex: 1 }}><Text style={[styles.patient, { color: colors.foreground }]}>{item.patientName || 'Unnamed patient'}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.date}{item.patientId ? `  ·  ${item.patientId}` : ''}</Text></View><Text style={[styles.count, { color: colors.primary }]}>{item.medicines.length} meds</Text></View><View style={styles.itemActions}><Pressable onPress={() => open(item)}><Feather name="edit-2" size={16} color={colors.primary} /><Text style={[styles.action, { color: colors.primary }]}>Open</Text></Pressable><Pressable onPress={() => { duplicatePrescription(item); router.replace('/'); }}><Feather name="copy" size={16} color={colors.primary} /><Text style={[styles.action, { color: colors.primary }]}>Duplicate</Text></Pressable><Pressable onPress={() => share(item)}><Feather name="share-2" size={16} color={colors.primary} /><Text style={[styles.action, { color: colors.primary }]}>PDF</Text></Pressable><Pressable onPress={() => Alert.alert('Delete prescription?', 'This removes it from local history.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deletePrescription(item.id) }])}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable></View></View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 6 },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, marginTop: 7, marginBottom: 24 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 12 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyCopy: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  item: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 11 },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start' },
  patient: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 5 },
  count: { fontSize: 12, fontWeight: '700' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 17, marginTop: 16 },
  action: { fontSize: 12, fontWeight: '700', marginLeft: 5 },
});