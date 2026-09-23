# Kafi Portfolio — Fixed Firebase Admin Panel

This folder is the corrected browser-only Firebase admin panel.

## What was fixed

1. Removed the invalid browser imports:
   - `firebase/app`
   - `firebase/analytics`
2. Firebase is now loaded directly from Google's browser CDN.
3. `firebase-config.js` now exports only `firebaseConfig`.
4. Login form IDs now exactly match `admin.js`.
5. `preventDefault()` prevents email/password from appearing in the URL.
6. Added project create, edit, publish/draft, and delete.
7. Added blog create, edit, publish/draft, and delete.
8. Added clearer Firebase/Firestore permission errors.
9. Added an admin custom-claim check.

## Upload/deploy

Replace your existing `admin` folder files with:
- `index.html`
- `admin.js`
- `admin.css`
- `firebase-config.js`

Then redeploy the Render static site.

## Important Firebase permission step

If login succeeds but the dashboard says `permission-denied`, the Firebase Auth user needs the custom claim:

`admin: true`

The browser cannot safely create that claim. It must be assigned with Firebase Admin SDK / a trusted server or Cloud Function.

## Firestore rules

Use rules that require the admin claim for writes, for example:

```text
match /projects/{projectId} {
  allow read: if resource.data.published == true || isAdmin();
  allow create, update, delete: if isAdmin();
}

match /posts/{postId} {
  allow read: if resource.data.published == true || isAdmin();
  allow create, update, delete: if isAdmin();
}

function isAdmin() {
  return request.auth != null && request.auth.token.admin == true;
}
```

## Deployment check

After Render deploys, open the deployed `admin.js` in the browser. Its first import must start with:

`https://www.gstatic.com/firebase/12.19.0/firebase-app.js`

It must NOT contain:

`from "firebase/app"`

Do not open the admin page with `file://`; use the Render URL or a local HTTP server.


## IMPORTANT: Firebase API key error

If the browser shows:

`auth/api-key-not-valid`

the JavaScript module setup is working, but Firebase is rejecting the API key. Open Firebase Console → Project settings → General → Your apps → Web app → SDK setup and configuration → Config, then copy the CURRENT `apiKey` into `admin/firebase-config.js`.

Also check Google Cloud Console → APIs & Services → Credentials → the Web API key used by Firebase. If API restrictions are enabled, make sure Firebase Authentication / Identity Toolkit is allowed, or temporarily use the Firebase-created key without an incompatible restriction while testing.

After changing the config, commit/push to GitHub and redeploy on Render.
