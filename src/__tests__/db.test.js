import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

function buildTestDb() {
  const db = new Dexie(`RendixTest_${Math.random().toString(36).slice(2)}`);
  db.version(1).stores({
    products: 'sku, nombre, cat, activo, stock',
    sales: 'id, fecha, canal, vendedor, synced',
    config: 'key',
  });
  return db;
}

const DEMO_PRODUCT = {
  sku: 'TST-001', nombre: 'Test Product', cat: 'Suplementos',
  marca: 'Test', pres: 'Unit', precio: 10000, stock: 5, stockMin: 2, activo: true,
};

const DEMO_SALE = {
  id: 'VTA-TEST1', fecha: Date.now(), canal: 'Local / Mostrador',
  vendedor: 'Test', metodo: 'Efectivo', subtotal: 10000, descPct: 0, total: 10000,
  estado: 'Completada', items: [{ sku: 'TST-001', nombre: 'Test Product', qty: 1, precio: 10000 }],
  cli: { nombre: '', tel: '', ig: '', ciudad: '', notas: '' }, synced: false,
};

describe('Dexie products round-trip', () => {
  let db;

  beforeEach(async () => {
    db = buildTestDb();
    await db.open();
  });

  it('adds and retrieves a product by SKU', async () => {
    await db.products.add(DEMO_PRODUCT);
    const retrieved = await db.products.get('TST-001');
    expect(retrieved).toBeDefined();
    expect(retrieved.nombre).toBe('Test Product');
    expect(retrieved.precio).toBe(10000);
  });

  it('updates a product field', async () => {
    await db.products.add(DEMO_PRODUCT);
    await db.products.update('TST-001', { stock: 99 });
    const updated = await db.products.get('TST-001');
    expect(updated.stock).toBe(99);
  });

  it('bulk replaces the entire products table', async () => {
    await db.products.add(DEMO_PRODUCT);
    const replacement = [{ ...DEMO_PRODUCT, sku: 'TST-002', nombre: 'Replacement' }];
    await db.transaction('rw', db.products, async () => {
      await db.products.clear();
      await db.products.bulkAdd(replacement);
    });
    const all = await db.products.toArray();
    expect(all.length).toBe(1);
    expect(all[0].sku).toBe('TST-002');
  });

  it('counts products correctly', async () => {
    expect(await db.products.count()).toBe(0);
    await db.products.add(DEMO_PRODUCT);
    expect(await db.products.count()).toBe(1);
  });
});

describe('Dexie sales round-trip', () => {
  let db;

  beforeEach(async () => {
    db = buildTestDb();
    await db.open();
  });

  it('adds and retrieves a sale by ID', async () => {
    await db.sales.add(DEMO_SALE);
    const retrieved = await db.sales.get('VTA-TEST1');
    expect(retrieved).toBeDefined();
    expect(retrieved.total).toBe(10000);
    expect(retrieved.estado).toBe('Completada');
  });

  it('puts (upserts) a sale to update estado', async () => {
    await db.sales.add(DEMO_SALE);
    const returned = { ...DEMO_SALE, estado: 'Devuelto' };
    await db.sales.put(returned);
    const retrieved = await db.sales.get('VTA-TEST1');
    expect(retrieved.estado).toBe('Devuelto');
  });

  it('retrieves sales ordered by fecha descending', async () => {
    const sale1 = { ...DEMO_SALE, id: 'VTA-A', fecha: 1000 };
    const sale2 = { ...DEMO_SALE, id: 'VTA-B', fecha: 2000 };
    await db.sales.bulkAdd([sale1, sale2]);
    const all = await db.sales.orderBy('fecha').reverse().toArray();
    expect(all[0].id).toBe('VTA-B');
    expect(all[1].id).toBe('VTA-A');
  });
});

describe('Dexie config round-trip', () => {
  let db;

  beforeEach(async () => {
    db = buildTestDb();
    await db.open();
  });

  it('stores and retrieves a config value', async () => {
    await db.config.put({ key: 'appConfig', value: { vendedor: 'Ana' } });
    const item = await db.config.get('appConfig');
    expect(item.value.vendedor).toBe('Ana');
  });

  it('returns undefined for missing config key', async () => {
    const item = await db.config.get('nonexistent');
    expect(item).toBeUndefined();
  });

  it('overwrites existing config on put', async () => {
    await db.config.put({ key: 'appConfig', value: { vendedor: 'Ana' } });
    await db.config.put({ key: 'appConfig', value: { vendedor: 'Pablo' } });
    const item = await db.config.get('appConfig');
    expect(item.value.vendedor).toBe('Pablo');
  });
});
