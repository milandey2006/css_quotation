"use client";
import Image from 'next/image';
import React, { useState, useRef, useLayoutEffect } from 'react';
import { numberToWords } from '../utils/numberConverter';

const QuotationPreview = ({ data }) => {
  // --- Safe Data Access ---
  const safeData = {
    ...data,
    sender: data?.sender || {},
    receiver: data?.receiver || {},
    items: data?.items || [],
    terms: data?.terms || '',
    showMake: data?.showMake !== false, // Default true
  };

  const isProforma = (safeData.type || '').toLowerCase().includes('proforma');

  // --- Calculations ---
  const calculateRowTotal = (qty, price, gst) => {
    const base = (qty || 0) * (price || 0);
    const tax = base * ((gst || 0) / 100);
    return base + tax;
  };

  const subTotal = safeData.items.reduce((acc, item) => acc + ((item.qty || 0) * (item.price || 0)), 0);
  const gstTotal = safeData.items.reduce((acc, item) => acc + (((item.qty || 0) * (item.price || 0)) * ((item.gst || 0) / 100)), 0);
  const grandTotal = subTotal + gstTotal;

  // --- Reusable block renderers (shared between hidden measurement pass and real render) ---

  const renderTotalsWordsBlock = () => (
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
  );

  const renderTermsBlock = () => (
    <div className="space-y-2">
      {(safeData.terms || '').split('\n').map((term, i) => {
        const parts = term.split(/(:|-)/);
        if (parts.length > 1) {
          return (
            <p key={i}>
              <span className="font-bold text-black">* {parts[0].trim()}{parts[1]}</span>
              <span dangerouslySetInnerHTML={{ __html: term.substring(parts[0].length + 1).trim() }} />
            </p>
          );
        }
        return term.trim() ? <p key={i} dangerouslySetInnerHTML={{ __html: '* ' + term }} /> : null;
      })}
    </div>
  );

  const renderProformaInlineFooter = () => (
    <div className="mt-4 pb-[30px]">
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b">
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
          <div className="mt-4 text-right">
            <p className="text-gray-600 text-xs uppercase font-bold mb-1">Amount in Words:</p>
            <p className="text-gray-800 font-semibold italic">
              {Math.round(grandTotal) > 0 ? numberToWords(Math.round(grandTotal)) : 'Zero'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-4">
        <div className="text-xs text-gray-700 leading-relaxed max-w-[60%]">
          {renderTermsBlock()}
        </div>
        <div className="text-center w-[200px]">
          <p className="font-bold text-xs text-black mb-4">FOR CHAMPION SECURITY SYSTEM</p>
          <div className="h-16 flex items-center justify-center mb-1">
            <img src="/sign/signature.png" alt="Signature" className="max-h-full max-w-full object-contain" />
          </div>
          <p className="font-bold text-xs text-black border-t border-black pt-1">AUTHORISED SIGNATORY</p>
        </div>
      </div>

      <div className="text-center mt-8 border-t border-gray-200 pt-2">
        <p className="text-[10px] text-gray-500 italic">This is a computer generated invoice</p>
      </div>
    </div>
  );

  const renderLastPageFooter = () => (
    <div className="flex flex-col">
      <div className="pt-4">
        <div className="flex justify-between items-start gap-8 mb-6">
          <div className="flex-1 text-xs text-gray-700 leading-relaxed">
            {renderTermsBlock()}
          </div>
        </div>
        {safeData.type !== 'Proforma' && (
          <>
            <div className="flex flex-col gap-2 text-left w-full mb-4 px-4 bg-gray-50/50 py-2 rounded-md border border-gray-100">
              <div className="flex flex-row justify-between w-full border-b border-gray-200 pb-2">
                <div className="flex-1 pr-2">
                  <h4 className="text-[11px] font-bold text-blue-900 mb-1 text-center">Sales</h4>
                  <ul className="text-[9px] text-gray-800 space-y-0.5 list-disc pl-3">
                    <li>CCTV Cameras & Recorders</li>
                    <li>Access Control & Biometric Devices</li>
                    <li>Networking Accessories</li>
                    <li>Alarm Systems</li>
                    <li>Surveillance Accessories</li>
                  </ul>
                </div>
                <div className="flex-[1.5] flex flex-col border-l border-gray-200 pl-4">
                  <h4 className="text-[11px] font-bold text-blue-900 mb-1 text-center">Installation Services</h4>
                  <div className="flex gap-2 text-[9px] text-gray-800 w-full justify-between">
                    <ul className="space-y-0.5 list-disc pl-3 flex-1">
                      <li>AI-Based Video Analytics</li>
                      <li>Access Control Installation</li>
                      <li>End-to-End Security Solutions</li>
                      <li>Structured Cabling</li>
                      <li>VMS Server & NAS Solution</li>
                    </ul>
                    <ul className="space-y-0.5 list-disc pl-3 flex-1">
                      <li>Monitoring & Mobile App</li>
                      <li>Smart Alerts & Real-Time</li>
                      <li>PAN-India Project Support</li>
                      <li>System Health Check</li>
                      <li>On-call Technical Support</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="w-full text-center mt-1">
                <h4 className="text-[11px] font-bold text-blue-900 mb-1">AI Technology Security Solutions</h4>
                <p className="text-[9px] text-gray-800 flex flex-wrap justify-center gap-1.5 items-center">
                  <span>• Face Recognition</span>
                  <span>• Vehicle Detection</span>
                  <span>• Intrusion Detection</span>
                  <span>• People Counting</span>
                  <span>• Smart Alerts</span>
                  <span>• Residential Security</span>
                  <span>• Commercial Security</span>
                  <span>• Industrial Surveillance Warehouse & Society Solutions</span>
                </p>
              </div>
            </div>

            <div className="text-center mb-4">
              <p className="text-red-600 font-bold text-[11px]">Trademark -5290052/ Certificate No- 3149953 ISO-9001 : 2015. CERTIFICATE NO- 250210Q105   </p>
            </div>

            <div className="text-center mb-6">
              <h4 className="text-[12px] font-bold text-blue-900 mb-3 uppercase border-b border-gray-300 pb-1 inline-block">Authorized / Supported Brands</h4>
              <div className="flex flex-wrap gap-x-6 gap-y-4 justify-center items-center px-4 opacity-90">
                <img src="https://www.vivotek.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTIyNDYsInB1ciI6ImJsb2JfaWQifX0=--4c3e2523882130839b9c5ec907aebf7e1c6cf6e9/VIVOTEK%20640X360.jpg" alt="Vivotek" className="h-10 object-contain" />
                <img src="https://wicom.ca/wp-content/uploads/2023/03/logo-pelco.png" alt="Pelco" className="h-10 object-contain" />
                <img src="https://www.secomp.fr/thumbor/o7rRmg8K9vuWJVwmE2VThnpQivM=/filters:cachevalid(2022-09-23T12:17:17.716683):strip_icc():strip_exif()/cms_secde/cms/ueber_uns/markenwelt/hersteller_logos/i-pro_logo_rgb_blue.png" alt="Panasonic" className="h-4 object-contain" />
                <img src="https://www.matrixcomsec.com/products/wp-content/uploads/2022/01/Matrix-ComSec_Logo1new.png" alt="Matrix" className="h-5 object-contain" />
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnzwl-53GN5z4FI3ITAH6aA946jNx65kaU_Q&s" alt="Hanwha" className="h-5 object-contain" />
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ1lgzY1sVnPeAwLedBr3z4u-zjeaDmHCx5w&s" alt="Honeywell" className="h-14 object-contain" />
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXXUqObfshywppYZKr2Cawp1qPZO0glNL94Q&s" alt="Milesight" className="h-8 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/D-Link_wordmark.svg/960px-D-Link_wordmark.svg.png" alt="D-Link" className="h-4 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Alcatel-Lucent_logo.svg/1280px-Alcatel-Lucent_logo.svg.png" alt="Alcatel-Lucent" className="h-8 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/TPLINK_Logo_2.svg/1280px-TPLINK_Logo_2.svg.png" alt="TP-Link" className="h-8 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/22/Logo_Netgear.png" alt="Netgear" className="h-3 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Bosch-logo.svg/1280px-Bosch-logo.svg.png" alt="Bosch" className="h-7 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/27/Ajax_system.png" alt="Ajax" className="h-7 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Mantra_Softech.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original" alt="Mantra" className="h-6 object-contain" />
                <img src="https://www.nit.ae/wp-content/uploads/2022/11/MS_logo_CBlue_CMYK-1-1024x212.png" alt="Milestone" className="h-5 object-contain" />
                <img src="https://www.networkoptix.com/hs-fs/hubfs/nx.jpg?width=800&height=245&name=nx.jpg" alt="network-optix" className="h-10 object-contain" />
                <img src="https://www.pincvision.com/assets/uploads/References/_800x418_crop_center-center_82_none/partner-logos_Genetec.png?mtime=1735826856" alt="Genetec" className="h-10 object-contain" />
                <img src="https://old.roi4cio.com/fileadmin/user_upload/Wisenet-WAVE-logo-cropped.png" alt="Genetec" className="h-3 object-contain" />
              </div>
            </div>

            <div className="flex justify-between items-start text-xs border-t border-gray-200 pt-4 mt-auto">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold text-black">Web:- </span>
                  <a href="https://championsecuritysystem.com" className="text-blue-600 underline">https://championsecuritysystem.com</a>
                </p>
                <p>
                  <span className="font-semibold text-black">Email:- </span>
                  <a href="mailto:admin@championsecuritysystem.com" className="text-blue-600 underline">admin@championsecuritysystem.com</a>
                </p>
                <p>
                  <span className="font-semibold text-black">Email:- </span>
                  <a href="mailto:info@championsecuritysystem.com" className="text-blue-600 underline">info@championsecuritysystem.com</a>
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-semibold text-black">Please Click on Link Below (Company Profile)</p>
                <a href="https://championsecuritysystem.com/documents/profile.pdf" className="text-blue-600 underline block">
                  https://championsecuritysystem.com/documents/profile.pdf
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderPage1Header = () => (
    <>
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
        <h3 className="text-md font-bold text-black underline tracking-wide">
          {safeData.type === 'Proforma' ? 'PROFORMA INVOICE' : `Sub:- ${safeData.subject || ''}`}
        </h3>
      </div>

      <div className="flex justify-between items-start mb-6 px-8">
        <div className="text-sm text-gray-800 w-1/2">
          <p className="font-bold text-md text-blue-900">{safeData.receiver?.company || 'Client Company'}</p>
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

            {isProforma ? (
              <>
                <span className="text-gray-600">PO Date:</span>
                <span>{safeData.poDate || '-'}</span>
                <span className="text-gray-600">PO No.:</span>
                <span>{safeData.poNo || '-'}</span>
              </>
            ) : (
              <>
                <span className="text-gray-600">Valid Till:</span>
                <span>{safeData.validTill}</span>
              </>
            )}

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
  );

  const renderPageNHeader = (pageNumber, pageCount) => (
    <div className="flex justify-between items-center border-b pb-4 mb-6">
      <div className="flex items-center gap-2 opacity-70">
        <span className="font-bold text-blue-900">{safeData.sender?.name}</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600">{safeData.type === 'Proforma' ? 'PI' : 'Quotation'}: {safeData.quotationNo}</span>
      </div>
      <div className="text-sm text-gray-500">Page {pageNumber} of {pageCount}</div>
    </div>
  );

  const renderTableHead = () => (
    <tr className="border-y border-slate-500 bg-slate-50 text-slate-900">
      <th className="w-[4%] py-2 border-r border-slate-300 text-center font-bold">Sr.n</th>
      <th className="w-[45%] px-3 py-2 border-r border-slate-300 text-left font-bold">Particulars</th>
      {safeData.showImages && safeData.type !== 'Proforma' && <th className="w-[8%] py-2 border-r border-slate-300 text-center font-bold">Image</th>}
      {safeData.type === 'Proforma' && <th className="w-[8%] py-2 border-r border-slate-300 text-center font-bold">HSN/SAC</th>}
      <th className="w-[6%] py-2 border-r border-slate-300 text-center font-bold">QTY</th>
      <th className="w-[9%] py-2 border-r border-slate-300 text-right px-2 font-bold">Rate</th>
      <th className="w-[6%] py-2 border-r border-slate-300 text-center font-bold">GST %</th>
      <th className="w-[12%] py-2 border-r border-slate-300 text-right px-2 font-bold">Total</th>
      {safeData.showMake && <th className="w-[10%] py-2 text-center font-bold">Make</th>}
    </tr>
  );

  const renderTableRow = (item, index) => (
    <tr key={index} className="border-b border-slate-200 ">
      <td className="w-10 py-2 border-r border-slate-200 text-center font-bold text-slate-700">{item._sr}</td>
      <td className="px-3 py-2 border-r border-slate-200 text-slate-800 text-left align-top">
        <div
          className="quotation-rich-text whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      </td>
      {safeData.showImages && safeData.type !== 'Proforma' && (
        <td className="w-20 border-r border-slate-200 p-1 align-middle">
          <div className="flex justify-center items-center h-full">
            {item.image ? (
              <img src={item.image} alt="product" className="max-h-16 w-auto object-contain" unoptimized />
            ) : null}
          </div>
        </td>
      )}
      {safeData.type === 'Proforma' && <td className="w-16 py-2 border-r border-slate-200 text-center text-slate-800 px-1 align-top">{item.hsn || '-'}</td>}

      <td className="w-12 py-2 border-r border-slate-200 text-center text-slate-800 font-semibold align-top">{item.qty === '' ? '' : item.qty}</td>
      <td className="w-20 py-2 border-r border-slate-200 text-right text-slate-800 px-2 align-top">{item.qty === '' ? '' : (item.price || 0).toLocaleString('en-IN')}</td>
      <td className="w-12 py-2 border-r border-slate-200 text-center text-slate-800 align-top">{item.qty === '' ? '' : `${item.gst}%`}</td>
      <td className="w-24 py-2 border-r border-slate-200 text-right font-bold text-slate-900 px-2 align-top">
        {item.qty === '' ? '' : calculateRowTotal(item.qty, item.price, item.gst).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </td>
      {safeData.showMake && <td className="w-20 py-2 text-center text-slate-600 font-semibold align-top">{item.make}</td>}
    </tr>
  );

  // --- Text-based estimate, used only to choose a cut point when a single item is too tall to fit on any one page ---
  const MAX_CHARS_PER_LINE = 46;
  const getEstimatedLineCount = (item) => {
    let desc = item.description || '';
    desc = desc.replace(/<(p|div|li)[^>]*>\s*<br\s*\/?>\s*<\/\1>/gi, '\n');
    desc = desc.replace(/<(p|div|li)[^>]*>\s*&nbsp;\s*<\/\1>/gi, '\n');
    desc = desc.replace(/<(p|div|li)[^>]*>\s*<\/\1>/gi, '\n');
    desc = desc.replace(/<br\s*\/?>/gi, '\n');
    desc = desc.replace(/<\/(p|div|li)[^>]*>/gi, '\n');
    desc = desc.replace(/<[^>]*>?/gm, '');
    desc = desc.replace(/&nbsp;/ig, ' ');

    const lines = desc.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();

    let totalLines = 0;
    lines.forEach((line) => {
      totalLines += line.trim() === '' ? 1 : Math.max(1, Math.ceil(line.length / MAX_CHARS_PER_LINE));
    });
    return Math.max(totalLines, 1);
  };

  // --- Measurement refs ---
  const rulerInnerRef = useRef(null);
  const header1Ref = useRef(null);
  const headerNRef = useRef(null);
  const totalsWordsRef = useRef(null);
  const lastFooterRef = useRef(null);
  const proformaFooterRef = useRef(null);
  const rowRefs = useRef([]);
  rowRefs.current = [];

  const itemsWithSr = safeData.items.map((item, i) => ({ ...item, _sr: i + 1 }));

  const [pages, setPages] = useState(null); // null while measuring
  const [footerPlacement, setFooterPlacement] = useState('split'); // 'same' | 'new' | 'split'

  useLayoutEffect(() => {
    const innerWrapperHeight = rulerInnerRef.current?.getBoundingClientRect().height || 0;
    const header1Height = header1Ref.current?.getBoundingClientRect().height || 0;
    const headerNHeight = headerNRef.current?.getBoundingClientRect().height || 0;
    const totalsWordsHeight = totalsWordsRef.current?.getBoundingClientRect().height || 0;
    const lastFooterHeight = lastFooterRef.current?.getBoundingClientRect().height || 0;
    const proformaFooterHeight = proformaFooterRef.current?.getBoundingClientRect().height || 0;

    const tableChromeHeight = 40; // thead + table borders/margins overhead, roughly constant
    // Browsers commonly impose their own default print margins on top of our `@page { margin: 0 }`
    // unless the user explicitly picks "Margins: None" in the print dialog. Reserve a small buffer
    // so that doesn't silently push the last bit of each page onto an extra, mostly-blank page.
    const PRINT_SAFETY_BUFFER = 32;
    const page1Available = innerWrapperHeight - header1Height - tableChromeHeight - PRINT_SAFETY_BUFFER;
    const pageNAvailable = innerWrapperHeight - headerNHeight - tableChromeHeight - PRINT_SAFETY_BUFFER;

    // Average px height of one wrapped line of description text, derived from measured rows,
    // used only to pick a cut point when splitting an oversized single item across pages.
    let avgLineHeight = 18;
    let baseRowHeight = 34;
    const sample = rowRefs.current.find((el, i) => el && getEstimatedLineCount(itemsWithSr[i]) === 1);
    if (sample) baseRowHeight = sample.getBoundingClientRect().height;

    const result = [];
    let currentPage = [];
    let currentUsed = 0;
    let currentLimit = page1Available > 0 ? page1Available : innerWrapperHeight * 0.5;

    const queue = itemsWithSr.map((item, i) => ({ item, height: rowRefs.current[i]?.getBoundingClientRect().height || baseRowHeight }));

    while (queue.length > 0) {
      const { item, height } = queue.shift();
      const remaining = currentLimit - currentUsed;

      if (height <= remaining || currentPage.length === 0) {
        // If it doesn't fit but the page is already empty, place it anyway (avoids infinite loop
        // for an item taller than a full page) — only split plaintext items in that case.
        const description = item.description || '';
        const hasHtmlTags = /<[a-z][\s\S]*>/i.test(description);

        if (height > currentLimit && !hasHtmlTags && currentPage.length === 0) {
          const lineCount = getEstimatedLineCount(item);
          const availableLines = Math.max(1, Math.floor((currentLimit - baseRowHeight) / avgLineHeight) + 1);
          if (availableLines < lineCount) {
            const approxChars = Math.floor(availableLines * MAX_CHARS_PER_LINE);
            let cutIndex = description.lastIndexOf('\n', approxChars);
            if (cutIndex === -1 || cutIndex < approxChars * 0.5) cutIndex = description.lastIndexOf(' ', approxChars);
            if (cutIndex === -1) cutIndex = approxChars;

            const part1Desc = description.substring(0, cutIndex);
            const part2Desc = description.substring(cutIndex).trim();

            result.push([{
              ...item, description: part1Desc + " ",
              price: 0, qty: '', gst: '', isPartial: true,
              height: currentLimit,
            }]);
            currentPage = [];
            currentUsed = 0;
            currentLimit = pageNAvailable > 0 ? pageNAvailable : innerWrapperHeight * 0.5;
            queue.unshift({ item: { ...item, description: " " + part2Desc, _sr: '', isContinuation: true }, height: baseRowHeight + (lineCount - availableLines) * avgLineHeight });
            continue;
          }
        }
        currentPage.push(item);
        currentUsed += height;
      } else {
        result.push(currentPage);
        currentPage = [item];
        currentUsed = height;
        currentLimit = pageNAvailable > 0 ? pageNAvailable : innerWrapperHeight * 0.5;
      }
    }

    if (currentPage.length > 0) result.push(currentPage);
    else if (result.length === 0) result.push([]);

    // Decide where the totals/words block and the closing terms+brands footer go. Previously a
    // dedicated trailing page was always added for the footer regardless of how little content it
    // had, which routinely produced an near-empty extra page at the end of short quotations.
    let footerPlacementResult = 'split';
    if (isProforma) {
      if (currentUsed > (currentLimit - proformaFooterHeight)) result.push([]);
    } else {
      const FOOTER_GAP = 32; // px, matches the `mt-8` margin between the items table and totals
      const combinedFooterHeight = totalsWordsHeight + FOOTER_GAP + lastFooterHeight;
      const lastPageLimit = result.length === 0 ? page1Available : currentLimit;
      const remainingOnLastPage = lastPageLimit - currentUsed;

      if (remainingOnLastPage >= combinedFooterHeight) {
        // Totals + terms + brands all fit right after the items, on the same page.
        footerPlacementResult = 'same';
      } else if (combinedFooterHeight <= pageNAvailable) {
        // Doesn't fit with the items, but fits together on one fresh page.
        footerPlacementResult = 'new';
        result.push([]);
      } else {
        // Too tall for one page even on its own -- fall back to splitting totals and the
        // terms+brands footer across two pages, same as before.
        footerPlacementResult = 'split';
        if (currentUsed > (lastPageLimit - totalsWordsHeight)) result.push([]);
        result.push([]);
      }
    }

    setFooterPlacement(footerPlacementResult);
    setPages(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(safeData)]);

  // --- Render Page Function ---
  const renderPage = (pageItems, pageIndex, pageCount) => {
    const showInlineTotals = isProforma && (pageIndex === pageCount - 1);

    return (
      <div
        key={pageIndex}
        data-pdf-page="true"
        className={`bg-white shadow-2xl mx-auto w-[210mm] h-[297mm] p-10 relative text-sm text-gray-800 mb-8 overflow-hidden flex flex-col print:shadow-none print:mb-0 print:w-full print:h-[297mm] print:overflow-hidden print:mx-0 ${pageIndex < pageCount - 1 ? 'print:break-after-page' : ''}`}
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
            {pageIndex === 0 ? renderPage1Header() : renderPageNHeader(pageIndex + 1, pageCount)}

            {pageItems.length > 0 && (
              <div className="mb-4 w-full flex-grow flex flex-col">
                <table className="w-full text-xs border-collapse h-full table-fixed">
                  <thead>{renderTableHead()}</thead>
                  <tbody>
                    {pageItems.map((item, index) => renderTableRow(item, index))}
                    <tr className="h-full">
                      <td className="border-r border-slate-200"></td>
                      <td className="border-r border-slate-200"></td>
                      {safeData.showImages && safeData.type !== 'Proforma' && <td className="border-r border-slate-200"></td>}
                      {safeData.type === 'Proforma' && <td className="border-r border-slate-200"></td>}
                      <td className="border-r border-slate-200"></td>
                      <td className="border-r border-slate-200"></td>
                      <td className="border-r border-slate-200"></td>
                      <td className="border-r border-slate-200"></td>
                      {safeData.showMake && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {showInlineTotals && renderProformaInlineFooter()}
          </div>

          {!isProforma && footerPlacement === 'split' && pageIndex === pageCount - 2 && (
            <div className="mt-8">{renderTotalsWordsBlock()}</div>
          )}
          {!isProforma && footerPlacement === 'split' && pageIndex === pageCount - 1 && renderLastPageFooter()}

          {!isProforma && footerPlacement !== 'split' && pageIndex === pageCount - 1 && (
            <>
              <div className="mt-8">{renderTotalsWordsBlock()}</div>
              {renderLastPageFooter()}
            </>
          )}
        </div>
      </div>
    );
  };

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

      {/* Hidden measurement pass: real DOM layout drives pagination instead of guessed heuristics */}
      <div style={{ position: 'absolute', top: 0, left: '-99999px', visibility: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
        <div className="w-[210mm] h-[297mm] p-10 flex flex-col">
          <div className="flex flex-col flex-grow" ref={rulerInnerRef} />
        </div>
        <div className="w-[210mm] box-border px-10">
          <div className="flow-root" ref={header1Ref}>{renderPage1Header()}</div>
          <div className="flow-root" ref={headerNRef}>{renderPageNHeader(2, 2)}</div>
          <table className="w-full text-xs border-collapse table-fixed">
            <thead>{renderTableHead()}</thead>
            <tbody>
              {itemsWithSr.map((item, i) => (
                <tr key={i} ref={(el) => { rowRefs.current[i] = el; }} className="border-b border-slate-200">
                  {renderTableRow(item, i).props.children}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flow-root" ref={totalsWordsRef}>{renderTotalsWordsBlock()}</div>
          <div className="flow-root" ref={lastFooterRef}>{renderLastPageFooter()}</div>
          <div className="flow-root" ref={proformaFooterRef}>{renderProformaInlineFooter()}</div>
        </div>
      </div>

      {pages && pages.map((pageItems, index) => renderPage(pageItems, index, pages.length))}
    </div>
  );
};

export default QuotationPreview;
