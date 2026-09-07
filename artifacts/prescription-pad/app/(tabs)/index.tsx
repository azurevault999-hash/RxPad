import React, { useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { A4Preview } from '@/components/A4Preview';
import { useColors } from '@/hooks/useColors';
import { useMedicineCatalogSearch } from '@/hooks/useMedicineCatalogSearch';
import { usePrescription } from '@/state/PrescriptionContext';
import { MedicineCatalogItem, newMedication, PrescriptionMedication, Sex } from '@/types/prescription';
import { generatePrescriptionPdf, printPdf, savePdf, sharePdf } from '@/utils/pdf';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
};

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType = 'default' }: FieldProps) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }, multiline && styles.multiline]}
      />
    </View>
  );
}

function SelectChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.accent : colors.card }]}><Text style={{ color: selected ? colors.primary : colors.mutedForeground, fontWeight: '600', fontSize: 13 }}>{label}</Text></Pressable>;
}

export default function WritePrescriptionScreen() {
  const colors = useColors();
  const { doctor, draft, setDraft, savePrescription, resetDraft } = usePrescription();
  const [editingMedication, setEditingMedication] = useState<PrescriptionMedication | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const { results: catalogResults, loading: catalogLoading } = useMedicineCatalogSearch(catalogQuery);

  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateMedication = <K extends keyof PrescriptionMedication>(key: K, value: PrescriptionMedication[K]) => setEditingMedication((current) => current ? { ...current, [key]: value } : current);
  const startNewMedication = () => {
    setCatalogQuery('');
    setEditingMedication(newMedication());
  };
  const startEditMedication = (medication: PrescriptionMedication) => {
    setCatalogQuery('');
    setEditingMedication({ ...medication });
  };
  const closeMedicationEditor = () => {
    setCatalogQuery('');
    setEditingMedication(null);
  };
  const applyCatalogResult = (item: MedicineCatalogItem) => {
    setEditingMedication((current) => current ? {
      ...current,
      medicineName: item.medicineName,
      composition: item.composition,
      strength: item.strength,
      dosageForm: item.dosageForm,
      route: item.route,
      catalogBrandIdentifier: item.catalogBrandIdentifier,
      catalogProductIdentifier: item.catalogProductIdentifier,
      catalogGenericIdentifier: item.catalogGenericIdentifier,
    } : current);
    setCatalogQuery('');
    Haptics.selectionAsync();
  };
  const addOrUpdateMedication = () => {
    if (!editingMedication?.medicineName.trim()) {
      Alert.alert('Medicine name needed', 'Enter the medicine name to add it to the prescription.');
      return;
    }
    setDraft((current) => {
      const exists = current.medicines.some((item) => item.id === editingMedication.id);
      return {
        ...current,
        medicines: exists
          ? current.medicines.map((item) => item.id === editingMedication.id ? editingMedication : item)
          : [...current.medicines, editingMedication],
      };
    });
    setCatalogQuery('');
    setEditingMedication(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  const saveAndPreview = async () => {
    if (!draft.patientName.trim()) {
      Alert.alert('Patient name needed', 'Add the patient name before previewing.');
      return;
    }
    if (!draft.medicines.length) {
      Alert.alert('Add a medicine', 'Add at least one medicine to continue.');
      return;
    }
    await savePrescription(draft);
    setShowPreview(true);
  };
  const createPdf = async (mode: 'share' | 'save' | 'print') => {
    try {
      setBusy(true);
      const uri = await generatePrescriptionPdf(doctor, draft);
      if (mode === 'share') await sharePdf(uri);
      if (mode === 'save') {
        await savePdf(uri, draft.id);
        Alert.alert('Saved on this device', 'A copy is stored in the app documents folder.');
      }
      if (mode === 'print') await printPdf(uri);
    } catch {
      Alert.alert('Could not create PDF', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} bottomOffset={24} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>PRESCRIPTION PAD</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Write a prescription</Text>
          </View>
          <Pressable onPress={() => { resetDraft(); setEditingMedication(null); }} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="plus" size={20} color={colors.primary} /></Pressable>
        </View>
        {!doctor.name ? <View style={[styles.setupNotice, { backgroundColor: colors.secondary }]}><Feather name="user" size={18} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>Set up your doctor profile once to populate every prescription.</Text></View> : null}

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Patient details</Text><Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>{draft.date}</Text></View>
        <View style={styles.card}>
          <Field label="Patient name" value={draft.patientName} onChangeText={(value) => update('patientName', value)} placeholder="e.g. Ananya Sharma" />
          <View style={styles.row}><View style={styles.half}><Field label="Age" value={draft.age} onChangeText={(value) => update('age', value)} placeholder="Years" keyboardType="numeric" /></View><View style={styles.half}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Sex</Text><View style={styles.chipRow}>{(['Male', 'Female', 'Other'] as Sex[]).map((sex) => <SelectChip key={sex} label={sex} selected={draft.sex === sex} onPress={() => update('sex', sex)} />)}</View></View></View>
          <Field label="Patient ID / UHID (optional)" value={draft.patientId} onChangeText={(value) => update('patientId', value)} placeholder="Optional" />
        </View>

        <Pressable onPress={() => setShowMore((value) => !value)} style={styles.optionalToggle}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Clinical details</Text><Feather name={showMore ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} /></Pressable>
        {showMore ? <View style={styles.card}><Field label="Diagnosis" value={draft.diagnosis} onChangeText={(value) => update('diagnosis', value)} placeholder="Optional" /><Field label="Clinical notes" value={draft.clinicalNotes} onChangeText={(value) => update('clinicalNotes', value)} placeholder="Optional" multiline /><Field label="Advice" value={draft.advice} onChangeText={(value) => update('advice', value)} placeholder="Optional" multiline /><Field label="Follow-up" value={draft.followUp} onChangeText={(value) => update('followUp', value)} placeholder="e.g. Review after 5 days" /></View> : null}

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Medicines</Text><Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>{draft.medicines.length} added</Text></View>
        <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Search the local medicine catalogue or enter a custom medicine. Every field can be edited.</Text>
        {editingMedication ? <View style={[styles.medicineEditor, { backgroundColor: colors.secondary }]}>
          <View style={styles.editorTitleRow}><View style={{ flex: 1 }}><Text style={[styles.editorName, { color: colors.foreground }]}>{editingMedication.id ? (draft.medicines.some((item) => item.id === editingMedication.id) ? 'Edit medicine' : 'New medicine') : 'New medicine'}</Text><Text style={[styles.suggestionMeta, { color: colors.mutedForeground }]}>Enter the details you want printed</Text></View><Pressable onPress={closeMedicationEditor}><Feather name="x" size={19} color={colors.mutedForeground} /></Pressable></View>
          <Field label="Medicine name" value={editingMedication.medicineName} onChangeText={(value) => { updateMedication('medicineName', value); setCatalogQuery(value); }} placeholder="Search or enter a medicine" />
          {catalogQuery.trim().length >= 2 ? <View style={[styles.catalogPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.catalogPanelHeader}><Text style={[styles.catalogPanelTitle, { color: colors.foreground }]}>Medicine catalogue</Text>{catalogLoading ? <Text style={[styles.suggestionMeta, { color: colors.mutedForeground }]}>Searching…</Text> : null}</View>
            {!catalogLoading && !catalogResults.length ? <Text style={[styles.catalogEmpty, { color: colors.mutedForeground }]}>No catalogue match. You can keep entering a custom medicine.</Text> : null}
            {catalogResults.map((item) => <Pressable key={item.id} onPress={() => applyCatalogResult(item)} style={[styles.catalogResult, { borderTopColor: colors.border }]}>
              <Text style={[styles.catalogResultName, { color: colors.foreground }]} numberOfLines={2}>{item.brandName || item.medicineName}</Text>
              <Text style={[styles.suggestionMeta, { color: colors.mutedForeground }]} numberOfLines={2}>{[item.productName, item.genericName, item.dosageForm].filter(Boolean).join('  · ')}</Text>
            </Pressable>)}
          </View> : null}
          <Field label="Composition / generic" value={editingMedication.composition} onChangeText={(value) => updateMedication('composition', value)} placeholder="e.g. Amoxicillin + Clavulanic Acid" />
          <View style={styles.row}><View style={styles.half}><Field label="Strength" value={editingMedication.strength} onChangeText={(value) => updateMedication('strength', value)} placeholder="e.g. 500 mg" /></View><View style={styles.half}><Field label="Dosage form" value={editingMedication.dosageForm} onChangeText={(value) => updateMedication('dosageForm', value)} placeholder="Tablet" /></View></View>
          <View style={styles.row}><View style={styles.half}><Field label="Dose" value={editingMedication.dose} onChangeText={(value) => updateMedication('dose', value)} placeholder="1" /></View><View style={styles.half}><Field label="Dose unit" value={editingMedication.doseUnit} onChangeText={(value) => updateMedication('doseUnit', value)} placeholder="tablet" /></View></View>
          <View style={styles.row}><View style={styles.half}><Field label="Frequency" value={editingMedication.frequency} onChangeText={(value) => updateMedication('frequency', value)} placeholder="TDS" /></View><View style={styles.half}><Field label="Route" value={editingMedication.route} onChangeText={(value) => updateMedication('route', value)} placeholder="Oral" /></View></View>
          <View style={styles.row}><View style={styles.half}><Field label="Duration" value={editingMedication.duration} onChangeText={(value) => updateMedication('duration', value)} placeholder="5" keyboardType="numeric" /></View><View style={styles.half}><Field label="Duration unit" value={editingMedication.durationUnit} onChangeText={(value) => updateMedication('durationUnit', value)} placeholder="days" /></View></View>
          <View style={styles.row}><View style={styles.half}><Field label="Quantity" value={editingMedication.quantity} onChangeText={(value) => updateMedication('quantity', value)} placeholder="15" keyboardType="numeric" /></View><View style={styles.half}><View /></View></View>
          <Field label="Instructions" value={editingMedication.instructions} onChangeText={(value) => updateMedication('instructions', value)} placeholder="After food" multiline />
          <Pressable onPress={addOrUpdateMedication} style={[styles.addButton, { backgroundColor: colors.primary }]}><Feather name="check" size={18} color={colors.primaryForeground} /><Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>{draft.medicines.some((item) => item.id === editingMedication.id) ? 'Save medicine' : 'Add medicine'}</Text></Pressable>
        </View> : <Pressable onPress={startNewMedication} style={[styles.startMedicineButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="plus-circle" size={19} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.startMedicineTitle, { color: colors.foreground }]}>Add a medicine</Text><Text style={[styles.suggestionMeta, { color: colors.mutedForeground }]}>Type it in manually</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>}

        {draft.medicines.map((medicine, index) => <View key={`${medicine.id}-${index}`} style={[styles.medicineCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.medicineCardTop}><View style={{ flex: 1 }}><Text style={[styles.medicineCardName, { color: colors.foreground }]}>{medicine.medicineName}</Text><Text style={[styles.suggestionMeta, { color: colors.mutedForeground }]}>{[medicine.composition, medicine.strength, medicine.dosageForm].filter(Boolean).join('  ·  ') || 'Composition not entered'}</Text></View><Pressable onPress={() => setDraft((current) => ({ ...current, medicines: current.medicines.filter((_, itemIndex) => itemIndex !== index) }))}><Feather name="trash-2" size={17} color={colors.destructive} /></Pressable></View><Text style={[styles.medicineSummary, { color: colors.primary }]}>{[[medicine.dose, medicine.doseUnit].filter(Boolean).join(' '), medicine.frequency, [medicine.duration, medicine.durationUnit].filter(Boolean).join(' '), medicine.route, medicine.quantity ? `Qty ${medicine.quantity}` : ''].filter(Boolean).join('  ·  ')}</Text>{medicine.instructions ? <Text style={[styles.suggestionMeta, { color: colors.mutedForeground }]}>{medicine.instructions}</Text> : null}<View style={styles.cardActions}><Pressable onPress={() => startEditMedication(medicine)}><Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text></Pressable><Pressable onPress={() => setDraft((current) => ({ ...current, medicines: [...current.medicines.slice(0, index + 1), { ...medicine, id: `${medicine.id}-copy-${Date.now()}` }, ...current.medicines.slice(index + 1)] }))}><Text style={[styles.actionText, { color: colors.primary }]}>Duplicate</Text></Pressable><Pressable disabled={index === 0} onPress={() => setDraft((current) => { const medicines = [...current.medicines]; [medicines[index - 1], medicines[index]] = [medicines[index], medicines[index - 1]]; return { ...current, medicines }; })}><Feather name="chevron-up" size={17} color={index === 0 ? colors.border : colors.primary} /></Pressable><Pressable disabled={index === draft.medicines.length - 1} onPress={() => setDraft((current) => { const medicines = [...current.medicines]; [medicines[index], medicines[index + 1]] = [medicines[index + 1], medicines[index]]; return { ...current, medicines }; })}><Feather name="chevron-down" size={17} color={index === draft.medicines.length - 1 ? colors.border : colors.primary} /></Pressable></View></View>)}
        <Pressable onPress={saveAndPreview} style={[styles.previewButton, { backgroundColor: colors.primary }]}><Feather name="file-text" size={19} color={colors.primaryForeground} /><Text style={[styles.previewButtonText, { color: colors.primaryForeground }]}>Preview prescription</Text></Pressable>
        <View style={{ height: 24 }} />
      </KeyboardAwareScrollViewCompat>

      <Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <View style={[styles.previewScreen, { backgroundColor: colors.background }]}>
          <View style={styles.previewHeader}><Pressable onPress={() => setShowPreview(false)} style={styles.backButton}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable><View style={{ flex: 1 }}><Text style={[styles.previewTitle, { color: colors.foreground }]}>A4 preview</Text><Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Print-ready document</Text></View><Feather name="check-circle" size={20} color={colors.primary} /></View>
          <ScrollView contentContainerStyle={styles.previewContent}><A4Preview doctor={doctor} draft={draft} /><Text style={[styles.previewNote, { color: colors.mutedForeground }]}>The final PDF uses a true A4 page with print margins, not a screenshot of this editor.</Text></ScrollView>
          <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}><Pressable disabled={busy} onPress={() => createPdf('save')} style={[styles.actionButton, { borderColor: colors.border }]}><Feather name="download" size={18} color={colors.primary} /><Text style={[styles.actionButtonText, { color: colors.foreground }]}>Save</Text></Pressable><Pressable disabled={busy} onPress={() => createPdf('share')} style={[styles.actionButton, { backgroundColor: colors.primary }]}><Feather name="share-2" size={18} color={colors.primaryForeground} /><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>Share PDF</Text></Pressable><Pressable disabled={busy} onPress={() => createPdf('print')} style={[styles.printButton, { backgroundColor: colors.secondary }]}><Feather name="printer" size={19} color={colors.primary} /></Pressable></View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 6 },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14 },
  setupNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 13, marginBottom: 22 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { fontSize: 12 },
  card: { backgroundColor: 'transparent', marginBottom: 17 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, letterSpacing: 0.2 },
  input: { borderWidth: 1, borderRadius: 11, minHeight: 46, paddingHorizontal: 13, fontSize: 15 },
  multiline: { minHeight: 74, paddingTop: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 11 },
  optionalToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, marginBottom: 7 },
  helperText: { fontSize: 12, marginBottom: 10 },
  startMedicineButton: { borderWidth: 1, borderRadius: 15, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  startMedicineTitle: { fontSize: 14, fontWeight: '700' },
  suggestionMeta: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  medicineEditor: { marginTop: 4, padding: 14, borderRadius: 16 },
  editorTitleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  editorName: { fontSize: 15, fontWeight: '700' },
  catalogPanel: { borderWidth: 1, borderRadius: 12, marginTop: -4, marginBottom: 12, overflow: 'hidden' },
  catalogPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9 },
  catalogPanelTitle: { fontSize: 12, fontWeight: '700' },
  catalogEmpty: { fontSize: 12, lineHeight: 17, paddingHorizontal: 12, paddingBottom: 11 },
  catalogResult: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  catalogResultName: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  addButton: { minHeight: 47, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 2 },
  addButtonText: { fontSize: 14, fontWeight: '700' },
  medicineCard: { borderWidth: 1, borderRadius: 15, padding: 14, marginTop: 11 },
  medicineCardTop: { flexDirection: 'row', gap: 10 },
  medicineCardName: { fontSize: 14, fontWeight: '700' },
  medicineSummary: { fontSize: 12, fontWeight: '700', marginTop: 10 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 11 },
  actionText: { fontSize: 12, fontWeight: '700' },
  previewButton: { minHeight: 53, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 20 },
  previewButtonText: { fontSize: 15, fontWeight: '700' },
  previewScreen: { flex: 1 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  backButton: { padding: 6, marginLeft: -6 },
  previewTitle: { fontSize: 19, fontWeight: '700' },
  previewContent: { padding: 16, alignItems: 'center' },
  previewNote: { fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 20, marginTop: 12 },
  actionBar: { flexDirection: 'row', gap: 9, padding: 14, borderTopWidth: 1 },
  actionButton: { flex: 1, minHeight: 47, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  actionButtonText: { fontSize: 13, fontWeight: '700' },
  printButton: { width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});