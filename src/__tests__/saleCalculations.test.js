import { describe, it, expect } from 'vitest';

function applyDiscount(subtotal, discountPct) {
  if (subtotal <= 0) return 0;
  const factor = 1 - Math.max(0, Math.min(100, discountPct)) / 100;
  return Math.round(subtotal * factor);
}

function calcSubtotal(items) {
  return items.reduce((sum, item) => sum + item.precio * item.qty, 0);
}

function calcMixtoRemainder(total, efectivo) {
  return Math.max(0, total - Math.min(efectivo, total));
}

describe('applyDiscount', () => {
  it('applies 0% discount (no change)', () => {
    expect(applyDiscount(100000, 0)).toBe(100000);
  });

  it('applies 10% discount', () => {
    expect(applyDiscount(100000, 10)).toBe(90000);
  });

  it('applies 50% discount', () => {
    expect(applyDiscount(100000, 50)).toBe(50000);
  });

  it('applies 100% discount (free)', () => {
    expect(applyDiscount(100000, 100)).toBe(0);
  });

  it('clamps discount above 100% to 100%', () => {
    expect(applyDiscount(100000, 150)).toBe(0);
  });

  it('clamps negative discount to 0%', () => {
    expect(applyDiscount(100000, -10)).toBe(100000);
  });

  it('returns 0 for zero subtotal regardless of discount', () => {
    expect(applyDiscount(0, 50)).toBe(0);
  });

  it('rounds fractional results to integer pesos', () => {
    expect(applyDiscount(99999, 10)).toBe(Math.round(99999 * 0.9));
  });
});

describe('calcSubtotal', () => {
  it('sums price * qty for all items', () => {
    const items = [
      { precio: 95000, qty: 2 },
      { precio: 28000, qty: 1 },
    ];
    expect(calcSubtotal(items)).toBe(95000 * 2 + 28000);
  });

  it('returns 0 for empty cart', () => {
    expect(calcSubtotal([])).toBe(0);
  });

  it('handles single item with qty 1', () => {
    expect(calcSubtotal([{ precio: 45000, qty: 1 }])).toBe(45000);
  });
});

describe('calcMixtoRemainder (pago mixto: transfer = total - efectivo)', () => {
  it('calculates transfer remainder correctly', () => {
    expect(calcMixtoRemainder(100000, 40000)).toBe(60000);
  });

  it('returns 0 when efectivo covers the full total', () => {
    expect(calcMixtoRemainder(100000, 100000)).toBe(0);
  });

  it('returns 0 when efectivo exceeds the total (no negative transfer)', () => {
    expect(calcMixtoRemainder(100000, 150000)).toBe(0);
  });

  it('returns full total when efectivo is 0', () => {
    expect(calcMixtoRemainder(100000, 0)).toBe(100000);
  });
});
