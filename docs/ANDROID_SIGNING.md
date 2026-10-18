# Android release signing

The project reads local signing credentials from the ignored
`frontend/android/app/keystore.properties` file.

## Recommended for Google Play and the website

Use Google Play App Signing with a separate upload key. Sign and upload the AAB with
the upload key, then download the universal APK signed by Google Play and publish
that APK on the website. That keeps the website download and Play installs signed by
the same app-signing key, so Android can update either installation in place.

Do not put the locally built APK signed with the upload key on the website when Play
uses a different app-signing key; Android treats those as different signatures and
will refuse an in-place update between them.

If you want to sign the website APK yourself, choose your own app-signing key during
Play App Signing setup and provide it to Google. Use that same app-signing key for
the website APK. Protect it as the permanent identity of the app. Google documents
both distribution options in [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756).

## Create an upload key

From PowerShell, run:

```powershell
cd frontend/android/app
keytool -genkeypair -v -keystore upload-key.jks -alias gymbook-upload -keyalg RSA -keysize 2048 -validity 10000
```

Choose and store the passwords securely. Keep a protected backup of `upload-key.jks`;
do not commit it or send it through chat.

Copy `keystore.properties.example` to `keystore.properties` and replace the example
passwords with the values used above. Keep the keystore filename and alias consistent.

## Build the upload package

From `frontend/android`, run:

```powershell
.\gradlew.bat bundleRelease
```

The signed Google Play bundle is written to `app/build/outputs/bundle/release/`.
Download the website APK from Play Console after processing the bundle. Keep the same
upload key for future uploads; Google Play lets you request an upload-key reset if
that separate key is lost.
