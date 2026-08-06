import React from 'react';
import { amountInWords } from '../lib/numberToWords';
import { LOGO, SIGNATURE } from '../lib/receiptAssets';

// A4-sized replica of the web dashboard's ReceiptPreview so a receipt raised
// from the phone looks identical to one raised from the office.
// Uses inline styles (not Tailwind) because this node is serialised by
// modern-screenshot for PNG/JPEG/PDF export — inline styles capture reliably.
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
};

const money = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MetaRow = ({ label, value }) => (
  <div style={{ display: 'flex', columnGap: 16, marginBottom: 4 }}>
    <div style={{ width: 120, minWidth: 120, fontWeight: 700, color: '#000' }}>{label}</div>
    <div style={{ color: '#1f2937', wordBreak: 'break-word' }}>{value || '—'}</div>
  </div>
);

const ReceiptDocument = React.forwardRef(({ data }, ref) => {
  const d = data || {};
  const amount = Number(d.amount) || 0;
  const description = d.description || (d.invoiceNo ? `Invoice #${d.invoiceNo}` : 'Payment received');
  const formattedDate = d.date
    ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const th = {
    fontWeight: 700,
    padding: 12,
    borderRight: '1px solid #d1d5db',
    background: '#f3f4f6',
  };
  const td = { padding: 12, borderRight: '1px solid #d1d5db', verticalAlign: 'top' };

  return (
    <div
      ref={ref}
      style={{
        width: '794px', // A4 at 96dpi
        minHeight: '1123px',
        background: '#fff',
        color: '#000',
        padding: '56px',
        fontSize: 13,
        lineHeight: 1.6,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title + logo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Payment Receipt</h1>
        <img src={LOGO} alt="logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
      </div>

      {/* Company block */}
      <div style={{ marginBottom: 40, color: '#1f2937' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#000', marginBottom: 4 }}>{COMPANY.name}</div>
        {COMPANY.address.map((line, i) => <div key={i}>{line}</div>)}
        <div>Trademark No- {COMPANY.trademark}</div>
        <div>Mobile: {COMPANY.mobile}</div>
        <div>Email: {COMPANY.email}</div>
        <div>{COMPANY.website}</div>
        <div>GSTIN: {COMPANY.gstin}</div>
      </div>

      {/* To + meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, marginBottom: 40 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#000', marginBottom: 4 }}>To:</div>
          <div style={{ color: '#111827', fontWeight: 600 }}>{d.clientName || '—'}</div>
          {d.clientAddress && <div style={{ color: '#1f2937', whiteSpace: 'pre-wrap' }}>{d.clientAddress}</div>}
        </div>
        <div style={{ minWidth: 300 }}>
          <MetaRow label="Payment Date" value={formattedDate} />
          <MetaRow label="Invoice No." value={d.invoiceNo} />
          <MetaRow label="Billing Ref" value={d.billingRef} />
          <MetaRow label="Payment Method" value={d.method} />
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ border: '1px solid #d1d5db' }}>
            <th style={{ ...th, textAlign: 'left' }}>Description</th>
            <th style={{ ...th, textAlign: 'center', width: 70 }}>Qty</th>
            <th style={{ ...th, textAlign: 'right', width: 130 }}>Rate</th>
            <th style={{ ...th, textAlign: 'right', width: 130, borderRight: 'none' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ border: '1px solid #d1d5db' }}>
            <td style={td}>{description}</td>
            <td style={{ ...td, textAlign: 'center' }}>1</td>
            <td style={{ ...td, textAlign: 'right' }}>{money(amount)}</td>
            <td style={{ ...td, textAlign: 'right', borderRight: 'none' }}>{money(amount)}</td>
          </tr>
        </tbody>
      </table>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div
          style={{
            width: 260,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid #d1d5db',
            paddingTop: 12,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{money(amount)}</span>
        </div>
      </div>

      {/* Amount in words */}
      <div style={{ marginTop: 32 }}>
        <span style={{ fontWeight: 700 }}>Amount</span>
        <span style={{ color: '#111827' }}>: {amount > 0 ? amountInWords(amount) : '—'}</span>
      </div>

      {d.note && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
          <span style={{ fontWeight: 600 }}>Ref/Note:</span> {d.note}
        </div>
      )}

      {/* Footer / signature pinned to the bottom of the sheet */}
      <div style={{ marginTop: 'auto', paddingTop: 64 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 12, color: '#6b7280', maxWidth: '55%' }}>
            <p style={{ fontStyle: 'italic', margin: 0 }}>Thank you for your payment.</p>
            <p style={{ fontStyle: 'italic', margin: '4px 0 0' }}>Subject to realisation of cheque / bank transfer.</p>
          </div>
          <div style={{ textAlign: 'center', width: 220 }}>
            <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 12px' }}>FOR CHAMPION SECURITY SYSTEM</p>
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <img
                src={SIGNATURE}
                alt="Signature"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
            <p style={{ fontWeight: 700, fontSize: 13, borderTop: '1px solid #000', paddingTop: 4, margin: 0 }}>
              AUTHORISED SIGNATORY
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          <p style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
            This is a computer generated receipt.
          </p>
        </div>
      </div>
    </div>
  );
});

ReceiptDocument.displayName = 'ReceiptDocument';

export default ReceiptDocument;
