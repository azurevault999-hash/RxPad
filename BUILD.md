# PrescriptionPad Android Build & Release Runbook

## Purpose

Known-good workflow for producing a directly installable PrescriptionPad Android APK from the Expo/React Native source.

## 1. Known-good baseline

- Expo SDK: 57
- React Native: 0.86.3
- Android target SDK: 36
- Android minimum SDK: 24
- Build: Expo prebuild + local Gradle
- Distribution: APK
- GitHub: `https://github.com/azurevault999-hash/RxPad`

### Critical dependency

Keep:

```text
expo-sqlite: ~57.0.2
```

The original crashing build used `~16.0.10`, which was incompatible with Expo SDK 57.

The corrected build also has the Expo SQLite config plugin enabled.

Known-good validation:

```text
expo install --check  -> PASS
expo-doctor           -> 21/21 checks PASS
Production Android JS export -> PASS
```

The corrected Gradle APK was installed on a physical Android phone and confirmed working.

## 2. Clean Replit setup

Pull the GitHub repository into a fresh Replit instance.

Do not automatically upgrade dependencies or perform broad cleanup.

Start with:

```bash
git status
pnpm install
pnpm exec expo install --check
pnpm exec expo-doctor
```

Keep the working tree clean before making changes.

## 3. Development/change discipline

Make one logical change at a time.

Do not casually upgrade Expo, React Native, Reanimated, Worklets, or other dependencies.

Keep the last known-good Git state recoverable until the new APK has been tested.

## 4. Generate Android native project

This is an Expo managed project. A clean Git pull may not contain `android/`.

Generate it from the current Expo configuration:

```bash
pnpm exec expo prebuild --platform android
```

This incorporates config plugins, including `expo-sqlite`.

If an existing `android/` directory is present, inspect it before running a destructive prebuild.

## 5. Build the release APK

Use local Gradle; do not switch to EAS unless deliberately required.

```bash
cd android
./gradlew assembleRelease
```

Expected APK:

```text
android/app/build/outputs/apk/release/app-release.apk
```

If the project is nested under `artifacts/prescription-pad`, the corresponding path is:

```text
artifacts/prescription-pad/android/app/build/outputs/apk/release/app-release.apk
```

Native C/C++ compilation can take several minutes. A Replit command timeout does not necessarily mean Gradle failed. Check whether a background build completed before starting another build.

## 6. ARM64 optimization

For a physical modern Android phone, an ARM64-only build can reduce native build time. Use the project's established Gradle/ABI mechanism if available.

Do not sacrifice reproducibility merely to optimize build time.

## 7. Verify the generated APK

Run:

```bash
find . -type f -name "*.apk" -printf '%TY-%Tm-%Td %TH:%TM:%TS %p %s bytes\n' 2>/dev/null | sort -r | head
```

Verify timestamp and size so that an old APK is not mistaken for the new build.

The known-good corrected APK produced during the original build was approximately 77,199,462 bytes.

## 8. Convenience copy

If useful:

```bash
cp artifacts/prescription-pad/android/app/build/outputs/apk/release/app-release.apk ./PrescriptionPad-1.0.0.apk
```

## 9. Git LFS

Large APK/release artifacts use Git LFS.

Check tracking:

```bash
git lfs ls-files | grep -E 'apk|PrescriptionPad'
```

Do not disable LFS for large release artifacts.

## 10. Push to GitHub

The Replit environment uses the GitHub PAT stored as:

```text
GITHUB_PAT
```

For a release APK:

```bash
git add release/PrescriptionPad-1.0.0.apk
git commit -m "Build corrected Android APK"
git push "https://azurevault999-hash:${GITHUB_PAT}@github.com/azurevault999-hash/RxPad.git" main
```

Never print or expose the PAT.

If a token-bearing remote URL was temporarily configured, restore the remote afterward:

```bash
git remote set-url origin https://github.com/azurevault999-hash/RxPad.git
```

## 11. Download from GitHub

The direct raw GitHub URL successfully downloaded the APK when UI download actions were unreliable:

```text
https://github.com/azurevault999-hash/RxPad/raw/refs/heads/main/release/PrescriptionPad-1.0.0.apk
```

## 12. Physical-device acceptance test

A build is not considered successful merely because Gradle completes.

Acceptance sequence:

```text
source change
  -> Expo validation
  -> expo prebuild
  -> Gradle release APK
  -> install on physical Android phone
  -> launch
  -> basic application test
  -> commit/push known-good build
```

## 13. Important incident history

The first production APK installed but immediately closed on Android.

The Replit environment had no Android SDK/emulator/device, so an actual Android logcat crash could not be captured.

Static/dependency checks identified:

```text
expo-sqlite 16.0.10
```

while Expo SDK 57 requires approximately:

```text
expo-sqlite ~57.0.2
```

`SQLiteProvider` is mounted during application startup.

The dependency was aligned to `~57.0.2`, the native Android project was regenerated, and a new release APK was built with Gradle.

That corrected APK was installed on a physical Android phone and **worked successfully**.

Therefore `expo-sqlite ~57.0.2` is part of the current known-good baseline. Do not revert it to 16.x.

## 14. Future Agent rules

### Do

- Inspect the project first.
- Preserve the lockfile.
- Keep Expo dependencies aligned with the Expo SDK.
- Run `expo install --check`.
- Run `expo-doctor`.
- Run Expo prebuild when the native project is absent.
- Use Gradle for the local release APK.
- Verify the actual APK path and timestamp.
- Test the APK on a physical Android device.
- Commit/push only after the replacement is confirmed working.

### Do not

- Automatically upgrade all dependencies.
- Casually change Expo/React Native versions.
- Replace the Gradle workflow with EAS without a specific reason.
- Rewrite application architecture to solve a build problem.
- Treat a Replit command timeout as proof that Gradle failed.
- Run `gradlew clean` unnecessarily after substantial native compilation has completed.
- Claim an Android crash is fixed without actually running the resulting APK.
- Overwrite the last known-good release before testing the replacement.

## 15. Standard release cycle

```bash
# Confirm state
git status

# Install and validate
pnpm install
pnpm exec expo install --check
pnpm exec expo-doctor

# Generate native project when needed
pnpm exec expo prebuild --platform android

# Build release
cd android
./gradlew assembleRelease
cd ..

# Locate the APK
find . -type f -name "*.apk" -printf '%TY-%Tm-%Td %TH:%TM:%TS %p %s bytes\n' 2>/dev/null | sort -r | head

# Test the APK on the physical Android device

# After successful testing, commit and push
git add .
git commit -m "Build Android APK"
git push "https://azurevault999-hash:${GITHUB_PAT}@github.com/azurevault999-hash/RxPad.git" main
```

## 16. Known-good principle

The working APK is the reference point.

For any future build problem:

1. Identify the failure.
2. Make the smallest necessary change.
3. Rebuild.
4. Test on the physical device.
5. Keep the last known-good Git state until the replacement is confirmed.

Do not turn a build problem into an uncontrolled dependency or application rewrite.
