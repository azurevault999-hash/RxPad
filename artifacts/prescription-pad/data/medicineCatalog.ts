import { MedicineCatalogItem } from '@/types/prescription';

/**
 * Future catalogue boundary only.
 *
 * The current app intentionally has no catalogue implementation, sample
 * records, database table, or validation requirement. A later repository can
 * implement this interface and use its results to prefill a
 * PrescriptionMedication while leaving the existing editable model intact.
 */
export interface MedicineCatalogRepository {
  searchMedicines(query: string): Promise<MedicineCatalogItem[]>;
}