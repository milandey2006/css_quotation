"use client";
import React from 'react';

const QuotationForm = ({ data, onChange, onAddItem, onRemoveItem, onItemChange, onSave, isSaving, onShare }) => {
  const handleChange = (e, section, field) => {
    onChange(section, field, e.target.value);
  };

  return (
    <div className="bg-white h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
        <h2 className="text-xl font-bold text-gray-900">Edit Quotation</h2>
        <div className="flex gap-3">
             <button
              onClick={onShare}
              className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="bg-green-600 text-white px-6 py-1.5 rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-semibold transition-colors"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
        </div>
      </div>
      
      <div className="p-6 space-y-8">

      {/* Basic Info */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Quotation Details</h3>
        <div className="grid grid-cols-2 gap-5">
           {/* Document Type Selector */}
           <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Document Type</label>
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => onChange('meta', 'type', 'Quotation')}
                className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg focus:z-10 focus:ring-2 focus:ring-blue-500 ${
                  data.type === 'Quotation' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
              >
                Quotation
              </button>
              <button
                type="button"
                onClick={() => onChange('meta', 'type', 'Proforma')}
                className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg focus:z-10 focus:ring-2 focus:ring-blue-500 ${
                  data.type === 'Proforma' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
              >
                Proforma Invoice
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
                {data.type === 'Proforma' ? 'PI No' : 'Quotation No'}
            </label>
            <input
              type="text"
              value={data.quotationNo}
              onChange={(e) => handleChange(e, 'meta', 'quotationNo')}
              className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
             <input
              type="date"
              value={data.date}
              onChange={(e) => handleChange(e, 'meta', 'date')}
              className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Gst No</label>
             <input
              type="text"
              value={data.gstNo}
              onChange={(e) => handleChange(e, 'meta', 'gstNo')}
              className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Valid Till</label>
            <input
              type="date"
              value={data.validTill}
              onChange={(e) => handleChange(e, 'meta', 'validTill')}
              className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
           {/* Subject Line Input - Spanning full width */}
           <div className="col-span-2">
             <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
             <textarea
              rows={2}
              value={data.subject || ''}
              onChange={(e) => handleChange(e, 'meta', 'subject')}
              className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="e.g. Quotation For Matrix 5MP IP/ Network camera"
            />
          </div>
        </div>
      </div>

      {/* Sender Info (Our Company) */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Our Details</h3>
        <div className="space-y-4">
          <input
            placeholder="Company Name"
            value={data.sender.name}
            onChange={(e) => handleChange(e, 'sender', 'name')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
          <input
            placeholder="Address Line 1"
            value={data.sender.address}
            onChange={(e) => handleChange(e, 'sender', 'address')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
           <input
            placeholder="PAN No"
            value={data.sender.pan || ''}
            onChange={(e) => handleChange(e, 'sender', 'pan')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Phone"
              value={data.sender.phone}
              onChange={(e) => handleChange(e, 'sender', 'phone')}
              className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            <input
              placeholder="Email"
              value={data.sender.email}
              onChange={(e) => handleChange(e, 'sender', 'email')}
              className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Receiver Info (Client) */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Client Details</h3>
        <div className="space-y-4">
          <input
            placeholder="Client Name"
            value={data.receiver.name}
            onChange={(e) => handleChange(e, 'receiver', 'name')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
          <input
            placeholder="Company Name"
            value={data.receiver.company}
            onChange={(e) => handleChange(e, 'receiver', 'company')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
          <textarea
            rows={2}
            placeholder="Address"
            value={data.receiver.address}
            onChange={(e) => handleChange(e, 'receiver', 'address')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
          />
           <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Phone"
              value={data.receiver.phone}
              onChange={(e) => handleChange(e, 'receiver', 'phone')}
              className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            <input
                placeholder="GSTIN"
                value={data.receiver.gst || ''}
                onChange={(e) => handleChange(e, 'receiver', 'gst')}
                className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

       {/* Items Meta Options */}
       <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-600">Settings</h3>
         <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                checked={data.showImages} 
                onChange={(e) => onChange('meta', 'showImages', e.target.checked)}
                id="showImages"
            />
            <label htmlFor="showImages">Show Item Images</label>
         </div>
      </div>


      {/* Items Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Items</h3>
          <button
            onClick={onAddItem}
            className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded hover:bg-blue-100 transition-colors"
          >
            + Add Item
          </button>
        </div>
        
        <div className="space-y-4">
          {data.items.map((item, index) => (
            <div key={index} className="p-4 border border-gray-100 rounded-lg bg-gray-50/50 relative group hover:border-blue-100 transition-colors">
              <button
                onClick={() => onRemoveItem(index)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
              </button>
              <div className="space-y-3">
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => onItemChange(index, 'description', e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
                 <input
                  placeholder="Image URL"
                  value={item.image}
                  onChange={(e) => onItemChange(index, 'image', e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                    <input
                        placeholder="Make"
                        value={item.make}
                        onChange={(e) => onItemChange(index, 'make', e.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                     <input
                        placeholder="HSN/SAC"
                        value={item.hsn || ''}
                        onChange={(e) => onItemChange(index, 'hsn', e.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                 <div className="grid grid-cols-3 gap-3">
                     <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => onItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                    <input
                        type="number"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => onItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                    <input
                        type="number"
                        placeholder="GST %"
                        value={item.gst}
                        onChange={(e) => onItemChange(index, 'gst', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer Details */}
       <div className="mb-8">
        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Terms & Footer</h3>
        <textarea
            placeholder="Terms and Conditions (one per line)"
            rows={4}
            value={data.terms}
            onChange={(e) => handleChange(e, 'meta', 'terms')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all mb-4"
        />
        <input
            placeholder="Authorized Signatory Label"
            value={data.sender.signatory}
            onChange={(e) => handleChange(e, 'sender', 'signatory')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

       {/* Last spacer */}
       <div className="h-10"></div>
       </div>

    </div>
  );
};

export default QuotationForm;
