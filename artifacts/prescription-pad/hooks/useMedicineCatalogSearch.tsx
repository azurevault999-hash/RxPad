import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { searchMedicineCatalog } from '@/data/medicineCatalog';
import { MedicineCatalogItem } from '@/types/prescription';
import type { SQLiteDatabase } from 'expo-sqlite';

export const CatalogDatabaseContext = createContext<SQLiteDatabase | null>(null);

export function CatalogDatabaseBridge({ children }: { children: ReactNode }) {
  const database = useSQLiteContext();
  return <CatalogDatabaseContext.Provider value={database}>{children}</CatalogDatabaseContext.Provider>;
}

export function useMedicineCatalogSearch(query: string) {
  const database = useContext(CatalogDatabaseContext);
  const [results, setResults] = useState<MedicineCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const trimmed = query.trim();

    if (!database || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      searchMedicineCatalog(database, trimmed)
        .then((nextResults) => {
          if (active) setResults(nextResults);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 160);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [database, query]);

  return { results, loading };
}