'use client';

import { Toaster } from 'sonner';

export default function ToasterProvider() {
  return (
    <Toaster 
      position="top-center" 
      richColors 
      closeButton
      toastOptions={{
        style: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif'
        },
        className: 'font-medium',
      }}
    />
  );
}
