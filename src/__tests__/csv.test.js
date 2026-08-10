import { describe, it, expect } from 'vitest';
import { parseSpanishFloat, parseCSVLine, importCatalogFromCSV } from '../utils/csv.js';

describe('parseSpanishFloat', () => {
  it('parses plain integers', () => {
    expect(parseSpanishFloat('95000')).toBe(95000);
  });

  it('parses unambiguous Spanish format (period as thousands + comma as decimal)', () => {
    // "$ 95.000" is ambiguous (could be 95.0 or 95000) — the function needs BOTH . and , to detect
    // Spanish thousands-sep format. Use an unambiguous value with both separators.
    expect(parseSpanishFloat('$ 95.000,00')).toBe(95000);
  });

  it('handles Spanish format: period as thousands separator, comma as decimal', () => {
    expect(parseSpanishFloat('1.234,56')).toBe(1234.56);
  });

  it('handles US format: comma as thousands separator, period as decimal', () => {
    expect(parseSpanishFloat('1,234.56')).toBe(1234.56);
  });

  it('handles plain comma as decimal separator', () => {
    expect(parseSpanishFloat('1234,5')).toBe(1234.5);
  });

  it('returns 0 for empty/null/undefined input', () => {
    expect(parseSpanishFloat('')).toBe(0);
    expect(parseSpanishFloat(null)).toBe(0);
    expect(parseSpanishFloat(undefined)).toBe(0);
  });

  it('returns 0 for non-numeric strings', () => {
    expect(parseSpanishFloat('abc')).toBe(0);
  });

  it('strips non-breaking spaces', () => {
    expect(parseSpanishFloat(' 95000')).toBe(95000);
  });
});

describe('parseCSVLine', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields', () => {
    expect(parseCSVLine('"hello","world"')).toEqual(['hello', 'world']);
  });

  it('handles commas inside quoted fields', () => {
    expect(parseCSVLine('"one, two","three"')).toEqual(['one, two', 'three']);
  });

  it('handles escaped quotes inside quoted fields (RFC 4180 double-quote)', () => {
    expect(parseCSVLine('"say ""hello"""')).toEqual(['say "hello"']);
  });

  it('trims whitespace from unquoted fields', () => {
    expect(parseCSVLine(' a , b , c ')).toEqual(['a', 'b', 'c']);
  });

  it('handles empty fields', () => {
    expect(parseCSVLine('a,,c')).toEqual(['a', '', 'c']);
  });

  it('returns single element array for a line with no commas', () => {
    expect(parseCSVLine('only')).toEqual(['only']);
  });
});

describe('importCatalogFromCSV', () => {
  const existingProducts = [
    { sku: 'EST-001', nombre: 'Old Name', cat: 'Esteroides / AAS', marca: 'X', pres: 'Vial', precio: 80000, stock: 10, stockMin: 3, activo: true },
  ];

  const validCSV = [
    'SKU,Nombre,Precio,Stock',
    'EST-001,Testosterona 250,95000,20',
    'NEW-001,Nuevo Producto,50000,5',
  ].join('\n');

  it('rejects CSV with fewer than 2 lines', () => {
    const result = importCatalogFromCSV('', existingProducts);
    expect(result.ok).toBe(false);
  });

  it('rejects CSV missing required columns (SKU, Nombre, Precio)', () => {
    const result = importCatalogFromCSV('Foo,Bar\nval1,val2', existingProducts);
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('SKU');
  });

  it('parses a valid CSV and returns ok: true', () => {
    const result = importCatalogFromCSV(validCSV, existingProducts);
    expect(result.ok).toBe(true);
  });

  it('updates an existing product by SKU', () => {
    const result = importCatalogFromCSV(validCSV, existingProducts);
    const updated = result.products.find(p => p.sku === 'EST-001');
    expect(updated.nombre).toBe('Testosterona 250');
    expect(updated.precio).toBe(95000);
    expect(updated.stock).toBe(20);
    expect(result.updated).toBe(1);
  });

  it('imports a new product not in existingProducts', () => {
    const result = importCatalogFromCSV(validCSV, existingProducts);
    const imported = result.products.find(p => p.sku === 'NEW-001');
    expect(imported).toBeDefined();
    expect(imported.nombre).toBe('Nuevo Producto');
    expect(result.imported).toBe(1);
  });

  it('keeps existing products not in the CSV', () => {
    const moreExisting = [
      ...existingProducts,
      { sku: 'VIT-001', nombre: 'Omega-3', cat: 'Vitaminas', marca: 'X', pres: 'Caps', precio: 16000, stock: 35, stockMin: 8, activo: true },
    ];
    const result = importCatalogFromCSV(validCSV, moreExisting);
    const kept = result.products.find(p => p.sku === 'VIT-001');
    expect(kept).toBeDefined();
  });

  it('skips rows with empty SKU silently', () => {
    const csvWithEmptySku = 'SKU,Nombre,Precio\n,Sin SKU,1000\nNEW-002,Con SKU,2000';
    const result = importCatalogFromCSV(csvWithEmptySku, []);
    expect(result.ok).toBe(true);
    expect(result.products.find(p => p.sku === 'NEW-002')).toBeDefined();
    expect(result.products.find(p => !p.sku)).toBeUndefined();
  });

  it('records errors for rows with missing nombre or precio <= 0', () => {
    const badCSV = 'SKU,Nombre,Precio\nBAD-001,,0';
    const result = importCatalogFromCSV(badCSV, []);
    expect(result.ok).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles CRLF line endings', () => {
    const crlf = 'SKU,Nombre,Precio\r\nNEW-003,Producto,3000';
    const result = importCatalogFromCSV(crlf, []);
    expect(result.ok).toBe(true);
    expect(result.products.find(p => p.sku === 'NEW-003')).toBeDefined();
  });
});
