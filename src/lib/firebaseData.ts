import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  runTransaction,
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

export const scheduleFirebaseTradeOutcome = async (
  tradeId: string,
  outcome: 'WIN' | 'LOSS' | null,
  percent?: number
): Promise<void> => {
  const db = getDatabase();
  const tradeRef = doc(db, 'trades', tradeId);

  if (outcome && (!Number.isFinite(Number(percent)) || Number(percent) < 1 || Number(percent) > 5000)) {
    throw new Error('Enter a valid scheduled outcome percentage from 1% to 5000%.');
  }

  await runTransaction(db, async (transaction) => {
    const tradeSnapshot = await transaction.get(tradeRef);
    if (!tradeSnapshot.exists()) {
      throw new Error('The selected trade no longer exists in Firebase.');
    }
    if (tradeSnapshot.data().status !== 'OPEN') {
      throw new Error('This trade has already closed. Its result and balance cannot be changed.');
    }

    transaction.update(tradeRef, {
      scheduledOutcome: outcome,
      scheduledPercent: outcome ? Number(percent) : null,
    });
  });
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


export type FirebaseTradeSettlementInput = {
  tradeId: string;
  outcome: 'WIN' | 'LOSS' | 'MARKET';
  percent?: number;
  marketPrice?: number;
  closedAt?: string;
};

export type FirebaseTradeSettlementResult = {
  settled: boolean;
  trade: Record<string, any>;
  userId: string;
  tradingBalance: number;
};

/**
 * Atomically closes one OPEN trade and credits its actual owner.
 * The OPEN status check inside the transaction makes settlement idempotent:
 * two browser tabs or an auto-expiry/manual-settlement race cannot credit twice.
 */
export const settleFirebaseTrade = async (
  input: FirebaseTradeSettlementInput
): Promise<FirebaseTradeSettlementResult> => {
  const db = getDatabase();
  const tradeRef = doc(db, 'trades', input.tradeId);

  return runTransaction(db, async (transaction) => {
    const tradeSnapshot = await transaction.get(tradeRef);
    if (!tradeSnapshot.exists()) {
      throw new Error('The selected trade no longer exists in Firebase.');
    }

    const trade = { ...tradeSnapshot.data(), id: tradeSnapshot.id } as Record<string, any>;
    const userId = String(trade.userId || '');
    if (!userId) throw new Error('The trade has no customer owner ID.');

    const userRef = doc(db, 'users', userId);
    const userSnapshot = await transaction.get(userRef);
    if (!userSnapshot.exists()) {
      throw new Error('The customer account for this trade was not found in Firebase.');
    }

    const user = userSnapshot.data();
    const currentBalance = Number(user.tradingBalance ?? 0);
    if (!Number.isFinite(currentBalance)) {
      throw new Error('The customer trading balance is invalid; settlement was not applied.');
    }

    // A previously closed trade is returned without changing either document.
    if (trade.status !== 'OPEN') {
      return {
        settled: false,
        trade,
        userId,
        tradingBalance: currentBalance,
      };
    }

    const margin = Number(trade.margin);
    const leverage = Number(trade.leverage);
    const entryPrice = Number(trade.entryPrice);
    if (!Number.isFinite(margin) || margin < 0 || !Number.isFinite(entryPrice) || entryPrice <= 0) {
      throw new Error('Trade margin or entry price is invalid; settlement was not applied.');
    }

    let finalExitPrice = Number(input.marketPrice ?? trade.currentPrice);
    let finalPnl = 0;
    let finalPnlPercent = 0;

    // MARKET close/expiry must honor the latest scheduled result stored in Firestore,
    // not a possibly stale scheduledOutcome value from another browser tab.
    const effectiveOutcome: 'WIN' | 'LOSS' | 'MARKET' =
      input.outcome === 'MARKET' &&
      (trade.scheduledOutcome === 'WIN' || trade.scheduledOutcome === 'LOSS')
        ? trade.scheduledOutcome
        : input.outcome;
    const effectivePercent = input.outcome === 'MARKET'
      ? Number(trade.scheduledPercent ?? (trade.scheduledOutcome === 'WIN' ? 35 : 100))
      : Number(input.percent);
    let scheduledOutcome: 'WIN' | 'LOSS' | null = effectiveOutcome === 'MARKET' ? null : effectiveOutcome;
    let scheduledPercent: number | undefined = effectiveOutcome === 'MARKET' ? undefined : effectivePercent;

    if (effectiveOutcome === 'WIN' || effectiveOutcome === 'LOSS') {
      const percent = effectivePercent;
      if (!Number.isFinite(percent) || percent < 1 || percent > 5000 || !Number.isFinite(leverage) || leverage <= 0) {
        throw new Error('Enter a valid settlement percentage from 1% to 5000%.');
      }

      const signedPercent = effectiveOutcome === 'WIN' ? percent : -percent;
      finalPnl = Number((margin * signedPercent / 100).toFixed(2));
      finalPnlPercent = signedPercent;
      const priceMultiplier = 1 + (signedPercent / 100) / leverage;
      finalExitPrice = trade.type === 'BUY'
        ? Number((entryPrice * priceMultiplier).toFixed(entryPrice > 100 ? 2 : 4))
        : Number((entryPrice * (2 - priceMultiplier)).toFixed(entryPrice > 100 ? 2 : 4));
      scheduledOutcome = effectiveOutcome;
      scheduledPercent = percent;
    } else {
      if (!Number.isFinite(finalExitPrice) || finalExitPrice <= 0) {
        throw new Error('The latest market price is invalid; settlement was not applied.');
      }
      const positionSize = Number(trade.positionSize);
      if (!Number.isFinite(positionSize) || positionSize < 0) {
        throw new Error('Trade position size is invalid; settlement was not applied.');
      }
      finalPnl = trade.type === 'BUY'
        ? ((finalExitPrice - entryPrice) / entryPrice) * positionSize
        : ((entryPrice - finalExitPrice) / entryPrice) * positionSize;
      finalPnl = Number(finalPnl.toFixed(2));
      finalPnlPercent = margin > 0 ? Number((finalPnl / margin * 100).toFixed(2)) : 0;
    }

    const finalReturn = Math.max(0, Number((margin + finalPnl).toFixed(2)));
    const nextBalance = Number((currentBalance + finalReturn).toFixed(2));
    const closedTrade = {
      ...trade,
      status: 'CLOSED',
      currentPrice: finalExitPrice,
      exitPrice: finalExitPrice,
      pnl: finalPnl,
      pnlPercent: Number(finalPnlPercent.toFixed(2)),
      scheduledOutcome,
      scheduledPercent,
      closedAt: input.closedAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    transaction.set(tradeRef, removeUndefinedValues(closedTrade), { merge: true });
    transaction.set(userRef, { tradingBalance: nextBalance }, { merge: true });

    return {
      settled: true,
      trade: closedTrade,
      userId,
      tradingBalance: nextBalance,
    };
  });
};
