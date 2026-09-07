import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const WEBSITE_URL = 'https://nightnode.online';
const SUPPORT_EMAIL = 'glint@nightnode.online';

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>RXPAD</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>RxPad</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Prescription Pad</Text>

      <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Version</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>{version}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.copyright, { color: colors.mutedForeground }]}>© 2026 NightNode</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Medicine Reference Database</Text>
        <View style={[styles.referenceCard, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.referenceName, { color: colors.secondaryForeground }]}>NRCeS Common Drug Codes for India</Text>
          <Text style={[styles.referenceText, { color: colors.secondaryForeground }]}>
            Source: National Resource Centre for EHR Standards (NRCeS), Centre for Development of Advanced Computing (C-DAC), Pune.
          </Text>
          <Text style={[styles.referenceText, { color: colors.secondaryForeground }]}>
            Bundled reference snapshot: 2026-09-06
          </Text>
          <Text style={[styles.referenceText, { color: colors.secondaryForeground }]}>
            Source package: CommonDrugCodesForIndia_FlatFilePackage_1788697854786.zip
          </Text>
        </View>
      </View>

      <View style={[styles.disclaimer, { borderColor: colors.border }]}>
        <Feather name="info" size={17} color={colors.primary} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          Reference only: Medicine information is provided as a reference aid and should be independently verified. RxPad does not replace professional clinical judgment, prescribing information, or applicable medical guidance.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Website</Text>
        <Pressable onPress={() => void Linking.openURL(WEBSITE_URL)} style={styles.linkRow}>
          <Feather name="globe" size={18} color={colors.primary} />
          <Text style={[styles.linkText, { color: colors.primary }]}>{WEBSITE_URL}</Text>
          <Feather name="external-link" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Support</Text>
        <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.linkRow}>
          <Feather name="mail" size={18} color={colors.primary} />
          <Text style={[styles.linkText, { color: colors.primary }]}>{SUPPORT_EMAIL}</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 24 },
  detailsCard: { borderWidth: 1, borderRadius: 15, padding: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 13 },
  copyright: { fontSize: 12 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 11 },
  referenceCard: { borderRadius: 14, padding: 14, gap: 7 },
  referenceName: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  referenceText: { fontSize: 12, lineHeight: 17 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 18 },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 17 },
  linkRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { flex: 1, fontSize: 14, fontWeight: '600' },
});