'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { Menu, Save, Briefcase, MapPin, Phone, User, Mic, MicOff } from 'lucide-react';

export default function CreateWorkPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    instructions: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [isListening, setIsListening] = useState(null); // 'address', 'instructions', or null
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, []);

  const handleVoiceInput = (field) => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition is not supported in this browser. Please use Chrome.");
        return;
    }

    if (isListening) {
        // Stop listening if already listening
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(null);
        return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Default to Indian English

    recognitionRef.current = recognition;

    recognition.onstart = () => {
        setIsListening(field);
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript) {
            setFormData(prev => ({
                ...prev,
                [field]: (prev[field] ? prev[field] + ' ' : '') + finalTranscript
            }));
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(null);
        recognitionRef.current = null;
    };

    recognition.onend = () => {
        setIsListening(null);
        recognitionRef.current = null;
    };

    recognition.start();
  };

  const handleSave = async () => {
    if (!formData.clientName.trim()) {
        alert("Client Name is required");
        return;
    }

    setStatus('loading');
    try {
        const res = await fetch('/api/works', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setStatus('success');
            // Reset form or navigate
            setFormData({ clientName: '', clientPhone: '', clientAddress: '', instructions: '' });
            alert("Work Assigned Successfully!");
            router.push('/works');
        } else {
            setStatus('error');
            alert("Failed to assign work.");
        }

    } catch (e) {
        console.error(e);
        setStatus('error');
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
        <Sidebar activePage="Assign Work" />
      </div>
      
       {/* Overlay */}
       {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
            
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-8 h-8 text-blue-600" />
                    Assign New Work
                </h1>
                <p className="text-slate-500 mt-1">Fill in the details to assign a new task to your team.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    
                    {/* Client Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Client Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="text"
                                value={formData.clientName}
                                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                                placeholder="e.g. Acme Innovations"
                                className="w-full pl-10 pr-4 py-3 text-black     bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="tel"
                                value={formData.clientPhone}
                                onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                                placeholder="e.g. 9876543210"
                                className="w-full pl-10 pr-4 py-3 text-black bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                     {/* Address */}
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Client Address / Site Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <textarea 
                                rows={3}
                                value={formData.clientAddress}
                                onChange={(e) => setFormData({...formData, clientAddress: e.target.value})}
                                placeholder="e.g. 123 Industrial Estate, Mumbai"
                                className="w-full pl-10 pr-12 py-3 text-black bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                            />
                            <button
                                onClick={() => handleVoiceInput('clientAddress')}
                                className={`absolute right-3 top-3 p-1.5 rounded-full transition-all ${
                                    isListening === 'clientAddress' 
                                    ? 'bg-red-100 text-red-600 animate-pulse' 
                                    : 'hover:bg-slate-200 text-slate-400 hover:text-blue-600'
                                }`}
                                title="Speech to Text"
                            >
                                {isListening === 'clientAddress' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Work Description / Instructions</label>
                        <div className="relative">
                            <textarea 
                                rows={4}
                                value={formData.instructions}
                                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                                placeholder="Describe what needs to be done..."
                                className="w-full p-4 pr-12 text-black bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                            />
                             <button
                                onClick={() => handleVoiceInput('instructions')}
                                className={`absolute right-3 top-3 p-1.5 rounded-full transition-all ${
                                    isListening === 'instructions' 
                                    ? 'bg-red-100 text-red-600 animate-pulse' 
                                    : 'hover:bg-slate-200 text-slate-400 hover:text-blue-600'
                                }`}
                                title="Speech to Text"
                            >
                                {isListening === 'instructions' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={status === 'loading'}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        {status === 'loading' ? 'Assigning...' : 'Assign Work'}
                    </button>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}
