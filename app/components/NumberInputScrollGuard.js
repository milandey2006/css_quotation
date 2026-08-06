'use client';
import { useEffect } from 'react';

// Browsers change a focused number input's value on mouse-wheel scroll, which
// is easy to trigger by accident while scrolling the page over a form. Blur
// the input on wheel so the page scrolls normally instead of the value ticking.
export default function NumberInputScrollGuard() {
  useEffect(() => {
    const handleWheel = () => {
      const el = document.activeElement;
      if (el && el.tagName === 'INPUT' && el.type === 'number') {
        el.blur();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: true });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  return null;
}
