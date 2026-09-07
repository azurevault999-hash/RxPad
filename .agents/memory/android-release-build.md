---
name: Android release build environment
description: Environment-specific constraints for local Expo SDK 57 Android release builds.
---

Use OpenJDK 17 and a local Gradle build. When the Android SDK is provisioned through Nix's androidenv composition, point `ANDROID_HOME` and `ANDROID_SDK_ROOT` at the composition's `libexec/android-sdk` payload, not the outer derivation directory. Include the compile/target platform and every Build Tools version requested by Gradle; this project required SDK 36, Build Tools 35.0.0 and 36.0.0, NDK 27.1.12297006, and CMake.

**Why:** The outer Nix SDK path caused Gradle to mis-detect the NDK, while the immutable inner SDK path caused Gradle to fail when it tried to install missing Build Tools 35. Provisioning all required components up front avoids both failures.

**How to apply:** Keep the SDK composition outside the project, export the inner SDK path only for the build process, use one Gradle/native worker in constrained environments, and verify the produced APK with `apksigner` and `aapt`.