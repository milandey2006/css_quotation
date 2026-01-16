"use client";
import Image from 'next/image';
import React from 'react';
import { numberToWords } from '../utils/numberConverter';

const QuotationPreview = ({ data }) => {
  // --- Calculations ---
  const calculateRowTotal = (qty, price, gst) => {
    const base = qty * price;
    const tax = base * (gst / 100);
    return base + tax;
  };

  const subTotal = data.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const gstTotal = data.items.reduce((acc, item) => acc + ((item.qty * item.price) * (item.gst / 100)), 0);
  const grandTotal = subTotal + gstTotal;

  // --- Pagination Logic ---
  const ITEMS_PER_FIRST_PAGE = 6;
  const ITEMS_PER_PAGE = 10;

  const pages = [];
  const items = [...data.items];

  // First page chunk
  if (items.length > 0) {
    pages.push(items.splice(0, ITEMS_PER_FIRST_PAGE));
  } else {
    pages.push([]); // Empty page if no items
  }

  // Subsequent page chunks
  while (items.length > 0) {
    pages.push(items.splice(0, ITEMS_PER_PAGE));
  }

  // Force a new page for the Footer (Terms & Conditions, Signatures)
  // This page will have no items, just the footer content.
  pages.push([]); 
  
  // Helper to check if this is the last page
  const isLastPage = (index) => index === pages.length - 1;

  // Render Page Content
  const renderPage = (pageItems, pageIndex) => (
    <div 
      key={pageIndex} 
      className={`bg-white shadow-2xl mx-auto w-[210mm] min-h-[297mm] p-10 relative text-sm sm:text-base text-gray-800 mb-8 overflow-hidden print:shadow-none print:mb-0 print:w-full print:h-[296mm] print:overflow-hidden print:mx-0 ${pageIndex < pages.length - 1 ? 'print:break-after-page' : ''}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
       {/* Watermark (Repeated on every page for consistency) */}
       <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none z-0">
          <div className="w-[500px] h-[500px] flex items-center justify-center">
             <Image 
                 src="https://championsecuritysystem.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.e3798401.png&w=384&q=75" 
                 alt="watermark logo" 
                 width={400}
                 height={400}
                 className="object-contain" 
             />
          </div>
       </div>

       <div className="relative z-10 flex flex-col h-full justify-between">
         {/* Top Content Wrapper */}
         <div>
            {pageIndex === 0 ? (
                <>
                {/* Centered Header (Page 1) */}
                <div className="flex flex-col items-center mb-4 text-center">
                    <div className="flex items-center gap-4 mb-2">
                         <div className="w-16 h-16 flex items-center justify-center items-center">
                            <Image 
                                src="https://championsecuritysystem.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.e3798401.png&w=384&q=75" 
                                alt="company logo" 
                                width={350} 
                                height={350} 
                                className="object-contain"
                            />
                        </div>
                        <div className="text-center">
                           <h1 className="text-3xl font-bold text-blue-900">{data.sender.name}</h1>
                           <p className="text-sm font-semibold text-gray-800">CCTV.Intruder Alarm. Access Controls.Multi Apt.VDP.</p>
                        </div>
                    </div>
                    
                    <div className="text-sm text-blue-800 font-medium leading-tight">
                         <p className="mb-1">
                            Email: <a href={`mailto:${data.sender.email}`} className="underline">{data.sender.email}</a> 
                            <span className="mx-2">Web:</span><a href="https://championsecuritysystem.com" className="underline">https://championsecuritysystem.com</a>
                         </p>
                         <p className="mb-1 text-black font-bold">{data.sender.address}</p>
                         <p className="text-black font-bold">Mobile: {data.sender.phone}</p>
                    </div>
                </div>

                {/* Subject Line */}
                <div className="mb-6 text-center">
                    <h3 className="text-lg font-bold text-black underline uppercase tracking-wide">
                        {data.type === 'Proforma' ? 'PROFORMA INVOICE' : `Sub:- ${data.subject}`}
                    </h3>
                    {/* If Proforma, subject might be separate or part of title, but usually replaces title or sits below. User said "Title changes", assuming Subject line text changes or separate Title added. 
                        Let's keep Subject line as is but change text if user wants, or add Title above. 
                        User request: "title on the PDF will simply change from 'QUOTATION' to 'PROFORMA INVOICE'". 
                        Currently there is no explicit Title "QUOTATION" other than Subject "Sub:-...". 
                        Let's assume "Sub:- ..." remains for subject, but we might need a Header Title.
                        Actually, looking at current code, "Sub:- {data.subject}" IS the main bold header.
                        Let's just prepend "PROFORMA INVOICE" if type is Proforma, or let user decide subject.
                        The user request said: "instead of quotaion number PI no".
                        Let's just show Subject as usual, but maybe add a document title? 
                        The user said: "title on the PDF will simply change". 
                        Let's just rely on the "Quotation No" -> "PI No" change for now and maybe add a top header if needed.
                        Wait, usually Proforma Invoice is a big header. The current design has "Sub:-..." centered. 
                        Let's leave subject as is (user editable) but change the meta labels.
                    */}
                </div>

                {/* Quotation Info & Receiver (Modified Layout) */}
                <div className="flex justify-between items-start mb-6 px-8">
                     {/* Receiver Info (Restored Details) */}
                     <div className="text-sm text-gray-800 w-1/2">
                        <p className="font-bold text-lg text-blue-900">{data.receiver.company}</p>
                        <p className="font-semibold">{data.receiver.name}</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{data.receiver.address}</p>
                        {data.receiver.phone && <p className="font-semibold mt-1">Ph: {data.receiver.phone}</p>}
                        {data.receiver.gst && <p className="font-bold text-gray-800 mt-1">GSTIN: {data.receiver.gst}</p>}
                     </div>

                     {/* Quotation Meta (Restored Valid Till) */}
                     <div className="text-right text-sm font-bold text-gray-800 w-1/2">
                        <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 justify-end">
                            <span className="text-gray-600">{data.type === 'Proforma' ? 'PI No:' : 'Quotation No:'}</span>
                            <span>{data.quotationNo}</span>
                            
                            <span className="text-gray-600">Date:</span>
                            <span>{data.date}</span>
                            
                            <span className="text-gray-600">Valid Till:</span>
                            <span>{data.validTill}</span>

                            <span className="text-gray-600">GSTIN No:</span>
                            <span>{data.gstNo || '27AHXPD7350C1Z8'}</span>

                            {/* Company PAN Below GSTIN as requested */}
                            {data.sender.pan && (
                                <>
                                    <span className="text-gray-600">PAN No:</span>
                                    <span>{data.sender.pan}</span>
                                </>
                            )}
                        </div>
                     </div>
                </div>
                </>
            ) : (
                /* Minimal Header (Page 2+) */
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <div className="flex items-center gap-2 opacity-70">
                        <span className="font-bold text-blue-900">{data.sender.name}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">{data.type === 'Proforma' ? 'PI' : 'Quotation'}: {data.quotationNo}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Page {pageIndex + 1} of {pages.length}
                    </div>
                </div>
            )}

            {/* Items Table - Hide on last footer-only page if empty */}
            {pageItems.length > 0 && (
            <div className="mb-4 w-full">
                {/* Table Header (Repeated every page) */}
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-y border-slate-500 bg-slate-50 text-slate-900">
                            <th className="w-10 py-2 border-r border-slate-300 text-center font-bold">Sr.n</th>
                            <th className="px-3 py-2 border-r border-slate-300 text-left font-bold">Particulars</th>
                            {data.showImages && <th className="w-20 py-2 border-r border-slate-300 text-center font-bold">Image</th>}
                            <th className="w-16 py-2 border-r border-slate-300 text-center font-bold">HSN/SAC</th>
                            <th className="w-12 py-2 border-r border-slate-300 text-center font-bold">QTY</th>
                            <th className="w-20 py-2 border-r border-slate-300 text-right px-2 font-bold">Rate</th>
                            <th className="w-12 py-2 border-r border-slate-300 text-center font-bold">GST %</th>
                            <th className="w-24 py-2 border-r border-slate-300 text-right px-2 font-bold">Total</th>
                            <th className="w-20 py-2 text-center font-bold">Make</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.map((item, index) => {
                            const originalIndex = (pageIndex === 0 ? 0 : ITEMS_PER_FIRST_PAGE) + (pageIndex > 1 ? (pageIndex - 1) * ITEMS_PER_PAGE : 0) + index;
                            
                            return (
                                <tr key={index} className="border-b border-slate-200 ">
                                    <td className="w-10 py-2 border-r border-slate-200 text-center font-bold text-slate-700">{String(originalIndex + 1)}</td>
                                    
                                    <td className="px-3 py-2 border-r border-slate-200 text-slate-800 text-left align-top">
                                        <div className="whitespace-pre-wrap">{item.description}</div>
                                    </td>

                                    {data.showImages && (
                                        <td className="w-20 border-r border-slate-200 p-1 align-middle">
                                            <div className="flex justify-center items-center h-full">
                                                {item.image ? (
                                                    <img src={item.image} alt="product" className="max-h-16 w-auto object-contain" />
                                                ) : null}
                                            </div>
                                        </td>
                                    )}
                                    
                                    <td className="w-16 py-2 border-r border-slate-200 text-center text-slate-800 px-1 align-top">{item.hsn || '-'}</td>
                                    <td className="w-12 py-2 border-r border-slate-200 text-center text-slate-800 font-semibold align-top">{item.qty}</td>
                                    <td className="w-20 py-2 border-r border-slate-200 text-right text-slate-800 px-2 align-top">{item.price.toLocaleString('en-IN')}</td>
                                    <td className="w-12 py-2 border-r border-slate-200 text-center text-slate-800 align-top">{item.gst}%</td>
                                    <td className="w-24 py-2 border-r border-slate-200 text-right font-bold text-slate-900 px-2 align-top">
                                        {calculateRowTotal(item.qty, item.price, item.gst).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="w-20 py-2 text-center text-slate-600 font-semibold align-top">{item.make}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            )}
         </div>

         {/* Totals Section - Render on the last page that contains items (pages.length - 2) */}
         {pageIndex === pages.length - 2 && (
            <div className="mt-auto">
                <div className="flex justify-between items-end mb-8 mt-4">
                   {/* Amount in Words */}
                   <div className="w-1/2 pr-4">
                      <p className="text-gray-600 text-xs uppercase font-bold mb-1">Amount in Words:</p>
                      <p className="text-gray-800 font-semibold italic border-b border-gray-300 pb-1">
                        {numberToWords(Math.round(grandTotal))}
                      </p>
                   </div>

                    <div className="w-64">
                        <div className="flex justify-between py-2 border-b ">
                            <span className="text-gray-600">Sub Total:</span>
                            <span className="font-bold text-gray-800">₹{subTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b mb-2">
                            <span className="text-gray-600">GST (Avg):</span>
                            <span className="font-bold text-gray-800">₹{gstTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between py-3 px-2 text-black rounded-sm">
                            <span className="font-bold">Grand Total:</span>
                            <span className="font-bold text-lg">₹ {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>
            </div>
         )}


         {/* Footer / Terms - Only on strictly Last Page (pages.length - 1) */}
         {isLastPage(pageIndex) && (
            <div className="flex flex-col h-full justify-start">
                {/* Footer Content */}
                <div className="pt-4">
                    <div className="flex justify-between items-start gap-8 mb-6">
                        {/* Left Side: Terms */}
                        <div className="flex-1 text-xs text-gray-700 leading-relaxed">
                             <div className="space-y-2">
                                {(data.terms || '').split('\n').map((term, i) => {
                                    // Bold keywords overlapping with colon or hyphen
                                    const parts = term.split(/(:|-)/); 
                                    if (parts.length > 1) {
                                        return (
                                            <p key={i}>
                                                <span className="font-bold text-black">• {parts[0].trim()}{parts[1]}</span>
                                                {term.substring(parts[0].length + 1).trim()}
                                            </p>
                                        );
                                    }
                                    return term.trim() ? <p key={i}>• {term}</p> : null;
                                })}
                             </div>
                             
                             <div className="mt-4">
                                <p><span className="font-bold text-black">• Complain will be received by Email:-</span> <a href="mailto:info@championsecuritysystem.com" className="text-blue-600 underline">info@championsecuritysystem.com</a></p>
                                <p className="pl-2">with detail (like camera number, place etc). Time:- 10:30am To 6:30pm</p>
                                <p className="pl-2">Service will be provided in 24 to 48 hours after call received by Authorized Person</p>
                             </div>
                        </div>

                    </div>

                    {/* Certifications */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center items-center gap-4 mb-2">
                             {/* Gem Logo Placeholder */}
                             <div className="h-10 w-24 relative">
                                <img src="https://upload.wikimedia.org/wikipedia/hi/thumb/e/e7/GeM-logo.svg/1280px-GeM-logo.svg.png" alt="Gem" className="w-48 object-contain" />
                             </div>
                        </div>
                        <p className="text-red-600 font-bold text-sm">Trademark registration number-5290052/ Certificate No- 3149953</p>
                        <p className="text-red-600 font-bold text-sm">ISO-9001 : 2015. CERTIFICATE NO- 250210Q105---</p>
                        <p className="text-xs text-gray-700 mt-1">
                            We are the authorized Registered channel partner of <span className="font-bold text-red-600">Axis, Pelco, Hanwha, Honeywell, Panasonic I-Pro, D-LINK, TP-LINK</span> Surveillance product and Government Approved <span className="font-bold text-red-600 underline">GEM & Trademark</span> registered Company
                        </p>
                    </div>

                    {/* Partner Logos */}
                    <div className="flex flex-wrap gap-6 justify-between items-center px-4 opacity-90">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Axis_Communications_logo.svg/1280px-Axis_Communications_logo.svg.png" alt="Axis" className="h-10 object-contain" />
                        <img src="https://wicom.ca/wp-content/uploads/2023/03/logo-pelco.png" alt="Pelco" className="h-15 object-contain" />
                        <img src="https://www.secomp.fr/thumbor/o7rRmg8K9vuWJVwmE2VThnpQivM=/filters:cachevalid(2022-09-23T12:17:17.716683):strip_icc():strip_exif()/cms_secde/cms/ueber_uns/markenwelt/hersteller_logos/i-pro_logo_rgb_blue.png" alt="Panasonic" className="h-10 object-contain" />
                        <img src="https://www.matrixcomsec.com/products/wp-content/uploads/2022/01/Matrix-ComSec_Logo1new.png" alt="Matrix" className="h-10 object-contain" />
                        <img src="https://logo.clearbit.com/trassir.com" alt="Trassir" className="h-10 object-contain" />
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnzwl-53GN5z4FI3ITAH6aA946jNx65kaU_Q&s" alt="Hanwha" className="h-10 object-contain" />
                        <img src="https://www.actility.com/wp-content/uploads/2024/12/Milesight-logo.png" alt="Milesight" className="h-10 object-contain" />
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ1lgzY1sVnPeAwLedBr3z4u-zjeaDmHCx5w&s" alt="Honeywell" className="h-20 object-contain" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/D-Link_wordmark.svg/960px-D-Link_wordmark.svg.png" alt="Honeywell" className="h-10 object-contain" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Alcatel-Lucent_logo.svg/1280px-Alcatel-Lucent_logo.svg.png" alt="Honeywell" className="h-10 object-contain" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/TPLINK_Logo_2.svg/1280px-TPLINK_Logo_2.svg.png" alt="Honeywell" className="h-10 object-contain" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/22/Logo_Netgear.png" alt="Honeywell" className="h-5 object-contain" />
                        <img src="https://www.nit.ae/wp-content/uploads/2022/11/MS_logo_CBlue_CMYK-1-1024x212.png" alt="Milestone" className="h-10 object-contain" />

                    </div>
                </div>
            </div>
         )}
       </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center bg-gray-100 py-8 print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:py-0 print:m-0 print:block">
        <style jsx global>{`
          @media print {
            @page { margin: 0; size: A4; }
            html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
            body { background: white; -webkit-print-color-adjust: exact; }
            .print\\:break-after-page { break-after: page; }
            .print\\:shadow-none { shadow: none; }
            .print\\:overflow-hidden { overflow: hidden; }
          }
        `}</style>
        {pages.map((pageItems, index) => renderPage(pageItems, index))}
    </div>
  );
};

export default QuotationPreview;
