# Firebase (Storage)

This folder holds Firebase Storage security rules for visit images.

## Enable Storage

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. Build → Storage → Get started (use production mode; rules below replace defaults).
3. Note the bucket name (e.g. `your-project.appspot.com` or `your-project.firebasestorage.app`).
4. Set `FIREBASE_STORAGE_BUCKET` in `backend/.env` to that bucket name.
5. Set matching `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` (and related) in `frontend/.env`.

## Deploy rules

From this directory (requires [Firebase CLI](https://firebase.google.com/docs/cli) and `firebase login`):

```bash
cd firebase
firebase use <your-project-id>
firebase deploy --only storage
```

## Path layout

`visits/{firebaseUid}/{visitId}/{0-4}.{jpg|jpeg|png|webp}`

Only the owning authenticated user may read/write/delete. Writes require `image/*` and size &lt; 10MB.

Admin SDK deletes (backend) bypass these rules via the service account.
