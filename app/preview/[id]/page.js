"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import EstimatedPreview from '../../components/EstimatedPreview';
import QuotationPreview from '../../components/QuotationPreview';

export default function PreviewPage({ params }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use useSearchParams to get the query parameter
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Handle params being a promise if necessary
        const resolvedParams = await params;
        const id = resolvedParams.id;
        
        let endpoint = '';
        if (type === 'Proforma') endpoint = `/api/proformas/${id}`;
        else if (type === 'Estimate') endpoint = `/api/estimates/${id}`;
        else endpoint = `/api/quotations/${id}`;
        
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const responseData = await res.json();
        
        if (type === 'Estimate') {
            // Estimates API returns the data spread at the root
            setData(responseData);
        } else {
            // Quotations/Proformas return data nested in .data
            setData(responseData.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params, type]);

  // Dynamic Title for PDF
  useEffect(() => {
     if (data) {
        const client = data.receiver?.name || data.receiver?.company || data.clientName || 'Client';
        const docSubject = data.subject || (type === 'Estimate' ? 'Estimate' : 'Quotation');
        document.title = `${docSubject} - ${client}`;
     }
  }, [data, type]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen">No data found</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
       <div className="mb-4 no-print flex gap-4">
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
          >
            Print / Save as PDF
          </button>
          <button 
            onClick={() => window.close()} 
            className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 transition"
          >
            Close
          </button>
       </div>
       <div className="shadow-2xl">
          {type === 'Estimate' ? (
              <EstimatedPreview data={data} showGst={data.showGst} />
          ) : (
              <QuotationPreview data={data} />
          )}
       </div>
       <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
          }
       `}</style>
    </div>
  );
}
