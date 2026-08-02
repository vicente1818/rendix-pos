import { db } from "./db.js";
import { postToSheets } from "./sheets.js";

/**
 * Queue or sync an action to Google Sheets with IndexedDB Outbox fallback
 */
export async function queueOrSyncAction(type, payload) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    const success = await postToSheets(type, payload);
    if (success) {
      return true;
    }
  }

  // Queue into IndexedDB outbox if offline or if network request failed
  try {
    await db.syncQueue.add({
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: type,
      payload,
      status: "pending",
      createdAt: new Date().toISOString()
    });
    console.log(`[SyncManager] Action '${type}' queued offline into Dexie outbox.`);
    return false;
  } catch (e) {
    console.error("[SyncManager] Error writing to Dexie outbox:", e);
    return false;
  }
}

/**
 * Flush all pending actions in outbox queue
 */
export async function flushSyncQueue() {
  if (!navigator.onLine) return;

  try {
    const pending = await db.syncQueue.where("status").equals("pending").toArray();
    if (!pending.length) return;

    console.log(`[SyncManager] Flushing ${pending.length} pending actions...`);

    for (const item of pending) {
      try {
        const ok = await postToSheets(item.action, item.payload);
        if (ok) {
          await db.syncQueue.delete(item.id);
          console.log(`[SyncManager] Action ${item.id} synced successfully.`);
        }
      } catch (err) {
        console.warn(`[SyncManager] Retry failed for ${item.id}:`, err);
      }
    }
  } catch (e) {
    console.error('[SyncManager] flushSyncQueue IndexedDB error:', e);
  }
}

/**
 * Initialize auto-flush listeners on network recovery
 */
export function initSyncManager() {
  window.addEventListener("online", () => {
    console.log("[SyncManager] Network restored. Flushing outbox queue...");
    flushSyncQueue().catch(e => console.error('[SyncManager] flush failed:', e));
  });

  if (navigator.onLine) {
    flushSyncQueue().catch(e => console.error('[SyncManager] flush failed:', e));
  }
}
