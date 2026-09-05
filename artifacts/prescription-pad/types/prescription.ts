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
  footerText: string;
};

export type Medicine = {
  id: string;
  productName: string;
  composition: string;
  strength: string;
  dosageForm: string;
  route: string;
  manufacturer: string;
  nrcesCode: string;
};

export type PrescriptionMedicine = Medicine & {
  dose: string;
  frequency: string;
  duration: string;
  prescribedRoute: string;
  instructions: string;
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
  medicines: PrescriptionMedicine[];
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