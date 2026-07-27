export function useHaptic() {
  const trigger = (pattern) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Fallback for devices without vibration support
      }
    }
  };

  return {
    hapticAdd: () => trigger([12]),
    hapticRemove: () => trigger([20, 10, 15]),
    hapticClear: () => trigger([40, 30, 40]),
    hapticSuccess: () => trigger([30, 50, 30, 50, 60]),
    hapticError: () => trigger([80, 40, 80]),
    hapticTab: () => trigger([8])
  };
}
