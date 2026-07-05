"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import ReceiptPreview from './ReceiptPreview';

// Preview + print overlay for a single payment, reusing the same visual format
// as /receipts. Rendered through a portal onto document.body so it escapes the
// nested EstimatePaymentModal's fixed/flex layout (which otherwise squished the
// A4 sheet and printed the payment form alongside it). Purely presentational.
export default function PaymentReceiptModal({ isOpen, onClose, receiptData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !receiptData || !mounted) return null;

  const overlay = (
    <div
      className="payment-receipt-overlay fixed inset-0 flex flex-col bg-black/60 backdrop-blur-sm"
      style={{ zIndex: 2000 }}
    >
      {/* Toolbar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 print:hidden">
        <h2 className="text-lg font-bold text-slate-800">Receipt Preview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scaled preview (screen). In print, the global rules below hide everything
          except this overlay and collapse it to normal flow so the A4 receipt
          paginates as a full page. */}
      <div className="payment-receipt-scroll flex-1 overflow-y-auto overflow-x-auto bg-gray-200 p-4 md:p-8 flex justify-center">
        <div className="receipt-print-wrapper transform scale-[0.5] sm:scale-[0.6] md:scale-[0.65] lg:scale-[0.8] xl:scale-100 origin-top transition-transform duration-300 ease-out">
          <ReceiptPreview data={receiptData} />
        </div>
      </div>

      <style>{`
        @media print {
          /* Hide the entire app (including the Record Payment modal); print only the receipt. */
          body > *:not(.payment-receipt-overlay) { display: none !important; }
          .payment-receipt-overlay {
            position: static !important;
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
          .payment-receipt-scroll {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }
          .receipt-print-wrapper { transform: none !important; }
        }
      `}</style>
    </div>
  );

  return createPortal(overlay, document.body);
}
