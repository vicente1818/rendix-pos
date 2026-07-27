import Dexie from "dexie";
import { DEMO_PRODUCTS } from "./constants.js";

export const db = new Dexie("RendixPOSDatabase");

db.version(1).stores({
  products: "sku, nombre, cat, activo, stock",
  sales: "id, fecha, canal, vendedor, synced",
  config: "key",
  syncQueue: "id, action, status, createdAt"
});

export async function initDatabase() {
  try {
    const prodCount = await db.products.count();
    if (prodCount === 0) {
      await db.products.bulkAdd(DEMO_PRODUCTS);
    }
  } catch (e) {
    console.error("Dexie DB Init Error:", e);
  }
}

export async function getDbProducts() {
  return await db.products.toArray();
}

export async function saveDbProducts(products) {
  return await db.transaction("rw", db.products, async () => {
    await db.products.clear();
    await db.products.bulkAdd(products);
  });
}

export async function updateDbProduct(sku, updates) {
  return await db.products.update(sku, updates);
}

export async function getDbSales() {
  return await db.sales.orderBy("fecha").reverse().toArray();
}

export async function saveDbSale(sale) {
  return await db.sales.add(sale);
}

export async function getDbConfig(key, defaultValue = null) {
  const item = await db.config.get(key);
  return item ? item.value : defaultValue;
}

export async function setDbConfig(key, value) {
  return await db.config.put({ key, value });
}
