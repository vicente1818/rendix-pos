/**
 * Inventory & Financial Analytics Engine (FEFO, ROP, MAC & LTV)
 */

/**
 * Calculates Reorder Point (ROP) for stock replenishment alerts
 * ROP = (Average Daily Usage * Lead Time Days) + Safety Stock
 */
export function calculateROP(avgDailyUsage = 1, leadTimeDays = 3, safetyStock = 5) {
  return Math.ceil((avgDailyUsage * leadTimeDays) + safetyStock);
}

/**
 * Recalculates Moving Average Cost (MAC) upon receiving new stock
 */
export function calculateMAC(currentStock, currentCost, newQty, newCost) {
  const totalStock = currentStock + newQty;
  if (totalStock <= 0) return newCost;
  return ((currentStock * currentCost) + (newQty * newCost)) / totalStock;
}

/**
 * Calculates Customer Loyalty Points (1 point per $100 spent)
 */
export function calculateCustomerPoints(totalSpent = 0) {
  return Math.floor(totalSpent / 100);
}

/**
 * Determines Customer VIP Tier based on Lifetime Spend
 */
export function calculateCustomerTier(totalSpent = 0) {
  if (totalSpent >= 500000) return { name: "Platinum VIP", color: "var(--accent-purple)", discountPct: 15 };
  if (totalSpent >= 200000) return { name: "Gold", color: "var(--status-warning)", discountPct: 10 };
  if (totalSpent >= 50000) return { name: "Silver", color: "var(--accent-cyan)", discountPct: 5 };
  return { name: "Bronze", color: "var(--text-secondary)", discountPct: 0 };
}

/**
 * Evaluates FEFO expiration alert for products (returns days remaining)
 */
export function checkExpirationAlert(expiryDateStr) {
  if (!expiryDateStr) return null;
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return { status: "EXPIRED", days: diffDays, color: "var(--status-danger)" };
  if (diffDays <= 30) return { status: "WARNING", days: diffDays, color: "var(--status-warning)" };
  return { status: "OK", days: diffDays, color: "var(--status-success)" };
}
