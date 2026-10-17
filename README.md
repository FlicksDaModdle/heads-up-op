# Heads Up

A Flutter version of the party game: hold the phone to your forehead and
your friends give you clues for the word on screen.

- **Tilt down** (screen to the floor) = correct
- **Tilt up** (screen to the ceiling) = pass
- Tapping works too: right half = correct, left half = pass

Eight built-in decks; round length (30/60/90/120 s) is in Settings.

## Getting the iPhone app (no Mac needed)

GitHub Actions builds the iOS app on a macOS runner on every push to `main`
(or run it by hand: **Actions → Build → Run workflow**).

1. Open the finished run and download the **HeadsUp-iOS** artifact.
2. Inside is `HeadsUp-unsigned.ipa` (and `HeadsUp.ipa` if you set up
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
`com.flicksdamoddle.headsUp`). The next run produces a signed `HeadsUp.ipa`.

**Option B: sign it yourself on Windows.** Take `HeadsUp-unsigned.ipa` and
sign it with a tool such as Sideloadly (Apple ID) or zsign
(`.p12` + `.mobileprovision`).

Then install the signed `.ipa` with your usual tool (e.g. Sideloadly).

## Android

The **HeadsUp-Android** artifact contains `app-release.apk`, ready to sideload.

## Developing

```sh
flutter pub get
flutter test
flutter run        # with an Android device/emulator attached
```
