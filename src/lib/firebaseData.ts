import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';

const removeUndefinedValues = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((item) => item === undefined ? null : removeUndefinedValues(item));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removeUndefinedValues(item)])
    );
  }
  return value;
};

const withDocumentId = <T,>(id: string, value: unknown): T => {
  if (value && typeof value === 'object') {
    const data = value as Record<string, unknown>;
    return { ...data, id: data.id ?? id } as T;
  }
  return value as T;
};

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
    removeUndefinedValues(data),
    { merge: true }
  );
};

export const fetchFirebaseCollection = async <T>(
  collectionName: string
): Promise<T[]> => {
  const snapshot = await getDocs(
    collection(getDatabase(), collectionName)
  );
  return snapshot.docs.map((item) => withDocumentId<T>(item.id, item.data()));
};

export const subscribeFirebaseCollection = <T>(
  collectionName: string,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    collection(getDatabase(), collectionName),
    (snapshot) => {
      callback(snapshot.docs.map((item) => withDocumentId<T>(item.id, item.data())));
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
