import { Medicine } from '@/types/prescription';

/**
 * CDCI-ready medicine data boundary.
 *
 * Phase 2 can replace this provider with a Room/SQLite-backed importer for
 * official NRCeS CDCI flat files without changing the prescription editor.
 */
export interface MedicineProvider {
  search(query: string): Medicine[];
  getById(id: string): Medicine | undefined;
}

// Clearly marked development-only sample catalog. Not an official NRCeS file.
export const SAMPLE_MEDICINES: Medicine[] = [
  {
    id: 'sample-augmentin-625',
    productName: 'Augmentin 625 mg Tablet',
    composition: 'Amoxicillin 500 mg + Clavulanic Acid 125 mg',
    strength: '625 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'GlaxoSmithKline',
    nrcesCode: 'SAMPLE-CDCI-0001',
  },
  {
    id: 'sample-paracetamol-500',
    productName: 'Paracetamol 500 mg Tablet',
    composition: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Generic sample',
    nrcesCode: 'SAMPLE-CDCI-0002',
  },
  {
    id: 'sample-azithromycin-500',
    productName: 'Azithromycin 500 mg Tablet',
    composition: 'Azithromycin',
    strength: '500 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Generic sample',
    nrcesCode: 'SAMPLE-CDCI-0003',
  },
  {
    id: 'sample-pantoprazole-40',
    productName: 'Pantoprazole 40 mg Tablet',
    composition: 'Pantoprazole',
    strength: '40 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Generic sample',
    nrcesCode: 'SAMPLE-CDCI-0004',
  },
  {
    id: 'sample-cetirizine-10',
    productName: 'Cetirizine 10 mg Tablet',
    composition: 'Cetirizine Hydrochloride',
    strength: '10 mg',
    dosageForm: 'Tablet',
    route: 'Oral',
    manufacturer: 'Generic sample',
    nrcesCode: 'SAMPLE-CDCI-0005',
  },
  {
    id: 'sample-ors',
    productName: 'ORS Powder Sachet',
    composition: 'Oral Rehydration Salts',
    strength: '21 g',
    dosageForm: 'Powder',
    route: 'Oral',
    manufacturer: 'Generic sample',
    nrcesCode: 'SAMPLE-CDCI-0006',
  },
];

class SampleMedicineProvider implements MedicineProvider {
  search(query: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return SAMPLE_MEDICINES.slice(0, 5);
    return SAMPLE_MEDICINES.filter((medicine) =>
      [
        medicine.productName,
        medicine.composition,
        medicine.strength,
        medicine.dosageForm,
        medicine.manufacturer,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    ).slice(0, 8);
  }

  getById(id: string) {
    return SAMPLE_MEDICINES.find((medicine) => medicine.id === id);
  }
}

export const medicineProvider: MedicineProvider = new SampleMedicineProvider();
export const MEDICINE_SOURCE_LABEL = 'Sample catalog · CDCI import-ready';