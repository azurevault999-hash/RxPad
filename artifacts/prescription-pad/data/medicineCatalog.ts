import { MedicineCatalogItem } from '@/types/prescription';
import type { SQLiteDatabase } from 'expo-sqlite';

export interface MedicineCatalogRepository {
  searchMedicines(query: string): Promise<MedicineCatalogItem[]>;
}

type MedicineSearchRow = {
  brand_identifier: string;
  brand_name: string;
  product_identifier: string;
  product_name: string;
  supplier_name: string;
  generic_identifier: string;
  generic_name: string;
  substance_names: string;
  dosage_forms: string;
  routes: string;
};

const toFtsQuery = (query: string) =>
  query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term.replace(/"/g, '""')}"*`)
    .join(' AND ');

export async function searchMedicineCatalog(
  database: SQLiteDatabase,
  query: string,
  limit = 8,
): Promise<MedicineCatalogItem[]> {
  const ftsQuery = toFtsQuery(query);
  if (!ftsQuery) return [];

  const rows = await database.getAllAsync<MedicineSearchRow>(
    `
      SELECT
        search.brand_identifier,
        search.brand_name,
        search.product_identifier,
        search.product_name,
        search.supplier_name,
        search.generic_identifier,
        search.generic_name,
        search.substance_names,
        search.dosage_forms,
        search.routes
      FROM medicine_search AS search
      JOIN medicine_search_fts
        ON medicine_search_fts.rowid = search.rowid
      WHERE medicine_search_fts MATCH ?
      ORDER BY bm25(medicine_search_fts), search.brand_name
      LIMIT ?
    `,
    ftsQuery,
    limit,
  );

  return rows.map((row) => ({
    id: row.brand_identifier,
    medicineName: row.brand_name || row.product_name || row.generic_name,
    composition: row.generic_name || row.substance_names,
    strength: '',
    dosageForm: row.dosage_forms,
    route: row.routes,
    brandName: row.brand_name,
    productName: row.product_name,
    genericName: row.generic_name,
    substanceNames: row.substance_names,
    supplierName: row.supplier_name,
    catalogBrandIdentifier: row.brand_identifier,
    catalogProductIdentifier: row.product_identifier,
    catalogGenericIdentifier: row.generic_identifier,
  }));
}