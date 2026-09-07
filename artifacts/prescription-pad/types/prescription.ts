export type Sex = 'Male' | 'Female' | 'Other';

export type DoctorProfile = {
  name: string;
  qualifications: string;
  specialty: string;
  registrationNumber: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  logoUri?: string;
  signatureImageUri?: string;
  qrCodeImageUri?: string;
  footerText: string;
};

export type PrescriptionMedication = {
  id: string;
  medicineName: string;
  composition: string;
  strength: string;
  dosageForm: string;
  dose: string;
  doseUnit: string;
  frequency: string;
  duration: string;
  durationUnit: string;
  route: string;
  quantity: string;
  instructions: string;
  catalogBrandIdentifier?: string;
  catalogProductIdentifier?: string;
  catalogGenericIdentifier?: string;
};

export type MedicineCatalogItem = {
  id: string;
  medicineName: string;
  composition: string;
  strength: string;
  dosageForm: string;
  route: string;
  brandName: string;
  productName: string;
  genericName: string;
  substanceNames: string;
  supplierName: string;
  catalogBrandIdentifier: string;
  catalogProductIdentifier: string;
  catalogGenericIdentifier: string;
};

export type PrescriptionDraft = {
  id: string;
  patientName: string;
  age: string;
  sex: Sex;
  patientId: string;
  date: string;
  diagnosis: string;
  clinicalNotes: string;
  advice: string;
  followUp: string;
  medicines: PrescriptionMedication[];
};

export type SavedPrescription = PrescriptionDraft & {
  createdAt: string;
  updatedAt: string;
};

export const emptyDoctorProfile: DoctorProfile = {
  name: '',
  qualifications: '',
  specialty: '',
  registrationNumber: '',
  clinicName: '',
  address: '',
  phone: '',
  email: '',
  logoUri: '',
  footerText: 'This prescription is for medical use only.',
};

export const todayLabel = () =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

export const newMedication = (): PrescriptionMedication => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  medicineName: '',
  composition: '',
  strength: '',
  dosageForm: '',
  dose: '',
  doseUnit: '',
  frequency: '',
  duration: '',
  durationUnit: '',
  route: '',
  quantity: '',
  instructions: '',
});

type LegacyMedication = Partial<PrescriptionMedication> & {
  productName?: string;
  prescribedRoute?: string;
  manufacturer?: string;
  nrcesCode?: string;
};

const splitLegacyValue = (value: string | undefined, fallbackUnit: string) => {
  const match = value?.trim().match(/^(.+?)\s+([a-zA-Z]+)$/);
  return match ? { value: match[1], unit: match[2] } : { value: value ?? '', unit: fallbackUnit };
};

/**
 * Keeps prescriptions saved by the previous prototype readable after the
 * editable medication model replaces its catalogue-backed shape.
 */
export const normalizeMedication = (raw: unknown): PrescriptionMedication => {
  const item = (raw ?? {}) as LegacyMedication;
  const legacyDose = splitLegacyValue(item.dose, '');
  const legacyDuration = splitLegacyValue(item.duration, '');
  return {
    id: item.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    medicineName: item.medicineName ?? item.productName ?? '',
    composition: item.composition ?? '',
    strength: item.strength ?? '',
    dosageForm: item.dosageForm ?? '',
    dose: legacyDose.value,
    doseUnit: item.doseUnit ?? legacyDose.unit,
    frequency: item.frequency ?? '',
    duration: legacyDuration.value,
    durationUnit: item.durationUnit ?? legacyDuration.unit,
    route: item.route ?? item.prescribedRoute ?? '',
    quantity: item.quantity ?? '',
    instructions: item.instructions ?? '',
    catalogBrandIdentifier: item.catalogBrandIdentifier ?? item.nrcesCode,
    catalogProductIdentifier: item.catalogProductIdentifier,
    catalogGenericIdentifier: item.catalogGenericIdentifier,
  };
};

export const newDraft = (): PrescriptionDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  patientName: '',
  age: '',
  sex: 'Male',
  patientId: '',
  date: todayLabel(),
  diagnosis: '',
  clinicalNotes: '',
  advice: '',
  followUp: '',
  medicines: [],
});