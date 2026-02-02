"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import QuotationForm from "../../components/QuotationForm";
import QuotationPreview from "../../components/QuotationPreview";

function CreateQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get('cloneId');

  // Fetch existing or clone
  const id = searchParams.get('id');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    quotationNo: `CSS/${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}/${new Date().getFullYear()}/`,
    type: "Quotation", 
    fixedType: true, // Hides toggle
    date: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subject: "Quotation For Matrix 5MP IP/ Network camera",
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
    terms: `Device warranty :- Five year warranty all /5MP cameras and NVR
Warranty: Hard Disk warranty for Two years, All POE switch warranty one years from date of supply subject to manufacturing defects only.
Cable :- Cable will be On Actual, it will be not in warranty in case of Damage. It's based on final installation it could be more or less than the estimated cable length
Recording :- Recording will be supported upto 20 Days
Service & Support:- One Year service & support will be provided on call basis.
Payment Terms: 70% Advance with Confirmed Order and 30% After completion of Work
Validity Of Quote : 10 days from date of Quote
Our responsibility ceases the moment the good leave our premises and no claim of breakage, etc would be accepted.
Completion of work will be in 7days
Scope of Client :- customer will providing ladder and etc for working accessories proper power source to the equipments, Civil, Carpentry, Fabrication work is in the scope of client
Complain will be received by Email:- <a href="mailto:info@championsecuritysystem.com" class="text-blue-600 underline">info@championsecuritysystem.com</a> with detail (like camera number, place etc).
Time:- 10:30am To 6:30pm
Service will be provided in 24 to 48 hours after call received by Authorized Person`
  });

  useEffect(() => {
    const targetId = id || cloneId;
    if (targetId) {
        setLoading(true);
        fetch(`/api/quotations/${targetId}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(quotation => {
                if (quotation.data) {
                    const loadedData = { ...quotation.data, type: 'Quotation', fixedType: true };
                    
                    if (cloneId) {
                        // If cloning, reset specific fields to make it a "new" entry
                        // We still want to generate a NEW number for the clone, not use the old one
                        fetch('/api/quotations?limit=1')
                            .then(res => res.json())
                            .then(latest => {
                                let nextNum = 261;
                                if (latest && latest.length > 0) {
                                    const lastNo = latest[0].quotationNo;
                                    const parts = lastNo.split('/');
                                    const lastNumStr = parts[parts.length - 1];
                                    const parsedDetails = parseInt(lastNumStr);
                                    if (!isNaN(parsedDetails)) {
                                        nextNum = parsedDetails + 1;
                                    }
                                }
                                loadedData.quotationNo = `CSS/${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}/${new Date().getFullYear()}/${nextNum}`;
                                loadedData.date = new Date().toISOString().split('T')[0];
                                loadedData.validTill = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                setData(loadedData);
                            })
                            .catch(err => {
                                console.error("Error fetching latest for clone:", err)
                                // Fallback
                                loadedData.quotationNo = `CSS/${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}/${new Date().getFullYear()}/261`;
                                loadedData.date = new Date().toISOString().split('T')[0];
                                loadedData.validTill = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                setData(loadedData);
                            });
                    } else {
                         setData(loadedData);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    } else {
        // New Quotation - Fetch latest ID
        setLoading(true);
        fetch('/api/quotations?limit=1')
            .then(res => res.json())
            .then(latest => {
                let nextNum = 261;
                if (latest && latest.length > 0) {
                    const lastNo = latest[0].quotationNo;
                    // Expected format: CSS/FEB/2026/261
                    const parts = lastNo.split('/');
                    const lastNumStr = parts[parts.length - 1];
                    const parsedDetails = parseInt(lastNumStr);
                    if (!isNaN(parsedDetails)) {
                        nextNum = parsedDetails + 1;
                    }
                }
                
                const newNo = `CSS/${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}/${new Date().getFullYear()}/${nextNum}`;
                setData(prev => ({ ...prev, quotationNo: newNo }));
            })
            .catch(err => {
                console.error("Error generating new number:", err);
                // Fallback handled by initial state, but let's update strict
                 const newNo = `CSS/${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}/${new Date().getFullYear()}/261`;
                 setData(prev => ({ ...prev, quotationNo: newNo }));
            })
            .finally(() => setLoading(false));
    }
  }, [id, cloneId]);

  // Update document title for PDF filename
  useEffect(() => {
    if (data.subject || data.receiver.name || data.receiver.company) {
        const client = data.receiver.name || data.receiver.company || 'Client';
        const subject = data.subject || 'Quotation';
        document.title = `${subject} - ${client}`;
    } else {
        document.title = 'Champion Security System Quotation';
    }
  }, [data.subject, data.receiver.name, data.receiver.company]);


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
      const baseUrl = `/api/quotations`;

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
        router.push('/quotation'); // Redirect to quotation list
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
      return <div className="min-h-screen flex items-center justify-center">Loading Quotation...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden select-none print:min-h-0 print:h-auto print:overflow-visible print:block print:bg-white">
      <div className="fixed top-4 left-4 z-50 flex gap-2 print:hidden">
          <button 
            onClick={() => router.push('/quotation')}
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

export default function CreateQuotation() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreateQuotationContent />
    </Suspense>
  );
}
