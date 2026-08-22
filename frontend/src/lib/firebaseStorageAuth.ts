import { signInWithCustomToken, signOut, type User } from 'firebase/auth';

import { getCustomToken } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';

async function signInWithBackendCustomToken(): Promise<User> {
  console.log('[firebaseStorageAuth] requesting custom token…');
  const { custom_token } = await getCustomToken();
  const credential = await signInWithCustomToken(
    getFirebaseAuth(),
    custom_token,
  );
  console.log('[firebaseStorageAuth] signed in as', credential.user.uid);
  return credential.user;
}

/**
 * Ensure the Firebase Auth JS SDK is signed in as `expectedUid` so Storage
 * rules see the correct request.auth.uid. Re-signs if missing, mismatched
 * (account switch), or the ID token cannot be read.
 */
export async function ensureFirebaseStorageAuth(
  expectedUid: string,
): Promise<void> {
  if (!expectedUid) {
    throw new Error('expectedUid is required for Firebase Storage Auth');
  }

  const auth = getFirebaseAuth();
  await auth.authStateReady();

  let user = auth.currentUser;
  if (!user || user.uid !== expectedUid) {
    if (user) {
      console.warn(
        '[firebaseStorageAuth] UID mismatch (had',
        user.uid,
        ', need',
        expectedUid,
        '); re-signing',
      );
      await signOut(auth).catch(() => undefined);
    }
    user = await signInWithBackendCustomToken();
  } else {
    console.log('[firebaseStorageAuth] already signed in as', user.uid);
  }

  if (user.uid !== expectedUid) {
    await signOut(auth).catch(() => undefined);
    throw new Error(
      `Firebase Auth UID ${user.uid} does not match expected ${expectedUid}`,
    );
  }

  try {
    await user.getIdToken(/* forceRefresh */ false);
  } catch (err) {
    console.warn(
      '[firebaseStorageAuth] getIdToken failed; re-signing with custom token',
      err,
    );
    await signOut(auth).catch(() => undefined);
    user = await signInWithBackendCustomToken();
    if (user.uid !== expectedUid) {
      await signOut(auth).catch(() => undefined);
      throw new Error(
        `Firebase Auth UID ${user.uid} does not match expected ${expectedUid}`,
      );
    }
    await user.getIdToken(true);
  }
}

export async function clearFirebaseStorageAuth(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    await signOut(auth);
  }
}
