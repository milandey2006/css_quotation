'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import EstimatedPreview from '../../components/EstimatedPreview';
import { Menu, Plus, Trash2, Printer, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

function CreateEstimateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGst, setShowGst] = useState(false); // Default OFF
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved'
  
  // Form State
  const [formData, setFormData] = useState({
    id: '', // Initial empty, will be set on client or ignored if new
    billTo: '',
    billNo: 'CSS/2025/',
    // Store as YYYY-MM-DD for input, format for display later
    billDate: '', // Initial empty to match server
    paidAmount: 0,
    items: [
      { description: 'ESSL K30 Biometric', make: 'ESSL', sn: 'PHY7244\n700691', qty: 1, rate: 6800 },
      { description: 'E Time track light software and License', make: '', sn: '', qty: 1, rate: 2500 }
    ],
    paymentInstructions: 'Pay Cheque to\nChampion security system',
    terms: `1. Good once sold Will not be taken back or exchanged
2. Seller is not responsible for any loss or damaged of good in transit
3. 100% Advance payment
4. Interest will be charged @ 20% p.a. if bill not paid within due date
5. Damage And Repair Not Cover In Warranty`
  });

  // Initialize date on client only to avoid hydration mismatch
  useEffect(() => {
    if (!formData.billDate && !editId) {
        setFormData(prev => ({
            ...prev,
            id: Date.now().toString(),
            billDate: new Date().toISOString().slice(0, 10)
        }));
    }
  }, []);

  // Load Data for Edit
  // Load Data for Edit
  useEffect(() => {
    if (editId) {
      fetchEstimate(editId);
    }
  }, [editId]);

  const fetchEstimate = async (id) => {
    try {
      const res = await fetch(`/api/estimates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
        setShowGst(data.showGst || false);
      } else {
        console.error('Failed to fetch estimate');
      }
    } catch (error) {
       console.error('Error fetching estimate:', error);
    }
  };

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', make: '', sn: '', qty: 1, rate: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Print Logic
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // Updated for newer versions, but preserving compat
    content: () => componentRef.current,
    documentTitle: `Estimated_${formData.billNo.replace(/\//g, '-')}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
      /* Ensure text colors are printed correctly */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `,
  });

  const saveEstimate = async () => {
    try {
      setSaveStatus('saving');
      
      // Calculate totals for quick list view
      const subTotal = formData.items.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.rate) || 0)), 0);
      const gstTotal = formData.items.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.rate) || 0) * ((item.gst || 0) / 100)), 0);
      const total = showGst ? (subTotal + gstTotal) : subTotal;

      const payload = {
        ...formData,
        showGst, // Save toggle state
        totalAmount: total,
        updatedAt: new Date().toISOString()
      };

      let res;
      if (editId) {
          // Update existing
           res = await fetch(`/api/estimates/${editId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
           });
      } else {
          // Create new
          // Remove ID so DB generates it (or keep generic ID logic if prefer, but DB serial is better usually, 
          // but here we are using serial in DB but might have a string ID in state. 
          // Let's stick to the form state ID if we want, OR better let's let backend handle ID if possible.
          // However, the current state uses Date.now() string. 
          // Schema has Serial ID. So we should probably strip ID for new or let backend ignore it.
          // The API route currently returns the new object with DB ID.
           const { id, ...newPayload } = payload; // Remove client-side ID for new creation to let DB handle it
           res = await fetch('/api/estimates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newPayload)
           });
      }

      if (res.ok) {
           setSaveStatus('saved');
           setTimeout(() => setSaveStatus(''), 2000);
           const result = await res.json();
           if (!editId) {
               // If created new, redirect or update ID
               router.push(`/estimated/create?id=${result.id}`);
           }
      } else {
          throw new Error('Failed to save');
      }

    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save estimate");
      setSaveStatus('');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-blue-600"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40 bg-white shadow-xl md:shadow-none w-64 border-r border-slate-200`}>
        <Sidebar activePage="Estimated" />
      </div>
      
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-6 overflow-hidden flex flex-col h-screen">
        
        {/* Header Toolbar */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Estimated Generation</h1>
                <p className="text-xs text-slate-500">Create EST documents</p>
            </div>
            <div className="flex gap-4 items-center">
                {/* GST Toggle */}
                <div className="flex items-center gap-2 mr-4">
                  <span className={`text-sm font-medium ${showGst ? 'text-blue-700' : 'text-slate-500'}`}>GST</span>
                  <button onClick={() => setShowGst(!showGst)} className="focus:outline-none">
                    {showGst ? 
                      <ToggleRight className="w-8 h-8 text-blue-600" /> : 
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    }
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                      onClick={saveEstimate} 
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                  >
                      <Save className="w-4 h-4" />
                      <span className="text-sm font-medium">{saveStatus === 'saved' ? 'Saved!' : 'Save'}</span>
                  </button>

                  <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-lg shadow-slate-900/20">
                      <Printer className="w-4 h-4" />
                      <span className="text-sm font-medium">Print / PDF</span>
                  </button>
                </div>
            </div>
        </div>

        {/* Content Split: Form vs Preview */}
        <div className="flex flex-col xl:flex-row gap-6 h-full overflow-hidden">
            
            {/* LEFT: Form */}
            <div className="w-full xl:w-5/12 overflow-y-auto pr-2 pb-20 space-y-6">
                
                {/* Bill Details */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Bill Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1">Bill To</label>
                            <textarea 
                                value={formData.billTo}
                                onChange={(e) => handleInputChange('billTo', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder:text-black"
                                placeholder="Client Name & Address..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-black mb-1">Bill No</label>
                                <input 
                                    type="text" 
                                    value={formData.billNo}
                                    onChange={(e) => handleInputChange('billNo', e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-black mb-1">Bill Date</label>
                                <input 
                                    type="date" 
                                    value={formData.billDate}
                                    onChange={(e) => handleInputChange('billDate', e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-black mb-1">Paid Amount (₹)</label>
                                <input 
                                    type="number" 
                                    value={formData.paidAmount}
                                    onChange={(e) => handleInputChange('paidAmount', e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Items</h2>
                        <button onClick={addItem} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100 relative group">
                                <button 
                                    onClick={() => removeItem(index)}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="space-y-3">
                                    <input 
                                        type="text"
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        className="w-full p-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 text-black placeholder:text-gray-500"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input 
                                            type="text"
                                            placeholder="Make"
                                            value={item.make}
                                            onChange={(e) => handleItemChange(index, 'make', e.target.value)}
                                            className="w-full p-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 text-black placeholder:text-gray-500"
                                        />
                                        <textarea 
                                            placeholder="SN.no (one per line)"
                                            value={item.sn}
                                            onChange={(e) => handleItemChange(index, 'sn', e.target.value)}
                                            className="w-full p-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 h-10 min-h-[40px] text-black placeholder:text-gray-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-black font-semibold">Qty</span>
                                            <input 
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                                className="w-full pl-8 p-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 text-black"
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-black font-semibold">Rate</span>
                                            <input 
                                                type="number"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                className="w-full pl-10 p-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 text-black"
                                            />
                                        </div>
                                    </div>
                                    {showGst && (
                                      <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-black font-semibold">GST %</span>
                                          <input 
                                              type="number"
                                              value={item.gst || 0}
                                              onChange={(e) => handleItemChange(index, 'gst', e.target.value)}
                                              className="w-full pl-12 p-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 text-black"
                                              placeholder="18"
                                          />
                                      </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Terms */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Terms & Payment</h2>
                    <div className="space-y-4">
                        <div>
                             <label className="block text-xs font-semibold text-black mb-1">Payment Instructions</label>
                             <textarea 
                                value={formData.paymentInstructions}
                                onChange={(e) => handleInputChange('paymentInstructions', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm h-16 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-black mb-1">Terms & Conditions</label>
                             <textarea 
                                value={formData.terms}
                                onChange={(e) => handleInputChange('terms', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* RIGHT: Preview */}
            <div className="w-full xl:w-7/12 bg-slate-200/50 rounded-xl overflow-y-auto mb-20 md:mb-0 flex justify-center p-8 border border-slate-200/60 shadow-inner">
                <div ref={componentRef} className="origin-top scale-[0.85] md:scale-100 transition-transform">
                    <EstimatedPreview data={formData} showGst={showGst} />
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}

export default function EstimatedPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <CreateEstimateForm />
    </Suspense>
  );
}
