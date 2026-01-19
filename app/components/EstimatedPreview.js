'use client';
import Image from 'next/image';
import React from 'react';
import { numberToWords } from '../utils/numberConverter';

const EstimatedPreview = ({ data, showGst }) => {
  const safeData = {
    billTo: data?.billTo || '',
    billNo: data?.billNo || '',
    billDate: data?.billDate || '',
    paidAmount: data?.paidAmount || 0,
    items: data?.items || [],
    paymentInstructions: data?.paymentInstructions || '',
    terms: data?.terms || '',
  };

  const calculateRowTotal = (qty, rate, gst) => {
    const base = (qty || 0) * (rate || 0);
    if (!showGst) return base;
    const tax = base * ((gst || 0) / 100);
    return base + tax;
  };

  const totalQty = safeData.items.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);
  const subTotalRaw = safeData.items.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.rate) || 0)), 0);
  const gstTotal = safeData.items.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.rate) || 0) * ((item.gst || 0) / 100)), 0);

  const subTotal = subTotalRaw; 
  const total = showGst ? (subTotal + gstTotal) : subTotal; // If GST off, total is just subtotal (no tax)
  const paid = Number(safeData.paidAmount) || 0; 
  const balanceDue = total - paid;

  return (
    <div className="bg-[#fdfbf6] shadow-2xl mx-auto w-[210mm] min-h-[297mm] p-8 text-black font-sans relative">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-wider mb-4">EST</h1>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div className="text-sm space-y-1">
           <h2 className="text-xl font-bold mb-1">Champion Security System</h2>
           <p>Office No- 21A, Gr Floor, New Apollo Estate</p>
           <p>Mogra Lane, Andheri East, Mumbai, Maharashtra 400069</p>
           <p>Trademark No- 5290052</p>
           <p>Mobile: 8080808109---8080808288</p>
           <p>Email: info@championsecuritysystem.com</p>
           <p>https://championsecuritysystem.com/</p>
           <p>GSTIN: 27AHXPD7350C1Z8</p>
        </div>
        <div>
            {/* Logo placeholder - using the same logo url as other pages if available */}
             <div className="w-24 h-24 relative">
                <img 
                    src="https://championsecuritysystem.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.e3798401.png&w=384&q=75" 
                    alt="Logo" 
                    className="object-contain w-full h-full"
                />
            </div>
        </div>
      </div>

      {/* Bill To & Details */}
      <div className="flex justify-between items-start mb-6 border-t border-gray-300 pt-4">
        <div className="w-1/2">
            <h3 className="font-bold text-lg mb-1">Bill To</h3>
            <div className="whitespace-pre-wrap text-sm">{safeData.billTo}</div>
        </div>
        <div className="w-1/2 flex flex-col items-end">
             <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-1 text-right">
                <span className="font-bold">Bill No :</span>
                <span className="font-bold">{safeData.billNo}</span>
                
                <span className="font-bold">Bill Date :</span>
                <span>{new Date(safeData.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
             </div>
        </div>
      </div>

      {/* Table */}
      <div className="mb-6">
        <table className="w-full text-sm table-fixed">
            <thead>
                <tr className="bg-blue-100/50 border-b border-gray-200">
                    <th className="py-2 text-left font-bold pl-2 w-10">Sr</th>
                    <th className="py-2 text-left font-bold w-64">Description</th>
                    <th className="py-2 text-left font-bold w-20">Make</th>
                    <th className="py-2 text-left font-bold w-24">SN.no</th>
                    <th className="py-2 text-center font-bold w-12">Qty</th>
                    <th className="py-2 text-right font-bold pr-2 w-24">Rate</th>
                    {showGst && <th className="py-2 text-center font-bold w-12">GST%</th>}
                    <th className="py-2 text-right font-bold pr-2 w-24">Amount</th>
                </tr>
            </thead>
            <tbody>
                {safeData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 pl-2 align-top">{index + 1}</td>
                        <td className="py-3 align-top whitespace-pre-wrap break-words pr-2">{item.description}</td>
                        <td className="py-3 align-top">{item.make}</td>
                        <td className="py-3 align-top whitespace-pre-wrap text-xs break-all">{item.sn}</td>
                        <td className="py-3 text-center align-top">{item.qty}</td>
                        <td className="py-3 text-right align-top pr-2">₹ {Number(item.rate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        {showGst && <td className="py-3 text-center align-top">{item.gst || 0}%</td>}
                        <td className="py-3 text-right align-top pr-2">₹ {calculateRowTotal(item.qty, item.rate, item.gst).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Footer Totals */}
      <div className="flex justify-between items-start mb-8 border-t border-gray-200 pt-4">
         <div className="w-1/2">
             <p className="font-bold mb-4">Total Quantity : {totalQty}</p>
             
             <div className="mb-6">
                 <h4 className="font-bold mb-2">Payment Instructions</h4>
                 <div className="whitespace-pre-wrap text-sm text-gray-700">
                     {safeData.paymentInstructions || 'Pay Cheque to\nChampion security system'}
                 </div>
             </div>

             <div className="mb-4">
                 <p className="text-gray-600 text-xs italic mb-1">Total Amount (in words) :</p>
                 <p className="font-medium">{numberToWords(Math.round(balanceDue))} Only</p>
             </div>
         </div>

         <div className="w-1/3">
             <div className="space-y-2 text-right border-b border-gray-200 pb-4 mb-4">
                 <div className="flex justify-between font-bold">
                     <span>Subtotal</span>
                     <span>₹ {subTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                 </div>
                 {showGst && (
                    <div className="flex justify-between text-gray-600 border-b border-gray-100 pb-2">
                         <span>GST Tax</span>
                         <span>₹ {gstTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                 )}
             </div>
             <div className="space-y-2 text-right">
                 <div className="flex justify-between font-bold">
                     <span>Total</span>
                     <span>₹ {total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between text-gray-600">
                     <span>Paid</span>
                     <span>₹ {paid.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between font-bold text-lg">
                     <span>Balance Due</span>
                     <span>₹ {balanceDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                 </div>
             </div>
         </div>
      </div>

      {/* Terms & Signature */}
      <div className="flex justify-between items-end mt-auto pt-10">
          <div className="max-w-[60%] text-xs">
              <h4 className="font-bold mb-2">Term & Conditions</h4>
              <p className="font-bold mb-1">Terms & Conditions</p>
              <div className="whitespace-pre-wrap space-y-1 text-gray-800">
                  {safeData.terms || `1. Good once sold Will not be taken back or exchanged
2. Seller is not responsible for any loss or damaged of good in transit
3. 100% Advance payment
4. Interest will be charged @ 20% p.a. if bill not paid within due date
5. Damage And Repair Not Cover In Warranty`}
              </div>
          </div>
          
          <div className="text-center">
              {/* Signature Image Placeholder */}
              <div className="mb-2 flex justify-center">
                  {/* Replace with actual signature if available, or keep generic */}
                  <img src="https://championsecuritysystem.com/signature.png" alt="Signature" className="h-16 object-contain opacity-80" onError={(e) => e.target.style.display = 'none'}/> 
              </div>
              <p className="font-bold text-sm">Authorized Signatory</p>
          </div>
      </div>

    </div>
  );
};

export default EstimatedPreview;
