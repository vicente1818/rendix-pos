import { useEffect, useRef } from "react";

/**
 * Global Barcode Scanner Listener Hook for HID USB & Bluetooth Scanners
 * Intercepts rapid key sequences (< 40ms inter-character latency)
 */
export function useBarcodeScanner({ onScan, enabled = true }) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(Date.now());

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
          onScan(bufferRef.current);
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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan, enabled]);
}
