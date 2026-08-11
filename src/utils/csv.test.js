import { describe, it, expect } from "vitest";
import { parseSpanishFloat, parseCSVLine, importCatalogFromCSV } from "./csv.js";

describe("parseSpanishFloat", () => {
  it("interpreta coma como separador decimal", () => {
    expect(parseSpanishFloat("1234,56")).toBe(1234.56);
  });

  it("interpreta punto como miles y coma como decimal", () => {
    expect(parseSpanishFloat("1.234,56")).toBe(1234.56);
  });

  it("interpreta coma como miles cuando el punto va después", () => {
    expect(parseSpanishFloat("1,234.56")).toBe(1234.56);
  });

  it("ignora símbolo de moneda y espacios", () => {
    expect(parseSpanishFloat("$ 1.500,50")).toBe(1500.5);
  });

  it("devuelve 0 para valores vacíos o inválidos", () => {
    expect(parseSpanishFloat("")).toBe(0);
    expect(parseSpanishFloat("abc")).toBe(0);
  });
});

describe("parseCSVLine", () => {
  it("separa columnas simples por coma", () => {
    expect(parseCSVLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("respeta comas dentro de comillas", () => {
    expect(parseCSVLine('"Producto, con coma",10')).toEqual(["Producto, con coma", "10"]);
  });

  it("des-escapa comillas dobles", () => {
    expect(parseCSVLine('"Dice ""hola""",1')).toEqual(['Dice "hola"', "1"]);
  });
});

describe("importCatalogFromCSV", () => {
  const existing = [
    { sku: "ABC", nombre: "Producto viejo", precio: 100, stock: 5, stockMin: 3, cat: "Suplementos", marca: "", pres: "", activo: true },
  ];

  it("rechaza un archivo sin filas de datos", () => {
    const res = importCatalogFromCSV("SKU,Nombre,Precio\n", existing);
    expect(res.ok).toBe(false);
  });

  it("rechaza un archivo sin columnas obligatorias", () => {
    const res = importCatalogFromCSV("Color,Talle\nRojo,M\n", existing);
    expect(res.ok).toBe(false);
  });

  it("importa productos nuevos y actualiza los existentes por SKU", () => {
    const csv = "SKU,Nombre,Precio,Stock\nABC,Producto actualizado,150,20\nXYZ,Producto nuevo,300,10\n";
    const res = importCatalogFromCSV(csv, existing);
    expect(res.ok).toBe(true);
    expect(res.imported).toBe(1);
    expect(res.updated).toBe(1);

    const abc = res.products.find(p => p.sku === "ABC");
    expect(abc.precio).toBe(150);
    expect(abc.stock).toBe(20);

    const xyz = res.products.find(p => p.sku === "XYZ");
    expect(xyz.precio).toBe(300);
  });

  it("conserva el stock existente si el CSV no trae columna de stock", () => {
    const csv = "SKU,Nombre,Precio\nABC,Producto actualizado,150\n";
    const res = importCatalogFromCSV(csv, existing);
    const abc = res.products.find(p => p.sku === "ABC");
    expect(abc.stock).toBe(5);
  });
});
