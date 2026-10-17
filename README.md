# Forehead Frenzy

An open-source, clean-room take on the "phone on your forehead" party game.
Hold the phone to your forehead while your friends shout clues for the word
on screen.

- **Tilt down** (screen to the floor) = got it
- **Tilt up** (screen to the ceiling) = skip
- Tapping works too: right half = got it, left half = skip

Eight built-in decks, plus **your own decks**: tap **New deck** on the home
screen, name it, and type or paste words (one per line, or comma-separated).
Round length (30/60/90/120 s) and vibration are in Settings.

### Clean room and naming

This is an independent project. It is not affiliated with, endorsed by, or
derived from any commercial app. The behaviour it implements was written up
from ordinary play in [docs/SPEC.md](docs/SPEC.md), which also sets the
rules: no copied code, art, sounds, deck names, word lists or on-screen text,
and no unpacking of other apps. The name, icon (drawn by
[tool/make_icon.py](tool/make_icon.py)) and every deck are original to this
project.

## Getting the iPhone app (no Mac needed)

GitHub Actions builds the iOS app on a macOS runner on every push to `main`
(or run it by hand: **Actions → Build → Run workflow**).

1. Open the finished run and download the **ForeheadFrenzy-iOS** artifact.
2. Inside is `ForeheadFrenzy-unsigned.ipa` (and `ForeheadFrenzy.ipa` if you set up
   signing, below).

### Signing with your certificate

**Option A: let CI sign it.** Add these repository secrets
(**Settings → Secrets and variables → Actions**):

| Secret | Value |
| --- | --- |
| `IOS_P12_BASE64` | your `.p12` certificate, base64-encoded |
| `IOS_P12_PASSWORD` | the `.p12` password |
| `IOS_PROFILE_BASE64` | your `.mobileprovision`, base64-encoded |

On Windows, base64-encode a file in PowerShell with:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cert.p12")) | Set-Clipboard
```

The bundle ID is taken from the provisioning profile (wildcard profiles keep
`com.flicksdamoddle.foreheadFrenzy`). The next run produces a signed `ForeheadFrenzy.ipa`.

**Option B: sign it yourself on Windows.** Take `ForeheadFrenzy-unsigned.ipa` and
sign it with a tool such as Sideloadly (Apple ID) or zsign
(`.p12` + `.mobileprovision`).

Then install the signed `.ipa` with your usual tool (e.g. Sideloadly).

## Android

The **ForeheadFrenzy-Android** artifact contains `app-release.apk`, ready to sideload.

## Developing

```sh
flutter pub get
flutter test
flutter run        # with an Android device/emulator attached
python tool/make_icon.py   # regenerate launcher icons (needs Pillow)
```
