"use client";
import Image from 'next/image';
import React from 'react';
import { numberToWords } from '../utils/numberConverter';

const QuotationPreview = ({ data }) => {
  // --- Safe Data Access ---
  const safeData = {
    ...data,
    sender: data?.sender || {},
    receiver: data?.receiver || {},
    items: data?.items || [],
    terms: data?.terms || '',
  };

  // --- Calculations ---
  const calculateRowTotal = (qty, price, gst) => {
    const base = (qty || 0) * (price || 0);
    const tax = base * ((gst || 0) / 100);
    return base + tax;
  };

  const subTotal = safeData.items.reduce((acc, item) => acc + ((item.qty || 0) * (item.price || 0)), 0);
  const gstTotal = safeData.items.reduce((acc, item) => acc + (((item.qty || 0) * (item.price || 0)) * ((item.gst || 0) / 100)), 0);
  const grandTotal = subTotal + gstTotal;

  // --- STRICT Pagination Logic ---
  
  // 1. We assume text wraps very quickly (every 34 chars)
  const MAX_CHARS_PER_LINE = 34; 
  
  // 2. Balanced limits to prevent overflow while minimizing gaps
  const PAGE_1_LIMIT = 18; 
  const PAGE_N_LIMIT = 30;
  const FOOTER_WEIGHT = 6; 

  const getItemWeight = (description = '') => {
    const desc = description || '';
    const rawLines = desc.split('\n').length;
    const wrappingLines = Math.ceil(desc.length / MAX_CHARS_PER_LINE);
    
    // We take the larger of the two estimates
    const totalLines = Math.max(rawLines, wrappingLines);
    
    // Balanced multiplier to prevent overflow
    return 1 + ((totalLines - 1) * 0.75); 
  };

  const pages = [];
  let currentPage = [];
  let currentUsage = 0;
  let currentLimit = PAGE_1_LIMIT;

  // Process items
  let queue = safeData.items.map((item, i) => ({ ...item, _sr: i + 1 }));

  while (queue.length > 0) {
      let item = queue.shift();
      const weight = getItemWeight(item.description);
      const remainingSpace = currentLimit - currentUsage;

      if (weight <= remainingSpace) { 
          currentPage.push(item);
          currentUsage += weight;
      } else {
          // --- SPLITTING LOGIC ---
          if (remainingSpace > 2.5) { // Needs at least 2.5 units of space to attempt a split
              const availableLines = Math.floor((remainingSpace - 1) / 0.45); 
              if (availableLines >= 1) { 
                  const approxChars = Math.floor(availableLines * MAX_CHARS_PER_LINE);
                  const description = item.description || '';
                  
                  let cutIndex = description.lastIndexOf('\n', approxChars);
                  if (cutIndex === -1 || cutIndex < approxChars * 0.5) cutIndex = description.lastIndexOf(' ', approxChars);
                  if (cutIndex === -1) cutIndex = approxChars; 
                  
                  const part1Desc = description.substring(0, cutIndex);
                  const part2Desc = description.substring(cutIndex).trim();

                  currentPage.push({
                      ...item, description: part1Desc + " ",
                      price: 0, qty: '', gst: '', hsn: item.hsn, make: item.make, 
                      _sr: item._sr, isPartial: true
                  });
                  
                  pages.push(currentPage);
                  currentPage = [];
                  currentUsage = 0;
                  currentLimit = PAGE_N_LIMIT; 

                  queue.unshift({
                      ...item, description: " " + part2Desc,
                      _sr: '', isContinuation: true
                  });
                  continue; 
              }
          }
          pages.push(currentPage);
          currentPage = [];
          currentUsage = 0;
          currentLimit = PAGE_N_LIMIT; 
          queue.unshift(item); 
      }
  }

  if (currentPage.length > 0) pages.push(currentPage);
  else if (pages.length === 0) pages.push([]); 

  if (currentUsage > (currentLimit - FOOTER_WEIGHT)) pages.push([]); 
  pages.push([]); 
  
  const isLastPage = (index) => index === pages.length - 1;

  // --- Render Page Function ---
  const renderPage = (pageItems, pageIndex) => (
    <div 
      key={pageIndex} 
      className={`bg-white shadow-2xl mx-auto w-[210mm] h-[297mm] p-10 relative text-sm sm:text-base text-gray-800 mb-8 overflow-hidden flex flex-col print:shadow-none print:mb-0 print:w-full print:h-[297mm] print:overflow-hidden print:mx-0 ${pageIndex < pages.length - 1 ? 'print:break-after-page' : ''}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
       {/* Watermark */}
       <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none z-0">
          <div className="w-[500px] h-[500px] flex items-center justify-center">
             <Image 
                 src="https://championsecuritysystem.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.e3798401.png&w=384&q=75" 
                 alt="watermark logo" width={400} height={400} className="object-contain" 
                 unoptimized
             />
          </div>
       </div>

       <div className="relative z-10 flex flex-col flex-grow justify-start">
         <div>
            {pageIndex === 0 ? (
                <>
                {/* Page 1 Header */}
                <div className="flex flex-col items-center mb-4 text-center">
                    <div className="flex items-center gap-4 mb-2">
                         <div className="w-16 h-16 flex items-center justify-center items-center">
                            <Image 
                                src="https://championsecuritysystem.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.e3798401.png&w=384&q=75" 
                                alt="company logo" width={350} height={350} className="object-contain"
                                unoptimized
                            />
                        </div>
                        <div className="text-center">
                           <h1 className="text-3xl font-bold text-blue-900">{safeData.sender?.name || 'Company Name'}</h1>
                           <p className="text-sm font-semibold text-gray-800">CCTV.Intruder Alarm. Access Controls.Multi Apt.VDP.</p>
                        </div>
                    </div>
                    
                    <div className="text-sm text-blue-800 font-medium leading-tight">
                         <p className="mb-1">
                            Email: <a href={`mailto:${safeData.sender?.email}`} className="underline">{safeData.sender?.email}</a> 
                            <span className="mx-2">Web:</span><a href="https://championsecuritysystem.com" className="underline">https://championsecuritysystem.com</a>
                         </p>
                         <p className="mb-1 text-black font-bold">{safeData.sender?.address}</p>
                         <p className="text-black font-bold">Mobile: {safeData.sender?.phone}</p>
                    </div>
                </div>

                <div className="mb-6 text-center">
                    <h3 className="text-lg font-bold text-black underline uppercase tracking-wide">
                        {safeData.type === 'Proforma' ? 'PROFORMA INVOICE' : `Sub:- ${safeData.subject || ''}`}
                    </h3>
                </div>

                <div className="flex justify-between items-start mb-6 px-8">
                      <div className="text-sm text-gray-800 w-1/2">
                         <p className="font-bold text-lg text-blue-900">{safeData.receiver?.company || 'Client Company'}</p>
                         <p className="font-semibold">{safeData.receiver?.name}</p>
                         <p className="text-gray-700 whitespace-pre-wrap">{safeData.receiver?.address}</p>
                         {safeData.receiver?.phone && <p className="font-semibold mt-1">Ph: {safeData.receiver.phone}</p>}
                         {safeData.receiver?.gst && <p className="font-bold text-gray-800 mt-1">GSTIN: {safeData.receiver.gst}</p>}
                      </div>

                      <div className="text-right text-sm font-bold text-gray-800 w-1/2">
                         <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 justify-end">
                            <span className="text-gray-600">{safeData.type === 'Proforma' ? 'PI No:' : 'Quotation No:'}</span>
                            <span>{safeData.quotationNo}</span>
                            
                            <span className="text-gray-600">Date:</span>
                            <span>{safeData.date}</span>
                            
                            <span className="text-gray-600">Valid Till:</span>
                            <span>{safeData.validTill}</span>

                            <span className="text-gray-600">GSTIN No:</span>
                            <span>{safeData.gstNo || '27AHXPD7350C1Z8'}</span>

                            {safeData.sender?.pan && (
                                <>
                                    <span className="text-gray-600">PAN No:</span>
                                    <span>{safeData.sender.pan}</span>
                                </>
                            )}
                         </div>
                      </div>
                </div>
                </>
            ) : (
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <div className="flex items-center gap-2 opacity-70">
                        <span className="font-bold text-blue-900">{safeData.sender?.name}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">{safeData.type === 'Proforma' ? 'PI' : 'Quotation'}: {safeData.quotationNo}</span>
                    </div>
                    <div className="text-sm text-gray-500">Page {pageIndex + 1} of {pages.length}</div>
                </div>
            )}

            {pageItems.length > 0 && (
            <div className="mb-4 w-full flex-grow flex flex-col">
                <table className="w-full text-xs border-collapse h-full">
                    <thead>
                        <tr className="border-y border-slate-500 bg-slate-50 text-slate-900">
                            <th className="w-10 py-2 border-r border-slate-300 text-center font-bold">Sr.n</th>
                            <th className="px-3 py-2 border-r border-slate-300 text-left font-bold">Particulars</th>
                            {safeData.showImages && <th className="w-20 py-2 border-r border-slate-300 text-center font-bold">Image</th>}
                            {safeData.showHSN !== false && <th className="w-16 py-2 border-r border-slate-300 text-center font-bold">HSN/SAC</th>}
                            <th className="w-12 py-2 border-r border-slate-300 text-center font-bold">QTY</th>
                            <th className="w-20 py-2 border-r border-slate-300 text-right px-2 font-bold">Rate</th>
                            <th className="w-12 py-2 border-r border-slate-300 text-center font-bold">GST %</th>
                            <th className="w-24 py-2 border-r border-slate-300 text-right px-2 font-bold">Total</th>
                            <th className="w-20 py-2 text-center font-bold">Make</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.map((item, index) => (
                                <tr key={index} className="border-b border-slate-200 ">
                                    <td className="w-10 py-2 border-r border-slate-200 text-center font-bold text-slate-700">{item._sr}</td>
                                    <td className="px-3 py-2 border-r border-slate-200 text-slate-800 text-left align-top">
                                        <div className="whitespace-pre-wrap">{item.description}</div>
                                    </td>
                                    {safeData.showImages && (
                                        <td className="w-20 border-r border-slate-200 p-1 align-middle">
                                            <div className="flex justify-center items-center h-full">
                                                {item.image ? (
                                                    <img src={item.image} alt="product" className="max-h-16 w-auto object-contain" unoptimized />
                                                ) : null}
                                            </div>
                                        </td>
                                    )}
                                    {safeData.showHSN !== false && <td className="w-16 py-2 border-r border-slate-200 text-center text-slate-800 px-1 align-top">{item.hsn || '-'}</td>}
                                    <td className="w-12 py-2 border-r border-slate-200 text-center text-slate-800 font-semibold align-top">{item.qty === '' ? '' : item.qty}</td>
                                    <td className="w-20 py-2 border-r border-slate-200 text-right text-slate-800 px-2 align-top">{item.qty === '' ? '' : (item.price || 0).toLocaleString('en-IN')}</td>
                                    <td className="w-12 py-2 border-r border-slate-200 text-center text-slate-800 align-top">{item.qty === '' ? '' : `${item.gst}%`}</td>
                                    <td className="w-24 py-2 border-r border-slate-200 text-right font-bold text-slate-900 px-2 align-top">
                                        {item.qty === '' ? '' : calculateRowTotal(item.qty, item.price, item.gst).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="w-20 py-2 text-center text-slate-600 font-semibold align-top">{item.make}</td>
                                </tr>
                        ))}
                        <tr className="h-full">
                            <td className="border-r border-slate-200"></td>
                            <td className="border-r border-slate-200"></td>
                            {safeData.showImages && <td className="border-r border-slate-200"></td>}
                            {safeData.showHSN !== false && <td className="border-r border-slate-200"></td>}
                            <td className="border-r border-slate-200"></td>
                            <td className="border-r border-slate-200"></td>
                            <td className="border-r border-slate-200"></td>
                            <td className="border-r border-slate-200"></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            )}
         </div>

         {pageIndex === pages.length - 2 && (
            <div className={pages.length === 2 ? "mt-auto" : "mt-8"}>
                <div className="flex justify-between items-end mb-8 mt-4">
                   <div className="w-1/2 pr-4">
                      <p className="text-gray-600 text-xs uppercase font-bold mb-1">Amount in Words:</p>
                      <p className="text-gray-800 font-semibold italic border-b border-gray-300 pb-1">
                        {Math.round(grandTotal) > 0 ? numberToWords(Math.round(grandTotal)) : 'Zero'}
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

         {isLastPage(pageIndex) && (
            <div className="flex flex-col h-full justify-start">
                <div className="pt-4">
                    <div className="flex justify-between items-start gap-8 mb-6">
                        <div className="flex-1 text-xs text-gray-700 leading-relaxed">
                             <div className="space-y-2">
                                {(safeData.terms || '').split('\n').map((term, i) => {
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
                    {/* Footers Logos */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center items-center gap-4 mb-2">
                             <div className="h-10 w-24 relative">
                                <img src="https://upload.wikimedia.org/wikipedia/hi/thumb/e/e7/GeM-logo.svg/1280px-GeM-logo.svg.png" alt="Gem" className="w-48 object-contain" unoptimized />
                             </div>
                        </div>
                        <p className="text-red-600 font-bold text-sm">Trademark registration number-5290052/ Certificate No- 3149953</p>
                        <p className="text-red-600 font-bold text-sm">ISO-9001 : 2015. CERTIFICATE NO- 250210Q105---</p>
                        <p className="text-xs text-gray-700 mt-1">
                            We are the authorized Registered channel partner of <span className="font-bold text-red-600">Axis, Pelco, Hanwha, Honeywell, Panasonic I-Pro, D-LINK, TP-LINK</span> Surveillance product and Government Approved <span className="font-bold text-red-600 underline">GEM & Trademark</span> registered Company
                        </p>
                    </div>
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
;

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