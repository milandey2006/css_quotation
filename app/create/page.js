"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import QuotationForm from "../components/QuotationForm";
import QuotationPreview from "../components/QuotationPreview";

function CreateQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    quotationNo: `CSS/${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}/${new Date().getFullYear()}/`,
    type: "Quotation", // Quotation | Proforma
    date: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subject: "Quotation For Matrix 5MP IP/ Network camera",
    gstNo: "27AHXPD7350C1Z8", // Default GST
    showImages: true,
    showHSN: true,
    sender: {
      name: "Champion Security System",
      address: "Office-21 A Gr Floor, New Apollo Estate Old Nagardas Road, Andheri East Mumbai 400069",
      phone: "8080808109",
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
    // Default Empty Item
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
    terms: `Device warranty :- Five year warranty all /5MP cameras and NVR
Warranty: Hard Disk warranty for Two years, All POE switch warranty one years from date of supply subject to manufacturing defects only.
Cable :- Cable will be On Actual, it will be not in warranty in case of Damage. It's based on final installation it could be more or less than the estimated cable length
Recording :- Recording will be supported upto 20 Days
Service & Support:- One Year service & support will be provided on call basis.
Payment Terms: 70% Advance with Confirmed Order and 30% After completion of Work
Validity Of Quote : 10 days from date of Quote
Our responsibility ceases the moment the good leave our premises and no claim of breakage, etc would be accepted.
Completion of work will be in 7days
Scope of Client :- customer will providing ladder and etc for working accessories proper power source to the equipments, Civil, Carpentry, Fabrication work is in the scope of client`
  });

  // Fetch existing data if ID is present
  useEffect(() => {
    if (id) {
        setLoading(true);
        const searchParams = new URLSearchParams(window.location.search);
        const type = searchParams.get('type');
        const endpoint = type === 'Proforma' ? `/api/proformas/${id}` : `/api/quotations/${id}`;
        
        fetch(endpoint)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(quotation => {
                if (quotation.data) {
                    setData(quotation.data);
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
      items: [{ description: "", make: "", qty: 1, price: 0, gst: 18, image: "", hsn: "" }, ...prev.items]
    }));
  };

  const removeItem = (index) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Calculate total amount
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
          status: 'Active' // Or keep existing status if editing? Simplification for now.
      };

      let response;
      const endpoint = data.type === 'Proforma' ? 'proformas' : 'quotations';
      const baseUrl = `/api/${endpoint}`;

      if (id) {
          // UPDATE
          response = await fetch(`${baseUrl}/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
      } else {
          // CREATE
          response = await fetch(baseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
      }

      if (response.ok) {
        // Navigate back to dashboard
        router.push('/');
      } else {
        alert('Failed to save quotation');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving quotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
      const subject = encodeURIComponent(`Quotation: ${data.subject}`);
      const body = encodeURIComponent(`Dear ${data.receiver.name || 'Client'},\n\nPlease find the quotation details below.\n\nQuotation No: ${data.quotationNo}\nTotal Amount: ₹${Math.round( data.items.reduce((acc, item) => acc + (item.qty * item.price) * (1 + item.gst/100), 0) ).toLocaleString('en-IN')}\n\nBest Regards,\n${data.sender.name}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // --- Resizable Logic ---
  const [sidebarWidth, setSidebarWidth] = useState(400); // Default px width
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
      return <div className="min-h-screen flex items-center justify-center">Loading Quotation...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden select-none print:min-h-0 print:h-auto print:overflow-visible print:block print:bg-white">
      {/* Left Panel - Editor */}
      <div 
        className="w-full lg:h-full overflow-y-auto flex-shrink-0 relative bg-white border-r border-gray-200 z-10 print:hidden"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : '100%' }}
      >
        <QuotationForm 
          data={data} 
          onChange={handleDeepChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onItemChange={handleItemChange}
          onSave={handleSave}
          isSaving={isSaving}
          isEditMode={!!id}
          onShare={handleShare}
        />
      </div>

       {/* Resizer Handle - Now a Sibling */}
       <div
        className="hidden lg:flex w-4 h-full cursor-col-resize hover:bg-blue-500/10 bg-gray-50 transition-colors z-50 items-center justify-center group flex-shrink-0 -ml-2"
        onMouseDown={startResizing}
      >
           <div className="w-1 h-12 bg-gray-300 group-hover:bg-blue-500 rounded-full transition-all"></div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-auto bg-gray-200 p-4 md:p-8 flex justify-center relative print:w-full print:h-auto print:overflow-visible print:p-0 print:m-0 print:bg-white print:block print:static">
         <div className="transform scale-[0.45] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 origin-top transition-transform duration-300 ease-out">
            <QuotationPreview data={data} />
         </div>
      </div>
    </main>
  );
}

export default function CreateQuotation() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreateQuotationContent />
    </Suspense>
  );
}
