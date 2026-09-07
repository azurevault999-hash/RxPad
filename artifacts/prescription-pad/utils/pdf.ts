import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DoctorProfile, PrescriptionDraft } from '@/types/prescription';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const logoMimeTypes: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export type PrescriptionPdfAssets = {
  logoDataUri?: string;
  signatureDataUri?: string;
  qrCodeDataUri?: string;
};

async function resolveImageDataUri(uri?: string) {
  if (!uri) return undefined;
  if (uri.startsWith('data:image/')) return uri;

  const extension = uri
    .split(/[?#]/, 1)[0]
    .split('.')
    .pop()
    ?.toLowerCase();
  const mimeType = (extension && logoMimeTypes[extension]) || 'image/jpeg';
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn('Could not embed local prescription image:', error);
    return undefined;
  }
}

export function prescriptionHtml(
  doctor: DoctorProfile,
  draft: PrescriptionDraft,
  assets: PrescriptionPdfAssets = {},
) {
  const medicines = draft.medicines
    .map(
      (medicine, index) => `
      <tr>
        <td><strong>${index + 1}. ${escapeHtml(medicine.medicineName || 'Medicine name')}</strong><small>${escapeHtml([medicine.composition, medicine.strength, medicine.dosageForm].filter(Boolean).join(' · '))}</small><em>${escapeHtml([medicine.route, medicine.instructions].filter(Boolean).join(' · ') || 'As directed')}</em></td>
        <td>${escapeHtml([medicine.dose, medicine.doseUnit].filter(Boolean).join(' ') || '—')}</td>
        <td><strong>${escapeHtml(medicine.frequency || '—')}</strong><small>${escapeHtml([medicine.duration, medicine.durationUnit].filter(Boolean).join(' ') || '—')}</small>${medicine.quantity ? `<small>Qty ${escapeHtml(medicine.quantity)}</small>` : ''}</td>
      </tr>`,
    )
    .join('');
  const logo = assets.logoDataUri
    ? `<img class="logo" src="${escapeHtml(assets.logoDataUri)}" />`
    : '';
  const signature = assets.signatureDataUri
    ? `<img class="signature-image" src="${escapeHtml(assets.signatureDataUri)}" />`
    : '';
  const footer = assets.qrCodeDataUri
    ? `<footer class="footer-with-qr"><span class="footer-text-with-qr">${escapeHtml(doctor.footerText)}</span><img class="footer-qr" src="${escapeHtml(assets.qrCodeDataUri)}" /></footer>`
    : `<footer>${escapeHtml(doctor.footerText)}</footer>`;
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
  @page { size: A4; margin: 14mm 15mm; }
  * { box-sizing: border-box; } body { font-family: Arial, sans-serif; color:#17212B; font-size:10pt; margin:0; }
  .header { display:flex; justify-content:space-between; border-bottom:2px solid #0B8F87; padding-bottom:10px; }
  .identity { display:flex; gap:10px; align-items:center; } .logo { width:38px; height:38px; border-radius:8px; object-fit:cover; }
  h1 { font-size:17pt; margin:0 0 3px; } .credentials { color:#0B8F87; font-weight:bold; font-size:9pt; } .clinic,.address,.muted { color:#657476; font-size:8pt; }
  .reg { text-align:right; font-size:8pt; } .reg strong { display:block; color:#17212B; font-size:9pt; margin-top:4px; }
  .address { margin-top:8px; } .patient { display:flex; gap:20px; background:#E7F2F0; padding:10px; border-radius:5px; margin-top:15px; }
  .patient > div { flex:1; } label { display:block; color:#657476; font-size:7pt; text-transform:uppercase; letter-spacing:1px; font-weight:bold; } .value { font-size:10pt; font-weight:bold; margin-top:4px; }
  .detail { margin-top:10px; font-size:9pt; } .rx { font-size:23pt; color:#0B8F87; font-weight:bold; font-style:italic; margin:17px 0 7px; }
  table { border-collapse:collapse; width:100%; } th { background:#0B8F87; color:#fff; text-align:left; padding:7px; font-size:7pt; letter-spacing:.5px; } td { border-bottom:1px solid #D8E2E0; padding:9px 7px; vertical-align:top; font-size:9pt; } td:first-child { width:58%; } td:nth-child(2) { width:18%; } td:nth-child(3) { width:24%; }
  td strong, td small, td em { display:block; } td small { color:#657476; font-size:8pt; margin-top:3px; } td em { color:#0B716B; font-size:8pt; font-style:normal; margin-top:4px; font-weight:bold; }
   .signature { margin-top:88px; text-align:right; } .signature-image { display:block; width:140px; height:54px; object-fit:contain; margin:0 0 8px auto; } .signature-line { display:inline-block; width:140px; border-top:1px solid #17212B; } .signature-label { display:block; color:#657476; font-size:8pt; margin-top:5px; }
   footer { position:fixed; bottom:0; left:0; right:0; color:#657476; text-align:center; font-size:7pt; } .footer-with-qr { min-height:54px; padding-right:66px; position:relative; } .footer-text-with-qr { display:block; line-height:54px; } .footer-qr { display:block; position:absolute; right:0; bottom:0; width:54px; height:54px; object-fit:contain; }
  </style></head><body>
  <header class="header"><div class="identity">${logo}<div><h1>${escapeHtml(doctor.name || 'Doctor name')}</h1><div class="credentials">${escapeHtml([doctor.qualifications, doctor.specialty].filter(Boolean).join(' · ') || 'Qualifications · Specialty')}</div>${doctor.clinicName ? `<div class="clinic">${escapeHtml(doctor.clinicName)}</div>` : ''}</div></div><div class="reg">REG. NO.<strong>${escapeHtml(doctor.registrationNumber || '—')}</strong></div></header>
  <div class="address">${escapeHtml([doctor.address, doctor.phone, doctor.email].filter(Boolean).join(' · ') || 'Clinic address · Phone · Email')}</div>
  <section class="patient"><div><label>Patient</label><div class="value">${escapeHtml(draft.patientName || 'Patient name')}</div></div><div><label>Age / Sex</label><div class="value">${escapeHtml(draft.age || '—')} / ${escapeHtml(draft.sex)}</div></div><div><label>Date</label><div class="value">${escapeHtml(draft.date)}</div></div></section>
  ${draft.patientId ? `<div class="detail muted">Patient ID / UHID: ${escapeHtml(draft.patientId)}</div>` : ''}${draft.diagnosis ? `<div class="detail"><strong>Diagnosis:</strong> ${escapeHtml(draft.diagnosis)}</div>` : ''}
  <div class="rx">Rx</div><table><thead><tr><th>MEDICINE / COMPOSITION</th><th>DOSE</th><th>SCHEDULE</th></tr></thead><tbody>${medicines || '<tr><td colspan="3" class="muted">No medicines entered</td></tr>'}</tbody></table>
  ${draft.advice ? `<div class="detail"><strong>Advice:</strong> ${escapeHtml(draft.advice)}</div>` : ''}${draft.followUp ? `<div class="detail"><strong>Follow-up:</strong> ${escapeHtml(draft.followUp)}</div>` : ''}${draft.clinicalNotes ? `<div class="detail"><strong>Notes:</strong> ${escapeHtml(draft.clinicalNotes)}</div>` : ''}
    <div class="signature">${signature}<span class="signature-line"></span><span class="signature-label">Doctor signature</span></div>${footer}
  </body></html>`;
}

export async function generatePrescriptionPdf(doctor: DoctorProfile, draft: PrescriptionDraft) {
  const [logoDataUri, signatureDataUri, qrCodeDataUri] = await Promise.all([
    resolveImageDataUri(doctor.logoUri),
    resolveImageDataUri(doctor.signatureImageUri),
    resolveImageDataUri(doctor.qrCodeImageUri),
  ]);
  const { uri } = await Print.printToFileAsync({
    html: prescriptionHtml(doctor, draft, {
      logoDataUri,
      signatureDataUri,
      qrCodeDataUri,
    }),
    base64: false,
  });
  return uri;
}

export async function sharePdf(uri: string) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share prescription PDF' });
}

export async function printPdf(uri: string) {
  await Print.printAsync({ uri });
}

export async function savePdf(uri: string, draftId: string) {
  const directory = `${FileSystem.documentDirectory ?? ''}prescriptions`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}/prescription-${draftId}.pdf`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}