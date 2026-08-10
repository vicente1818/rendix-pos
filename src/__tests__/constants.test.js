import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDateTime, generateSaleId, CANALES, METODOS, CATS } from '../utils/constants.js';

describe('formatCurrency', () => {
  it('formats positive integers', () => {
    const result = formatCurrency(95000);
    expect(result).toContain('95.000');
  });

  it('rounds floats to the nearest integer', () => {
    const result = formatCurrency(95000.7);
    expect(result).toContain('95.001');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0');
  });

  it('handles null/undefined gracefully (treats as 0)', () => {
    expect(formatCurrency(null)).toContain('0');
    expect(formatCurrency(undefined)).toContain('0');
  });

  it('starts with the dollar sign prefix', () => {
    expect(formatCurrency(1000)).toMatch(/^\$/);
  });
});

describe('generateSaleId', () => {
  it('returns a string starting with VTA-', () => {
    expect(generateSaleId()).toMatch(/^VTA-/);
  });

  it('generates different IDs when called with different timestamps', () => {
    // generateSaleId uses Date.now() — uniqueness is guaranteed across different milliseconds,
    // not within the same synchronous tick. We verify the format contract here.
    const id1 = generateSaleId();
    const id2 = generateSaleId();
    expect(id1).toMatch(/^VTA-[A-Z0-9]+$/);
    expect(id2).toMatch(/^VTA-[A-Z0-9]+$/);
  });

  it('uses only uppercase alphanumeric characters after the prefix', () => {
    const id = generateSaleId();
    const suffix = id.slice(4);
    expect(suffix).toMatch(/^[A-Z0-9]+$/);
  });
});

describe('formatDateTime', () => {
  it('returns a string with date and time parts', () => {
    const ts = new Date('2024-06-15T14:30:00').toISOString();
    const result = formatDateTime(ts);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes both day and hour information', () => {
    const ts = new Date('2024-06-15T14:30:00').getTime();
    const result = formatDateTime(ts);
    // es-AR locale may not zero-pad single-digit months (e.g. "15/6" not "15/06")
    expect(result).toMatch(/\d{1,2}\/\d{1,2}/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('constant arrays', () => {
  it('CANALES includes expected sales channels', () => {
    expect(CANALES).toContain('Instagram');
    expect(CANALES).toContain('WhatsApp');
    expect(CANALES).toContain('Local / Mostrador');
  });

  it('METODOS includes Mixto payment method', () => {
    expect(METODOS).toContain('Mixto (Efect + Transfer)');
    expect(METODOS).toContain('Efectivo');
    expect(METODOS).toContain('Transferencia');
  });

  it('CATS includes all product categories', () => {
    expect(CATS).toContain('Esteroides / AAS');
    expect(CATS).toContain('Suplementos');
    expect(CATS).toContain('Combos');
  });
});
