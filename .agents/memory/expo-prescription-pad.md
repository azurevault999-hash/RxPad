---
name: Expo mobile persistence and PDF setup
description: Setup constraints for the local-first Prescription Pad mobile artifact.
---

The mobile app is intentionally frontend-only and keeps its working data in AsyncStorage; the medicine catalog is behind a provider boundary so an official CDCI importer can replace sample data later.

**Why:** The prescription workflow must work offline and patient data must not require a remote service.

**How to apply:** Keep future Phase 2/3 work local-first unless the user explicitly changes the product boundary. For Expo SDK 57, legacy file-system APIs are imported from `expo-file-system/legacy` when using `documentDirectory` and copy helpers.

Android release builds in this workspace are sensitive to native-build memory and signing environment propagation: use OpenJDK 17, ARM phone ABIs, one Gradle/native worker, expanded metaspace, and export every release-signing variable into the Gradle process.

**Why:** The native build can be killed during CMake/lint or reach packaging without a keystore when shell-local signing variables are not exported; warm caches make a constrained rerun reliable.

**How to apply:** Treat SDK/Gradle directories and keystores as temporary workspace artifacts, never commit credentials, and verify the final APK with `apksigner` plus `aapt` metadata/permission checks.