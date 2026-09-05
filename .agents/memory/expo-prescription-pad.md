---
name: Expo mobile persistence and PDF setup
description: Setup constraints for the local-first Prescription Pad mobile artifact.
---

The mobile app is intentionally frontend-only and keeps its working data in AsyncStorage; the medicine catalog is behind a provider boundary so an official CDCI importer can replace sample data later.

**Why:** The prescription workflow must work offline and patient data must not require a remote service.

**How to apply:** Keep future Phase 2/3 work local-first unless the user explicitly changes the product boundary. For Expo SDK 57, legacy file-system APIs are imported from `expo-file-system/legacy` when using `documentDirectory` and copy helpers.