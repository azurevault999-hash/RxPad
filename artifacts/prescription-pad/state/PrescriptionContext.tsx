import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DoctorProfile,
  emptyDoctorProfile,
  newDraft,
  PrescriptionDraft,
  SavedPrescription,
} from '@/types/prescription';

const STORAGE_KEY = '@prescription-pad/state-v1';

type StoredState = {
  doctor: DoctorProfile;
  history: SavedPrescription[];
};

type PrescriptionContextValue = {
  doctor: DoctorProfile;
  history: SavedPrescription[];
  draft: PrescriptionDraft;
  hydrated: boolean;
  setDoctor: (doctor: DoctorProfile) => Promise<void>;
  setDraft: React.Dispatch<React.SetStateAction<PrescriptionDraft>>;
  savePrescription: (draft: PrescriptionDraft) => Promise<SavedPrescription>;
  deletePrescription: (id: string) => Promise<void>;
  duplicatePrescription: (prescription: SavedPrescription) => void;
  resetDraft: () => void;
};

const PrescriptionContext = createContext<PrescriptionContextValue | null>(null);

export function PrescriptionProvider({ children }: { children: React.ReactNode }) {
  const [doctor, setDoctorState] = useState<DoctorProfile>(emptyDoctorProfile);
  const [history, setHistory] = useState<SavedPrescription[]>([]);
  const [draft, setDraft] = useState<PrescriptionDraft>(newDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const stored = JSON.parse(raw) as StoredState;
        setDoctorState({ ...emptyDoctorProfile, ...stored.doctor });
        setHistory(stored.history ?? []);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  const persist = async (nextDoctor: DoctorProfile, nextHistory: SavedPrescription[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ doctor: nextDoctor, history: nextHistory }));
  };

  const setDoctor = async (nextDoctor: DoctorProfile) => {
    setDoctorState(nextDoctor);
    await persist(nextDoctor, history);
  };

  const savePrescription = async (nextDraft: PrescriptionDraft) => {
    const existing = history.find((item) => item.id === nextDraft.id);
    const saved: SavedPrescription = {
      ...nextDraft,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextHistory = [saved, ...history.filter((item) => item.id !== saved.id)];
    setHistory(nextHistory);
    setDraft(saved);
    await persist(doctor, nextHistory);
    return saved;
  };

  const deletePrescription = async (id: string) => {
    const nextHistory = history.filter((item) => item.id !== id);
    setHistory(nextHistory);
    await persist(doctor, nextHistory);
  };

  const duplicatePrescription = (prescription: SavedPrescription) => {
    setDraft({
      ...prescription,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: newDraft().date,
      patientName: '',
      patientId: '',
    });
  };

  const resetDraft = () => setDraft(newDraft());

  const value = useMemo(
    () => ({
      doctor,
      history,
      draft,
      hydrated,
      setDoctor,
      setDraft,
      savePrescription,
      deletePrescription,
      duplicatePrescription,
      resetDraft,
    }),
    [doctor, history, draft, hydrated],
  );

  return <PrescriptionContext.Provider value={value}>{children}</PrescriptionContext.Provider>;
}

export function usePrescription() {
  const context = useContext(PrescriptionContext);
  if (!context) throw new Error('usePrescription must be used inside PrescriptionProvider');
  return context;
}