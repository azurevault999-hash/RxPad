import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import colors from '@/constants/colors';
import { DoctorProfile, PrescriptionDraft } from '@/types/prescription';

export function A4Preview({ doctor, draft }: { doctor: DoctorProfile; draft: PrescriptionDraft }) {
  const pageColors = colors.light;
  return (
    <View style={[styles.page, { backgroundColor: pageColors.card, borderColor: pageColors.border }]}>
      <View style={[styles.header, { borderBottomColor: pageColors.primary }]}>
        <View style={styles.brandRow}>
          {doctor.logoUri ? <Image source={{ uri: doctor.logoUri }} style={styles.logo} /> : null}
          <View style={styles.brandCopy}>
            <Text style={[styles.doctorName, { color: pageColors.foreground }]}>{doctor.name || 'Doctor name'}</Text>
            <Text style={[styles.credentials, { color: pageColors.primary }]}>
              {[doctor.qualifications, doctor.specialty].filter(Boolean).join('  ·  ') || 'Qualifications  ·  Specialty'}
            </Text>
            {doctor.clinicName ? <Text style={[styles.clinic, { color: pageColors.mutedForeground }]}>{doctor.clinicName}</Text> : null}
          </View>
        </View>
        <View style={styles.registration}>
          <Text style={[styles.regLabel, { color: pageColors.mutedForeground }]}>REG. NO.</Text>
          <Text style={[styles.regValue, { color: pageColors.foreground }]}>{doctor.registrationNumber || '—'}</Text>
        </View>
      </View>

      <Text style={[styles.address, { color: pageColors.mutedForeground }]}>
        {[doctor.address, doctor.phone, doctor.email].filter(Boolean).join('  ·  ') || 'Clinic address  ·  Phone  ·  Email'}
      </Text>

      <View style={[styles.patientBand, { backgroundColor: pageColors.secondary }]}>
        <View style={styles.patientBlock}>
          <Text style={[styles.label, { color: pageColors.mutedForeground }]}>PATIENT</Text>
          <Text style={[styles.value, { color: pageColors.foreground }]}>{draft.patientName || 'Patient name'}</Text>
        </View>
        <View style={styles.patientBlock}>
          <Text style={[styles.label, { color: pageColors.mutedForeground }]}>AGE / SEX</Text>
          <Text style={[styles.value, { color: pageColors.foreground }]}>{draft.age || '—'} / {draft.sex}</Text>
        </View>
        <View style={styles.patientBlock}>
          <Text style={[styles.label, { color: pageColors.mutedForeground }]}>DATE</Text>
          <Text style={[styles.value, { color: pageColors.foreground }]}>{draft.date}</Text>
        </View>
      </View>
      {draft.patientId ? <Text style={[styles.meta, { color: pageColors.mutedForeground }]}>Patient ID / UHID: {draft.patientId}</Text> : null}
      {draft.diagnosis ? <Text style={[styles.detail, { color: pageColors.foreground }]}><Text style={styles.detailLabel}>Diagnosis: </Text>{draft.diagnosis}</Text> : null}

      <Text style={[styles.rx, { color: pageColors.primary }]}>Rx</Text>
      <View style={[styles.tableHeader, { backgroundColor: pageColors.primary }]}>
        <Text style={[styles.tableHeaderText, styles.medicineCol]}>MEDICINE / COMPOSITION</Text>
        <Text style={[styles.tableHeaderText, styles.doseCol]}>DOSE</Text>
        <Text style={[styles.tableHeaderText, styles.scheduleCol]}>SCHEDULE</Text>
      </View>
      {draft.medicines.length ? draft.medicines.map((medicine, index) => (
        <View key={`${medicine.id}-${index}`} style={[styles.medicineRow, { borderBottomColor: pageColors.border }]}>
          <View style={styles.medicineCol}>
            <Text style={[styles.medicineName, { color: pageColors.foreground }]}>{index + 1}. {medicine.medicineName || 'Medicine name'}</Text>
            <Text style={[styles.composition, { color: pageColors.mutedForeground }]}>{[medicine.composition, medicine.strength, medicine.dosageForm].filter(Boolean).join('  ·  ')}</Text>
            <Text style={[styles.instruction, { color: pageColors.primary }]}>{[medicine.route, medicine.instructions].filter(Boolean).join('  ·  ') || 'As directed'}</Text>
          </View>
          <Text style={[styles.doseCol, styles.rowText, { color: pageColors.foreground }]}>{[medicine.dose, medicine.doseUnit].filter(Boolean).join(' ') || '—'}</Text>
          <View style={styles.scheduleCol}>
            <Text style={[styles.rowText, { color: pageColors.foreground }]}>{medicine.frequency || '—'}</Text>
            <Text style={[styles.duration, { color: pageColors.mutedForeground }]}>{[medicine.duration, medicine.durationUnit].filter(Boolean).join(' ') || '—'}</Text>
            {medicine.quantity ? <Text style={[styles.duration, { color: pageColors.mutedForeground }]}>Qty {medicine.quantity}</Text> : null}
          </View>
        </View>
      )) : (
        <Text style={[styles.empty, { color: pageColors.mutedForeground }]}>Medicines will appear here</Text>
      )}

      {draft.advice ? <Text style={[styles.detail, { color: pageColors.foreground }]}><Text style={styles.detailLabel}>Advice: </Text>{draft.advice}</Text> : null}
      {draft.followUp ? <Text style={[styles.detail, { color: pageColors.foreground }]}><Text style={styles.detailLabel}>Follow-up: </Text>{draft.followUp}</Text> : null}
      {draft.clinicalNotes ? <Text style={[styles.detail, { color: pageColors.foreground }]}><Text style={styles.detailLabel}>Notes: </Text>{draft.clinicalNotes}</Text> : null}

      <View style={styles.signature}>
        {doctor.signatureImageUri ? <Image source={{ uri: doctor.signatureImageUri }} style={styles.signatureImage} resizeMode="contain" /> : null}
        <View style={[styles.signatureLine, { borderTopColor: pageColors.foreground }]} />
        <Text style={[styles.signatureLabel, { color: pageColors.mutedForeground }]}>Doctor signature</Text>
      </View>
      {doctor.qrCodeImageUri ? (
        <View style={styles.footerWithQr}>
          <Text style={[styles.footerTextWithQr, { color: pageColors.mutedForeground }]}>{doctor.footerText}</Text>
          <Image source={{ uri: doctor.qrCodeImageUri }} style={styles.footerQr} resizeMode="contain" />
        </View>
      ) : (
        <Text style={[styles.footer, { color: pageColors.mutedForeground }]}>{doctor.footerText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', padding: 20, borderWidth: 1, minHeight: 680 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 2 },
  brandRow: { flexDirection: 'row', flex: 1 },
  logo: { width: 36, height: 36, borderRadius: 8, marginRight: 9 },
  brandCopy: { flex: 1 },
  doctorName: { fontSize: 17, fontWeight: '700' },
  credentials: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  clinic: { fontSize: 9, marginTop: 3 },
  registration: { alignItems: 'flex-end' },
  regLabel: { fontSize: 7, letterSpacing: 1, fontWeight: '600' },
  regValue: { fontSize: 9, marginTop: 3 },
  address: { fontSize: 8, marginTop: 7 },
  patientBand: { flexDirection: 'row', padding: 9, marginTop: 14, borderRadius: 5 },
  patientBlock: { flex: 1 },
  label: { fontSize: 7, letterSpacing: 0.8, fontWeight: '600' },
  value: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  meta: { fontSize: 8, marginTop: 7 },
  detail: { fontSize: 9, lineHeight: 14, marginTop: 9 },
  detailLabel: { fontWeight: '700' },
  rx: { fontSize: 23, fontWeight: '700', fontStyle: 'italic', marginTop: 17, marginBottom: 7 },
  tableHeader: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6, borderRadius: 3 },
  tableHeaderText: { color: '#FFFFFF', fontSize: 7, fontWeight: '700', letterSpacing: 0.4 },
  medicineCol: { flex: 2.6 },
  doseCol: { flex: 0.9, paddingLeft: 6 },
  scheduleCol: { flex: 1.2, paddingLeft: 6 },
  medicineRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 6, borderBottomWidth: 1 },
  medicineName: { fontSize: 10, fontWeight: '600' },
  composition: { fontSize: 8, marginTop: 3, lineHeight: 11 },
  instruction: { fontSize: 8, marginTop: 4, fontWeight: '600' },
  rowText: { fontSize: 9, fontWeight: '600' },
  duration: { fontSize: 8, marginTop: 4 },
  empty: { fontSize: 9, paddingVertical: 26, textAlign: 'center' },
  signature: { alignItems: 'flex-end', marginTop: 70 },
  signatureImage: { width: 140, height: 54, marginBottom: 8 },
  signatureLine: { width: 120, borderTopWidth: 1 },
  signatureLabel: { fontSize: 8, marginTop: 5 },
  footer: { fontSize: 7, textAlign: 'center', marginTop: 24 },
  footerWithQr: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 54, marginTop: 24 },
  footerTextWithQr: { flex: 1, fontSize: 7, textAlign: 'center', marginRight: 12 },
  footerQr: { width: 54, height: 54 },
});