# RxPad Android Release Build Guide

This guide produces and validates a directly installable Android APK from the
Expo project in a fresh Replit instance. It is build-only: do not change
application code, dependency versions, or the established Expo/Gradle setup.

## 1. Known-good baseline

Use these versions exactly:

- Expo SDK 57
- React Native 0.86.3
- Android compile SDK 36
- Android target SDK 36
- Android minimum SDK 24
- `expo-sqlite ~57.0.2`
- Android NDK `27.1.12297006`
- OpenJDK 17
- Local Gradle build through the project's Gradle wrapper
- APK distribution

The Expo SQLite config plugin must remain enabled in the Expo configuration.
Do not upgrade Expo, React Native, SQLite, Reanimated, Worklets, or other
dependencies as part of this build.

## 2. Project root and initial validation

The Expo project root is:

```text
artifacts/prescription-pad
```

From the repository root, confirm the working tree and install the existing
lockfile dependencies:

```bash
git status
pnpm install
cd artifacts/prescription-pad
pnpm exec expo install --check
npx expo-doctor
```

Expected results:

- `expo install --check` reports that dependencies are up to date.
- `npx expo-doctor` reports `21/21 checks passed`.

Do not run dependency upgrades or broad cleanup.

## 3. Android SDK and Java environment

The Replit environment must provide OpenJDK 17 and these Android components:

- SDK Platform 36
- Build Tools 35.0.0
- Build Tools 36.0.0
- NDK 27.1.12297006
- CMake 3.22.1
- Android platform tools and command-line tools

The following Nix composition provisions the required components without
changing the project:

```bash
nix-build --no-out-link -E '
  let
    pkgs = import <nixpkgs> {
      config = { android_sdk.accept_license = true; };
    };
  in
    (pkgs.androidenv.composeAndroidPackages {
      platformVersions = [ 36 ];
      buildToolsVersions = [ "35.0.0" "36.0.0" ];
      includeNDK = true;
      ndkVersions = [ "27.1.12297006" ];
      includeCmake = true;
      cmakeVersions = [ "3.22.1" ];
    }).androidsdk
'
```

Capture the resulting Nix store path as `SDK_PACKAGE`. The Nix Android SDK's
actual SDK root is under `libexec/android-sdk`; point both Android variables
there, not at the parent Nix store path:

```bash
export SDK_PACKAGE=/path/printed/by/nix-build
export ANDROID_HOME="$SDK_PACKAGE/libexec/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"

java -version
"$ANDROID_HOME/platform-tools/adb" version
test -d "$ANDROID_HOME/platforms/android-36"
test -d "$ANDROID_HOME/build-tools/35.0.0"
test -d "$ANDROID_HOME/build-tools/36.0.0"
test -d "$ANDROID_HOME/ndk/27.1.12297006"
```

The SDK directory is immutable. Provision every required component before
building; do not rely on Gradle to install missing packages into it.

## 4. Generate the native Android project

From `artifacts/prescription-pad`:

```bash
if [ ! -d android ]; then
  pnpm exec expo prebuild --platform android
fi
```

If `android/` already exists, inspect it and preserve it. Do not run a
destructive prebuild over an existing native project without a specific reason.

## 5. Build the release APK

Use the project’s Gradle wrapper. Do not switch to EAS and do not run
`gradlew clean` routinely.

For constrained Replit build environments, limit Gradle to one worker without
changing the checked-in Gradle configuration:

```bash
export GRADLE_OPTS="-Dorg.gradle.workers.max=1 -Dorg.gradle.parallel=false"
cd artifacts/prescription-pad/android
./gradlew assembleRelease
cd ../..
```

The expected APK is:

```text
artifacts/prescription-pad/android/app/build/outputs/apk/release/app-release.apk
```

Native C/C++ compilation can take approximately 20 minutes. A Replit command
timeout does not necessarily mean Gradle failed. Before restarting a timed-out
command, check whether Gradle is still running and whether the expected APK
was produced:

```bash
ps -ef | grep -E '[g]radle|[n]inja|[c]make'
find artifacts/prescription-pad/android -type f -name '*.apk' -print
```

## 6. Verify and copy the APK

Locate APKs by timestamp, path, and size:

```bash
find . -type f -name '*.apk' \
  -printf '%TY-%Tm-%Td %TH:%TM:%TS %p %s bytes\n' 2>/dev/null |
  sort -r | head
```

Set the newly generated APK explicitly and inspect it:

```bash
export APK="$PWD/artifacts/prescription-pad/android/app/build/outputs/apk/release/app-release.apk"
stat -c '%y %s bytes %n' "$APK"
sha256sum "$APK"
```

Only after the current build has succeeded and the timestamp confirms that the
APK is new, copy it to the documented release location:

```bash
cp "$APK" release/PrescriptionPad-1.0.0.apk
stat -c '%y %s bytes %n' release/PrescriptionPad-1.0.0.apk
sha256sum release/PrescriptionPad-1.0.0.apk
```

The APK file SHA-256 printed by `sha256sum` identifies the exact APK bytes. It
is not the signing certificate fingerprint.

## 7. Inspect signing and package metadata

Use the SDK Build Tools installed above:

```bash
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify \
  --verbose --print-certs "$APK"

"$ANDROID_HOME/build-tools/36.0.0/aapt" dump badging "$APK" | sed -n '1,12p'
```

Record all three signing results separately:

1. **APK file SHA-256** — the output of `sha256sum "$APK"`.
2. **Signing certificate SHA-256** — the `Signer #1 certificate SHA-256
   digest` output from `apksigner --print-certs`.
3. **APK signing status** — the `Verified using ...` results from `apksigner`.

The current successful build is signed with the **Android Debug** certificate
and verifies with APK Signature Scheme v2. Do not generate, replace, or
prescribe a release key in this build guide. Production release-key management
is a separate future step.

## 8. Physical-device acceptance test

A successful Gradle build is not runtime validation. After producing the APK,
install it on a physical Android device and confirm that it launches and the
basic prescription workflow works:

```bash
"$ANDROID_HOME/platform-tools/adb" devices
"$ANDROID_HOME/platform-tools/adb" install -r "$APK"
```

Manually launch RxPad on the device and verify at minimum:

- the app opens without immediately closing;
- a prescription can be edited;
- the A4 preview can be opened;
- PDF generation and sharing/saving work as expected;
- local history and settings remain available.

If no physical device is connected, report that the APK was build-verified but
physical-device runtime acceptance remains outstanding.