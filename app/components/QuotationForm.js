import React, { useState } from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Component ---
function SortableItem(props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div className={`p-6 border rounded-lg bg-gray-50/50 relative hover:border-blue-100 transition-colors ${isDragging ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
                {/* Drag Handle */}
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="absolute top-1/2 -right-3 -mt-3 p-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg shadow-sm z-20 hover:shadow-md transition-all"
                    title="Drag to reorder"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
                    </svg>
                </div>

                {props.children}
            </div>
        </div>
    );
}

const QuotationForm = ({ data, onChange, onAddItem, onRemoveItem, onItemChange, onSave, isSaving, isEditMode, onShare, onReorderItems }) => {

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            delay: 100,
            tolerance: 5,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
        const oldIndex = parseInt(active.id);
        const newIndex = parseInt(over.id);
        
        const newItems = arrayMove(data.items, oldIndex, newIndex);
        if(onReorderItems) onReorderItems(newItems);
    }
  };

  const handleChange = (e, section, field) => {
    if (section === 'meta') {
      onChange(section, field, e.target.value);
    } else {
      onChange(section, field, e.target.value);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32">
      {/* Header */}
      <h2 className="text-xl font-bold mb-6 text-gray-800">
          {isEditMode ? 'Edit Quotation' : 'Create Quotation'}
      </h2>
      
      {/* Form Header Options */}
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/80 backdrop-blur-md z-30 py-4 border-b border-gray-100 -mx-4 px-4 md:-mx-8 md:px-8">
           <div className="flex items-center gap-2">
               <input 
                   value={data.quotationNo}
                   onChange={(e) => onChange('meta', 'quotationNo', e.target.value)}
                   className="font-mono text-sm font-bold bg-gray-50 border border-gray-200 rounded px-2 py-1 w-48 focus:border-blue-500 outline-none"
               />
               <input 
                   type="date"
                   value={data.date}
                   onChange={(e) => onChange('meta', 'date', e.target.value)}
                    className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:border-blue-500 outline-none"
               />
           </div>
           
           <div className="flex gap-2">
                {isEditMode && (
                     <button
                        onClick={onShare}
                        className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                    </button>
                )}
               <button
                  onClick={onSave}
                  disabled={isSaving}
                  className={`px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-green-300 transition-all ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
               >
                  {isSaving ? 'Saving...' : 'Save'}
               </button>
           </div>
      </div>

       {/* Type Toggle - Only show if not fixed */}
       {!data.fixedType && (
           <div className="mb-6">
              <label className="block text-xs font-medium text-gray-500 mb-1">Document Type</label>
               <div className="flex bg-gray-100 p-1 rounded-md w-fit">
                  <button 
                      onClick={() => onChange('meta', 'type', 'Quotation')}
                      className={`px-4 py-1.5 text-sm font-medium rounded ${data.type !== 'Proforma' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      Quotation
                  </button>
                   <button 
                      onClick={() => onChange('meta', 'type', 'Proforma')}
                      className={`px-4 py-1.5 text-sm font-medium rounded ${data.type === 'Proforma' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      Proforma Invoice
                  </button>
               </div>
           </div>
       )}

      {/* Meta Fields */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
               {data.type === 'Proforma' ? (
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">PO Date</label>
                        <input
                            type="date"
                            value={data.poDate || ''}
                            onChange={(e) => handleChange(e, 'meta', 'poDate')}
                            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">PO No.</label>
                        <input
                            value={data.poNo || ''}
                            onChange={(e) => handleChange(e, 'meta', 'poNo')}
                            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                 </div>
               ) : (
                <>
                <label className="block text-xs font-medium text-gray-500 mb-1">Valid Till</label>
                <input
                    type="date"
                    value={data.validTill}
                    onChange={(e) => handleChange(e, 'meta', 'validTill')}
                    className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
                </>
               )}
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
            placeholder="Company Name"
            value={data.receiver.company}
            onChange={(e) => handleChange(e, 'receiver', 'company')}
            className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
          <input
            placeholder="Client Name"
            value={data.receiver.name}
            onChange={(e) => handleChange(e, 'receiver', 'name')}
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
                 <label htmlFor="showImages" className="text-sm">Show Item Images</label>
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
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
             <SortableContext 
                items={data.items.map((_, i) => `${i}`)}
                strategy={verticalListSortingStrategy}
             >
                {data.items.map((item, index) => (
                    <SortableItem key={index} id={`${index}`}>
                         {/* Item Actions */}
                          <button
                             type="button" 
                             onClick={() => onRemoveItem(index)}
                             className="absolute right-1 -top-0.5 text-red-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full z-10"
                             // Stop propagation to prevent drag
                             onPointerDown={(e) => e.stopPropagation()}
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                          </button>

                          {/* Serial Number */}
                          <div className="absolute left-0 top-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-br-lg rounded-tl-lg z-10 shadow-sm">
                              #{index + 1}
                          </div>

                          {/* Item Fields */}
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
                    </SortableItem>
                ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

       {/* Terms & Footer */}
       <div className="mb-8">
         <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Terms & Footer</h3>
         <div className="space-y-4">
           <textarea
             rows={6}
             value={data.terms}
             onChange={(e) => onChange('meta', 'terms', e.target.value)}
             className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-y"
             placeholder="Terms and Conditions..."
           />
         </div>
       </div>

    </div>
  );
};

export default QuotationForm;
