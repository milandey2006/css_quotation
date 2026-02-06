"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import QuotationForm from "../../components/QuotationForm";
import QuotationPreview from "../../components/QuotationPreview";

function CreateProformaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    quotationNo: `CSS-PI/${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}/${new Date().getFullYear()}/`,
    type: "Proforma",
    fixedType: true,
    date: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    poDate: '',
    poNo: '',
    subject: "Proforma Invoice For Matrix 5MP IP/ Network camera",
    gstNo: "27AHXPD7350C1Z8", 
    showImages: true,
    showHSN: true,
    sender: {
      name: "Champion Security System",
      address: "Office-21 A Gr Floor, New Apollo Estate Old Nagardas Road, Andheri East Mumbai 400069",
      phone: "8080808109/8080806288",
      email: "info@championsecuritysystem.com", 
      pan: "",
      signatory: "Authorized Signatory"
    },
    receiver: {
      name: "",
      company: "",
      address: "",
      phone: ""
    },
    items: [
      {
        description: "",
        image: "", 
        make: "",
        qty: 1,
        price: 0,
        gst: 18
      }
    ],
    terms: `
    Terms and Condition:
Good once sold Will not be taken back or exchanged
Seller is not responsible for any loss or damaged of good in transit
100% Advance payment
Intrest will be charged @ 20% p.a. if bill not paid within due date
Damage And Repair Not Cover In Warranty`
  });

  // Fetch existing
  useEffect(() => {
    if (id) {
        setLoading(true);
        fetch(`/api/proformas/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(quotation => {
                if (quotation.data) {
                    setData({ 
                        ...quotation.data, 
                        type: 'Proforma', 
                        fixedType: true,
                        publicId: quotation.publicId 
                    });
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }
  }, [id]);


  const handleDeepChange = (section, field, value) => {
    if (section === 'meta') {
      setData(prev => ({ ...prev, [field]: value }));
    } else {
      setData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", make: "", qty: 1, price: 0, gst: 18, image: "", hsn: "" }]
    }));
  };

  const removeItem = (index) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleReorderItems = (newItems) => {
    setData(prev => ({ ...prev, items: newItems }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const totalAmount = data.items.reduce((sum, item) => {
        const itemTotal = item.qty * item.price;
        const tax = itemTotal * (item.gst / 100);
        return sum + itemTotal + tax;
      }, 0);

      const payload = {
          quotationNo: data.quotationNo,
          clientName: data.receiver.name || data.receiver.company,
          totalAmount: Math.round(totalAmount),
          date: data.date,
          data: data,
          status: 'Active' 
      };

      let response;
      const baseUrl = `/api/proformas`;

      if (id) {
          response = await fetch(`${baseUrl}/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
      } else {
          response = await fetch(baseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
      }

      if (response.ok) {
        router.push('/proforma'); // Redirect to list
      } else {
        alert('Failed to save proforma');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving proforma');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
      if (!data.publicId) {
          alert('Please save the proforma invoice first to generate a shareable link.');
          return;
      }
      
      const shareUrl = `https://css-quotation.vercel.app/share/${data.publicId}`;
      
      try {
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!\n' + shareUrl);
      } catch (err) {
          console.error('Failed to copy: ', err);
          alert('Failed to copy link. You can manually copy this:\n' + shareUrl);
      }
  };

  const [sidebarWidth, setSidebarWidth] = useState(600); 
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth > 300 && newWidth < window.innerWidth - 400) {
            setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);


  if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading Proforma...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden select-none print:min-h-0 print:h-auto print:overflow-visible print:block print:bg-white">
      <div className="fixed top-4 left-4 z-50 flex gap-2 print:hidden">
          <button 
            onClick={() => router.push('/proforma')}
            className="p-2 bg-white text-slate-600 rounded-lg shadow-md border border-slate-200 hover:text-blue-600 hover:border-blue-400 transition-all flex items-center gap-2"
            title="Back to List"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="hidden md:inline font-medium text-sm">Back to List</span>
          </button>
      </div>

      <div 
        className="w-full lg:h-full overflow-y-auto flex-shrink-0 relative bg-white border-r border-gray-200 z-10 print:hidden pt-16 lg:pt-0"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : '100%' }}
      >
        <QuotationForm 
          data={data} 
          onChange={handleDeepChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onReorderItems={handleReorderItems}
          onItemChange={handleItemChange}
          onSave={handleSave}
          isSaving={isSaving}
          isEditMode={!!id}
          onShare={handleShare}
        />
      </div>

       <div
        className="hidden lg:flex w-4 h-full cursor-col-resize hover:bg-blue-500/10 bg-gray-50 transition-colors z-50 items-center justify-center group flex-shrink-0 -ml-2"
        onMouseDown={startResizing}
      >
           <div className="w-1 h-12 bg-gray-300 group-hover:bg-blue-500 rounded-full transition-all"></div>
      </div>

      <div className="flex-1 h-full overflow-y-auto overflow-x-auto bg-gray-200 p-4 md:p-8 flex justify-center relative print:w-full print:h-auto print:overflow-visible print:p-0 print:m-0 print:bg-white print:block print:static pt-20 md:pt-8">
         <div className="transform scale-[0.45] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 origin-top transition-transform duration-300 ease-out">
            <QuotationPreview data={data} />
         </div>
      </div>
    </main>
  );
}

export default function CreateProforma() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreateProformaContent />
    </Suspense>
  );
}
