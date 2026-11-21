import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';

const getFirebaseAuth = () => {
  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not configured.');
  }
  return firebaseAuth;
};

export const registerWithFirebase = async (
  email: string,
  password: string,
  displayName: string
) => {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return result.user;
};

export const loginWithFirebase = async (
  email: string,
  password: string
) => {
  const result = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password
  );
  return result.user;
};

export const logoutFromFirebase = async () => {
  await signOut(getFirebaseAuth());
};

export const loginOrMigrateWithFirebase = async (
  email: string,
  password: string,
  legacyAuthVerified: boolean,
  displayName: string
) => {
  const auth = getFirebaseAuth();

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, migrated: false };
  } catch (signInError: any) {
    if (!legacyAuthVerified) {
      throw signInError;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      return { user: result.user, migrated: true };
    } catch (createError: any) {
      if (createError?.code === 'auth/email-already-in-use') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, migrated: false };
      }
      throw createError;
    }
  }
};


export const updateFirebasePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const user = getFirebaseAuth().currentUser;
  if (!user?.email) {
    throw new Error('Please sign in again before changing your password.');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};
