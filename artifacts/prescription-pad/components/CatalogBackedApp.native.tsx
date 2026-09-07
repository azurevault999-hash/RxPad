import { SQLiteProvider } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { cdciAsset } from '@/data/cdciAsset';
import { CatalogDatabaseBridge } from '@/hooks/useMedicineCatalogSearch';

export function CatalogBackedApp({ children }: { children: ReactNode }) {
  const [catalogUnavailable, setCatalogUnavailable] = useState(false);
  const handleCatalogError = useCallback(() => setCatalogUnavailable(true), []);

  if (catalogUnavailable || !cdciAsset) return children;

  return (
    <SQLiteProvider
      databaseName="cdci.sqlite"
      assetSource={cdciAsset}
      onError={handleCatalogError}
    >
      <CatalogDatabaseBridge>{children}</CatalogDatabaseBridge>
    </SQLiteProvider>
  );
}