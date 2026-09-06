---
name: CDCI catalog packaging
description: Durable packaging and platform-boundary decisions for the bundled NRCeS CDCI catalogue.
---

The official CDCI flat files are compiled into a bundled SQLite database and accessed only on native Android. The web preview must not import Expo SQLite or the `.sqlite` asset; use platform-specific native/web modules and keep web as a manual-entry fallback.

**Why:** Expo SDK 57's web SQLite entry expects a missing WASM file in this workspace, while the Android native module works correctly. Keeping the boundary platform-specific preserves the Android offline feature without making the preview blank.

**How to apply:** Register `.sqlite` as a Metro asset extension, keep the asset require inside a `.native` module, keep `SQLiteProvider` inside a native-only component, and retain manual prescribing when database startup/search is unavailable.