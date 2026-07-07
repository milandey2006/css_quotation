"use client";
import React from 'react';
import { numberToWords } from '../utils/numberConverter';

// Company details (Champion Security System) shown on every receipt.
const COMPANY = {
  name: 'Champion Security System',
  address: [
    'Office No- 21A, Gr Floor, New Apollo Estate',
    'Mogra Lane, Andheri East, Mumbai, Maharashtra 400069',
  ],
  trademark: '5290052',
  mobile: '8080808109---8080806288',
  email: 'info@championsecuritysystem.com',
  website: 'https://championsecuritysystem.com/',
  gstin: '27AHXPD7350C1Z8',
  logo: 'https://championsecuritysystem.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.e3798401.png&w=384&q=75',
};

// "Three Thousand Five Hundred Rupees Only" (matches the reference receipt wording)
const amountInWords = (n) => {
  if (!n || n <= 0) return '';
  const raw = numberToWords(Math.round(n)); // "Rupees X Only"
  const core = raw.replace(/^Rupees\s*/i, '').replace(/\s*Only$/i, '').trim();
  return `${core} Rupees Only`;
};

const ReceiptPreview = React.forwardRef(({ data }, ref) => {
  const d = data || {};
  const amount = Number(d.amount) || 0;
  const description = d.description || (d.invoiceNo ? `Invoice #${d.invoiceNo}` : 'Payment received');
  const formattedDate = d.date
    ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const money = (v) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const MetaRow = ({ label, value }) => (
    <div style={{ display: 'flex', columnGap: 16 }}>
      <div style={{ width: 120, minWidth: 120, fontWeight: 700, color: '#000' }}>{label}</div>
      <div style={{ color: '#1f2937', wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center bg-transparent print:bg-white">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          /* The on-screen scale wrapper (scale-[0.5] sm:scale-[0.6] ... ) can still match a
             responsive breakpoint during print rendering, and Tailwind's print:transform-none
             doesn't reliably win that specificity fight. Force it off unconditionally instead. */
          .receipt-print-wrapper { transform: none !important; }
          /* Force the sheet to a full, exact A4 height so the mt-auto signature block
             reaches the very bottom of the page (min-height alone was collapsing through
             the nested wrappers, leaving the content clustered in the top half). */
          .receipt-a4-sheet {
            height: 297mm !important;
            min-height: 297mm !important;
            width: 210mm !important;
            overflow: hidden !important;
          }
        `}
      </style>

      <div ref={ref} className="receipt-a4-sheet bg-white mx-auto w-[210mm] min-h-[297mm] p-[15mm] text-[13px] leading-relaxed text-black shadow-lg border border-gray-200 relative flex flex-col print:shadow-none print:border-none print:w-full print:min-h-[297mm]">

        {/* Title + Logo */}
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">Payment Receipt</h1>
          <img src={COMPANY.logo} alt="logo" className="w-16 h-16 object-contain" />
        </div>

        {/* Company block */}
        <div className="mb-10 text-[13px] text-gray-800 leading-6">
          <div className="text-lg font-bold text-black mb-1">{COMPANY.name}</div>
          {COMPANY.address.map((line, i) => <div key={i}>{line}</div>)}
          <div>Trademark No- {COMPANY.trademark}</div>
          <div>Mobile: {COMPANY.mobile}</div>
          <div>Email: {COMPANY.email}</div>
          <div>{COMPANY.website}</div>
          <div>GSTIN: {COMPANY.gstin}</div>
        </div>

        {/* To + Meta */}
        <div className="flex justify-between mb-10 gap-8">
          <div className="text-[13px]">
            <div className="font-bold text-black mb-1">To:</div>
            <div className="text-gray-900 font-semibold">{d.clientName || '—'}</div>
            {d.clientAddress && (
              <div className="text-gray-800 whitespace-pre-wrap">{d.clientAddress}</div>
            )}
          </div>

          <div className="text-[13px] space-y-1 min-w-[300px]">
            <MetaRow label="Payment Date" value={formattedDate} />
            <MetaRow label="Invoice No." value={d.invoiceNo} />
            <MetaRow label="Billing Ref" value={d.billingRef} />
            <MetaRow label="Payment Method" value={d.method} />
          </div>
        </div>

        {/* Items table */}
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-100 border border-gray-300">
              <th className="text-left font-bold p-3 border-r border-gray-300">Description</th>
              <th className="text-center font-bold p-3 border-r border-gray-300 w-[70px]">Qty</th>
              <th className="text-right font-bold p-3 border-r border-gray-300 w-[130px]">Rate</th>
              <th className="text-right font-bold p-3 w-[130px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border border-gray-300">
              <td className="p-3 border-r border-gray-300 align-top">{description}</td>
              <td className="p-3 border-r border-gray-300 text-center align-top">1</td>
              <td className="p-3 border-r border-gray-300 text-right align-top">{money(amount)}</td>
              <td className="p-3 text-right align-top">{money(amount)}</td>
            </tr>
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mt-4">
          <div className="w-[260px] flex justify-between items-center border-t-2 border-gray-300 pt-3">
            <span className="font-bold text-black text-[15px]">Total</span>
            <span className="font-bold text-black text-[15px]">{money(amount)}</span>
          </div>
        </div>

        {/* Amount in words */}
        <div className="mt-8 text-[13px]">
          <span className="font-bold text-black">Amount</span>
          <span className="text-gray-900">: {amount > 0 ? amountInWords(amount) : '—'}</span>
        </div>

        {/* Note (optional) */}
        {d.note && (
          <div className="mt-2 text-[12px] text-gray-500">
            <span className="font-semibold">Ref/Note:</span> {d.note}
          </div>
        )}

        {/* Footer / signature -- pushed to the bottom of the A4 sheet so the
            receipt fills the full page instead of clustering at the top. */}
        <div className="mt-auto pt-16">
          <div className="flex justify-between items-end">
            <div className="text-[12px] text-gray-500 max-w-[55%]">
              <p className="italic">Thank you for your payment.</p>
              <p className="italic mt-1">Subject to realisation of cheque / bank transfer.</p>
            </div>
            <div className="text-center w-[220px]">
              <p className="font-bold text-[13px] text-black mb-3">FOR CHAMPION SECURITY SYSTEM</p>
              <div className="h-16 flex items-center justify-center mb-1">
                <img src="/sign/signature.png" alt="Signature" className="max-h-full max-w-full object-contain" />
              </div>
              <p className="font-bold text-[13px] text-black border-t border-black pt-1">AUTHORISED SIGNATORY</p>
            </div>
          </div>
          <div className="text-center mt-8 border-t border-gray-200 pt-2">
            <p className="text-[10px] text-gray-400 italic">This is a computer generated receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
});

ReceiptPreview.displayName = 'ReceiptPreview';

export default ReceiptPreview;
