export async function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch (e) {
    console.warn("Storage save error:", e);
    return false;
  }
}
