export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light', enabled = true) {
  if (!enabled || typeof window === 'undefined') return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate([18, 30, 18]);
          break;
        case 'success':
          navigator.vibrate([10, 40, 25]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
      }
    }
  } catch (e) {
    // Graceful ignore if unsupported or permission blocked in iframe
  }
}
