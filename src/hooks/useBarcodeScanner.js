import { useEffect, useRef } from "react";

/**
 * Global Barcode Scanner Listener Hook for HID USB & Bluetooth Scanners
 * Intercepts rapid key sequences (< 40ms inter-character latency)
 *
 * Memory-leak fix: onScan is stored in a ref so the event-listener effect only
 * re-runs when `enabled` changes, not on every parent render that produces a new
 * onScan function reference. The ref keeps the callback current without
 * re-registering the listener on the global window object.
 */
export function useBarcodeScanner({ onScan, enabled = true }) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(Date.now());
  // Stable ref for the callback — avoids adding onScan to the effect deps which
  // would cause the listener to be removed + re-added on every parent re-render.
  const onScanRef = useRef(onScan);

  // Keep the ref pointing to the latest version of onScan without triggering
  // listener re-registration.
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      const targetTag = e.target.tagName.toLowerCase();
      // Ignore if user is typing in a standard input or textarea (unless it's an explicit search field)
      if (targetTag === "textarea" || (targetTag === "input" && e.target.type !== "search" && e.target.type !== "text")) {
        return;
      }

      if (e.key === "Enter") {
        if (bufferRef.current.length >= 3) {
          onScanRef.current(bufferRef.current);
          bufferRef.current = "";
          e.preventDefault();
        }
        return;
      }

      // Barcode scanners input characters in rapid bursts (< 40ms)
      if (timeDiff > 50) {
        bufferRef.current = "";
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup removes the listener when enabled toggles or the component unmounts,
    // preventing the event handler from persisting beyond the component's lifetime.
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]); // onScan intentionally omitted — tracked via onScanRef above
}
