import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';

const getDatabase = () => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not configured.');
  }
  return firestore;
};

export const saveFirebaseDocument = async <T extends object>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> => {
  await setDoc(
    doc(getDatabase(), collectionName, documentId),
    data,
    { merge: true }
  );
};

export const fetchFirebaseCollection = async <T>(
  collectionName: string
): Promise<T[]> => {
  const snapshot = await getDocs(
    collection(getDatabase(), collectionName)
  );
  return snapshot.docs.map((item) => item.data() as T);
};

export const subscribeFirebaseCollection = <T>(
  collectionName: string,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    collection(getDatabase(), collectionName),
    (snapshot) => {
      callback(snapshot.docs.map((item) => item.data() as T));
    },
    (error) => {
      console.error('[Firebase Realtime]', error);
      onError?.(error);
    }
  );
};

export const deleteFirebaseDocument = async (
  collectionName: string,
  documentId: string
): Promise<void> => {
  await deleteDoc(doc(getDatabase(), collectionName, documentId));
};
