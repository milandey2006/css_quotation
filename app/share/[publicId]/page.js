"use client";

import { useState, useEffect, useRef, use } from 'react';
import EstimatedPreview from '../../components/EstimatedPreview';
import QuotationPreview from '../../components/QuotationPreview';

export default function PublicSharePage({ params }) {
  // Use React.use() to unwrap params in Next.js 15+ if needed, or just await in useEffect.
  // params is a Promise in recent Next.js versions for Server Components, but this is a Client Component.
  // In Client Components, params is passed as a prop, but dealing with async params is safer.
  const resolvedParams = use(params);
  const publicId = resolvedParams.publicId;

  const [docData, setDocData] = useState(null);
  const [docType, setDocType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/public/document/${publicId}`);
        if (!res.ok) {
            if (res.status === 404) throw new Error('Document not found');
            throw new Error('Failed to load document');
        }
        
        const responseData = await res.json();
        setDocData(responseData.data);
        setDocType(responseData.type);
        
        // set title
        const client = responseData.data?.receiver?.name || responseData.data?.receiver?.company || responseData.data?.clientName || 'Client';
        document.title = `${responseData.type} - ${client}`;

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (publicId) fetchData();
  }, [publicId]);

  // Responsive Scaling Logic.
  // Measures the actual rendered (native) size of the document and computes a scale to fit
  // the viewport, then sets an explicit pixel width/height on an outer wrapper so the box's
  // layout footprint matches what's visually drawn. Relying on flex "shrink-to-fit" sizing
  // instead (the previous approach) is fragile across browsers and leaves content overflowing
  // sideways on phones.
  const scaleTargetRef = useRef(null);
  const [scaledSize, setScaledSize] = useState(null);

  useEffect(() => {
    if (!docData) return;

    const recompute = () => {
      const el = scaleTargetRef.current;
      if (!el) return;
      const nativeWidth = el.scrollWidth;
      const nativeHeight = el.scrollHeight;
      const maxWidth = window.innerWidth - 20;
      const newScale = nativeWidth > maxWidth ? maxWidth / nativeWidth : 1;
      setScaledSize({
        scale: newScale,
        width: nativeWidth * newScale,
        height: nativeHeight * newScale,
      });
    };

    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [docData]);

  const scale = scaledSize?.scale ?? 1;

  if (loading) return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
  );

  if (error) return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
          <div className="text-red-500 text-xl font-bold">😕 Oops!</div>
          <div className="text-slate-600">{error}</div>
      </div>
  );

  if (!docData) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-4 md:py-8 overflow-x-hidden">
       {/* Public Header */}
       <div className="mb-4 md:mb-6 no-print w-full max-w-[800px] flex flex-col md:flex-row justify-between items-center px-4 gap-4 md:gap-0">
          <div className="text-sm text-slate-500 text-center md:text-left">
              Shared {docType}
              <div className="text-xs text-slate-400">View below or download PDF</div>
          </div>
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2 font-medium text-sm md:text-base w-full md:w-auto justify-center"
          >
            <span>🖨️</span> Print / Save PDF
          </button>
       </div>

       {/* Scaled Preview Container */}
       <div
          className="print-container"
          style={{
              width: scaledSize ? `${scaledSize.width}px` : 'auto',
              height: scaledSize ? `${scaledSize.height}px` : 'auto',
              overflow: 'hidden',
          }}
       >
          <div
             ref={scaleTargetRef}
             className="shadow-2xl bg-white print-content transition-transform duration-200"
             style={{
                 transform: `scale(${scale})`,
                 transformOrigin: 'top left',
             }}
          >
             {docType === 'Estimate' ? (
                 <EstimatedPreview data={docData} showGst={docData.showGst} />
             ) : (
                 <QuotationPreview data={docData} />
             )}
          </div>
       </div>

       <div className="mt-8 text-slate-400 text-xs text-center no-print w-full px-4">
           Generated by Champion Security Services
           <br/>
           <span className="opacity-50">Best viewed on Desktop or Printed</span>
       </div>

       <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
            /* Reset scaling for print -- print at native size, not the screen-fit scale */
            .print-container {
                width: auto !important;
                height: auto !important;
                overflow: visible !important;
            }
            .print-content {
                transform: none !important;
                box-shadow: none !important;
            }
          }
       `}</style>
    </div>
  );
}
