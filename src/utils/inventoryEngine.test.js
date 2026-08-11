import { describe, it, expect, vi, afterEach } from "vitest";
import {
  calculateROP,
  calculateMAC,
  calculateCustomerPoints,
  calculateCustomerTier,
  checkExpirationAlert,
} from "./inventoryEngine.js";

describe("calculateROP", () => {
  it("suma uso diario * lead time + stock de seguridad", () => {
    expect(calculateROP(2, 5, 5)).toBe(15);
  });

  it("usa los valores por defecto cuando no se pasan argumentos", () => {
    expect(calculateROP()).toBe(8); // (1*3)+5
  });

  it("redondea hacia arriba", () => {
    expect(calculateROP(1.5, 3, 0)).toBe(5); // 4.5 -> 5
  });
});

describe("calculateMAC", () => {
  it("promedia el costo ponderado por cantidad", () => {
    // 10 unidades a $100 + 10 unidades a $200 => costo promedio $150
    expect(calculateMAC(10, 100, 10, 200)).toBe(150);
  });

  it("devuelve el nuevo costo si no había stock previo", () => {
    expect(calculateMAC(0, 0, 5, 300)).toBe(300);
  });

  it("devuelve el nuevo costo si el stock total queda en cero", () => {
    expect(calculateMAC(0, 0, 0, 300)).toBe(300);
  });
});

describe("calculateCustomerPoints", () => {
  it("otorga 1 punto cada $100 gastados", () => {
    expect(calculateCustomerPoints(950)).toBe(9);
  });

  it("devuelve 0 sin gasto", () => {
    expect(calculateCustomerPoints()).toBe(0);
  });
});

describe("calculateCustomerTier", () => {
  it("clasifica Bronze por defecto", () => {
    expect(calculateCustomerTier(0).name).toBe("Bronze");
  });

  it("clasifica Silver a partir de 50000", () => {
    expect(calculateCustomerTier(50000).name).toBe("Silver");
  });

  it("clasifica Gold a partir de 200000", () => {
    expect(calculateCustomerTier(200000).name).toBe("Gold");
  });

  it("clasifica Platinum VIP a partir de 500000", () => {
    const tier = calculateCustomerTier(500000);
    expect(tier.name).toBe("Platinum VIP");
    expect(tier.discountPct).toBe(15);
  });
});

describe("checkExpirationAlert", () => {
  afterEach(() => vi.useRealTimers());

  it("devuelve null si no hay fecha de vencimiento", () => {
    expect(checkExpirationAlert(null)).toBeNull();
  });

  it("marca EXPIRED si la fecha ya pasó", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00Z"));
    const res = checkExpirationAlert("2026-01-01T00:00:00Z");
    expect(res.status).toBe("EXPIRED");
  });

  it("marca WARNING si vence dentro de 30 días", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const res = checkExpirationAlert("2026-01-20T00:00:00Z");
    expect(res.status).toBe("WARNING");
  });

  it("marca OK si vence en más de 30 días", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const res = checkExpirationAlert("2026-06-01T00:00:00Z");
    expect(res.status).toBe("OK");
  });
});
