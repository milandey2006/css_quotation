"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import QuotationPreview from '../../components/QuotationPreview';

export default function PreviewPage({ params }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unwrap params using React.use() or await if it's async in this Next.js version (likely synchronous-ish for client components but params is promise-like in recent Next)
  // Actually, 'params' prop in page components is a Promise in Next.js 15+, but let's assume it might be directly available or awaitable. 
  // Safest for client component: unwrap with `use` or wait for simple props. 
  // Wait, "use client" so params is passed as prop. In Next 13/14 App Router, params is just an object. 
  // However, dynamic routes in client components... params prop is available.
  
  // Use useSearchParams to get the query parameter
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Handle params being a promise if necessary
        const resolvedParams = await params;
        const id = resolvedParams.id;
        
        // Determine endpoint based on type
        const endpoint = type === 'Proforma' ? `/api/proformas/${id}` : `/api/quotations/${id}`;
        
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const responseData = await res.json();
        // The API returns the data inside a 'data' field
        setData(responseData.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load quotation');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params, type]);

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
          <QuotationPreview data={data} />
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
