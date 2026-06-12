'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title = "Confirm Action", message = "Are you sure you want to proceed?" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                {message}
            </p>
            
            <div className="flex gap-3 w-full">
                <button 
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                >
                    Confirm
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
