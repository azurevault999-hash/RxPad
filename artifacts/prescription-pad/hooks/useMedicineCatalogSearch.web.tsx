import type { ReactNode } from 'react';

export function CatalogDatabaseBridge({ children }: { children: ReactNode }) {
  return children;
}

export function useMedicineCatalogSearch(_query: string) {
  return { results: [], loading: false };
}