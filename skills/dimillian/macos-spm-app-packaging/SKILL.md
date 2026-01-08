---
name: macos-spm-app-packaging
description: Scaffold, build, and package SwiftPM-based macOS apps without an Xcode project. Use when you need a from-scratch macOS app layout, SwiftPM targets/resources, a custom .app bundle assembly script, or signing/notarization/appcast steps outside Xcode.
---

# macOS SwiftPM App Packaging (No Xcode)

## Overview
Bootstrap a complete SwiftPM macOS app folder, then build, package, and run it without Xcode. Use `assets/templates/bootstrap/` for the starter layout and `references/packaging.md` + `references/release.md` for packaging and release details.

## Two-Step Workflow
1) Bootstrap the project folder
   - Copy `assets/templates/bootstrap/` into a new repo.
   - Rename `MyApp` in `Package.swift`, `Sources/MyApp/`, and `version.env`.
   - Customize `APP_NAME`, `BUNDLE_ID`, and versions.

2) Build, package, and run the bootstrapped app
   - Copy scripts from `assets/templates/` into your repo (for example, `Scripts/`).
   - Build/tests: `swift build` and `swift test`.
   - Package: `Scripts/package_app.sh`.
   - Run: `Scripts/compile_and_run.sh` (preferred) or `Scripts/launch.sh`.
   - Release (optional): `Scripts/sign-and-notarize.sh` and `Scripts/make_appcast.sh`.
   - Tag + GitHub release (optional): create a git tag, upload the zip/appcast to the GitHub release, and publish.

## Templates
- `assets/templates/package_app.sh`: Build binaries, create the .app bundle, copy resources, sign.
- `assets/templates/compile_and_run.sh`: Dev loop to kill running app, package, launch.
- `assets/templates/build_icon.sh`: Generate .icns from an Icon Composer file (requires Xcode install).
- `assets/templates/sign-and-notarize.sh`: Notarize, staple, and zip a release build.
- `assets/templates/make_appcast.sh`: Generate Sparkle appcast entries for updates.
- `assets/templates/setup_dev_signing.sh`: Create a stable dev code-signing identity.
- `assets/templates/launch.sh`: Simple launcher for a packaged .app.
- `assets/templates/version.env`: Example version file consumed by packaging scripts.
- `assets/templates/bootstrap/`: Minimal SwiftPM macOS app skeleton (Package.swift, Sources/, version.env).

## Notes
- Keep entitlements and signing configuration explicit; edit the template scripts instead of reimplementing.
- Remove Sparkle steps if you do not use Sparkle for updates.
- Sparkle relies on the bundle build number (`CFBundleVersion`), so `BUILD_NUMBER` in `version.env` must increase for each update.
- For menu bar apps, set `MENU_BAR_APP=1` when packaging to emit `LSUIElement` in Info.plist.
