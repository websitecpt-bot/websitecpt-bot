import type { Trade } from '../types';

export interface TradeReferenceCalculation {
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  margin: number;
  leverage: number;
  positionSize: number;
  targetProfit: number;
  referenceExitPrice: number;
  reconstructedProfit: number;
  roe: number;
  referenceOnly: true;
}

/**
 * Calculates a hypothetical exit-price reference for a dispute review.
 * Pure function: it does not modify a trade, quote, execution, PnL,
 * user balance, or database row.
 */
export function calculateReferenceExitPrice(params: {
  tradeType: Trade['type'] | 'LONG' | 'SHORT';
  entryPrice: number;
  margin: number;
  leverage: number;
  targetProfit: number;
}): TradeReferenceCalculation {
  const { tradeType, entryPrice, margin, leverage, targetProfit } = params;

  if (
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(margin) ||
    !Number.isFinite(leverage) ||
    !Number.isFinite(targetProfit) ||
    entryPrice <= 0 ||
    margin <= 0 ||
    leverage <= 0 ||
    targetProfit <= 0
  ) {
    throw new Error('Entry price, margin, leverage and target PnL must be positive finite numbers.');
  }

  const direction = String(tradeType).toUpperCase();
  const isLong = direction === 'BUY' || direction === 'LONG';
  const isShort = direction === 'SELL' || direction === 'SHORT';

  if (!isLong && !isShort) {
    throw new Error('Unsupported trade direction.');
  }

  const positionSize = margin * leverage;
  const priceMovement = (targetProfit / positionSize) * entryPrice;
  const rawExitPrice = isLong
    ? entryPrice + priceMovement
    : entryPrice - priceMovement;

  if (!Number.isFinite(rawExitPrice) || rawExitPrice <= 0) {
    throw new Error('This target PnL would require a non-positive reference exit price.');
  }

  const referenceExitPrice = Number(rawExitPrice.toFixed(12));
  const reconstructedProfit = Number((
    ((isLong
      ? referenceExitPrice - entryPrice
      : entryPrice - referenceExitPrice
    ) / entryPrice) * positionSize
  ).toFixed(2));

  return {
    direction: isLong ? 'LONG' : 'SHORT',
    entryPrice,
    margin,
    leverage,
    positionSize,
    targetProfit,
    referenceExitPrice,
    reconstructedProfit,
    roe: (targetProfit / margin) * 100,
    referenceOnly: true,
  };
}
