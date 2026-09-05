'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, Plus, Search, Trash2, Edit, Save, X, Building2, Phone, Mail, User as UserIcon, MapPin, Package, ScanLine, Camera } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

const emptyPerson = () => ({ name: '', designation: '', mobile: '', email: '' });

const emptyForm = () => ({
  companyName: '',
  officeAddress: '',
  rmaAddress: '',
  products: '',
  notes: '',
  people: [emptyPerson()],
});

export default function ContactsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [scanImages, setScanImages] = useState([]); // captured data URLs, max 2 (front + back)
  const scanInputRef = useRef(null);

  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role;
      if (role !== 'admin' && role !== 'super-admin') {
        router.push('/');
      } else {
        fetchContacts();
      }
    }
  }, [isLoaded, user, router]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      if (Array.isArray(data)) setContacts(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  // Search across every field, including every person's own fields — so any
  // keyword the user remembers (company, product, area code, colleague's name,
  // partial email) surfaces the row.
  const filteredContacts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(c => {
      const haystack = [
        c.companyName,
        c.officeAddress,
        c.rmaAddress,
        c.products,
        c.notes,
        ...(Array.isArray(c.people) ? c.people.flatMap(p => [p.name, p.designation, p.mobile, p.email]) : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [contacts, searchTerm]);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm());
    setShowForm(true);
  };

  const openEditForm = (c) => {
    setEditingId(c.id);
    setFormData({
      companyName: c.companyName || '',
      officeAddress: c.officeAddress || '',
      rmaAddress: c.rmaAddress || '',
      products: c.products || '',
      notes: c.notes || '',
      people: Array.isArray(c.people) && c.people.length > 0 ? c.people : [emptyPerson()],
    });
    setShowForm(true);
  };

  const handleFieldChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handlePersonChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      people: prev.people.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const addPerson = () => setFormData(prev => ({ ...prev, people: [...prev.people, emptyPerson()] }));
  const removePerson = (index) => {
    setFormData(prev => ({
      ...prev,
      people: prev.people.length === 1 ? [emptyPerson()] : prev.people.filter((_, i) => i !== index),
    }));
  };

  // Business-card scan: send the image to /api/contacts/scan (which asks
  // Google Gemini to OCR + structure the card), then merge the response into
  // the form. Scanned values only fill EMPTY fields — nothing already typed
  // is overwritten. Extra people from the card are appended so nothing is lost.
  //
  // We resize the image client-side before upload — modern phone cameras
  // produce 10 MB+ files, and Gemini's inference time scales with pixel count.
  // 1600px on the long side keeps card text perfectly legible while cutting
  // upload + inference to a few seconds instead of a minute.
  const resizeImageToJpeg = (file, maxDim = 1600, quality = 0.85) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Adds one captured image (front or back) to the pending scan queue. Doesn't
  // hit the API — the actual scan runs when the user clicks "Read card" so
  // both sides go to Gemini in a single call (cheaper + it can merge fields).
  const handleScanFile = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await resizeImageToJpeg(file);
      setScanImages(prev => (prev.length >= 2 ? prev : [...prev, dataUrl]));
    } catch (err) {
      console.error('Image prep failed:', err);
      toast.error("Couldn't process that image. Try a different photo.");
    } finally {
      if (scanInputRef.current) scanInputRef.current.value = '';
    }
  };

  const removeScanImage = (index) => {
    setScanImages(prev => prev.filter((_, i) => i !== index));
  };

  const runScan = async () => {
    if (scanImages.length === 0 || isScanning) return;
    setIsScanning(true);
    try {
      const res = await fetch('/api/contacts/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: scanImages }),
      });

      const parsed = await res.json();
      if (!res.ok) {
        toast.error(parsed?.error || 'Failed to read the card');
        return;
      }

      const anyField = parsed.companyName || parsed.officeAddress || parsed.products
        || (Array.isArray(parsed.people) && parsed.people.length > 0);
      if (!anyField) {
        toast.error("Could not read the card. Try a clearer, well-lit photo with the text upright.");
        return;
      }

      setFormData(prev => {
        // Fill the first empty person row in place, then append the rest.
        const scannedPeople = (parsed.people || []).filter(p => p.name || p.mobile || p.email || p.designation);
        const first = prev.people[0];
        const firstIsEmpty = !first?.name && !first?.designation && !first?.mobile && !first?.email;

        let people;
        if (scannedPeople.length === 0) {
          people = prev.people;
        } else if (firstIsEmpty) {
          people = [scannedPeople[0], ...prev.people.slice(1), ...scannedPeople.slice(1)];
        } else {
          people = [...prev.people, ...scannedPeople];
        }

        return {
          ...prev,
          companyName: prev.companyName || parsed.companyName || '',
          officeAddress: prev.officeAddress || parsed.officeAddress || '',
          rmaAddress: prev.rmaAddress || parsed.rmaAddress || '',
          products: prev.products || parsed.products || '',
          notes: [prev.notes, parsed.notes].filter(Boolean).join('\n'),
          people,
        };
      });

      toast.success('Card scanned — please review the fields before saving.');
      setScanImages([]);
    } catch (err) {
      console.error('Scan failed:', err);
      toast.error('Scan failed. Try again with a clearer photo.');
    } finally {
      setIsScanning(false);
    }
  };

  const openScanFromButton = () => {
    if (isScanning) return;
    // Open the form (which contains the scanner panel) and immediately open the
    // camera/file picker so the user can capture the first side right away.
    if (!showForm) {
      setEditingId(null);
      setFormData(emptyForm());
      setScanImages([]);
      setShowForm(true);
    }
    setTimeout(() => scanInputRef.current?.click(), 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    setIsSaving(true);
    try {
      const url = editingId ? `/api/contacts/${editingId}` : '/api/contacts';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? 'Contact updated' : 'Contact added');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm());
      fetchContacts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Contact deleted');
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete contact');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm h-16">
        <div className="font-bold text-slate-800">Champion Security</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={`flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                Contacts
              </h1>
              <p className="text-slate-500 mt-1">OEM sales reps, vertical heads, and other partner contacts.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={openScanFromButton}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-xl shadow-sm transition-all disabled:opacity-60"
                title="Scan a business card with your camera"
              >
                <ScanLine className="w-4 h-4" />
                {isScanning ? 'Scanning…' : 'Scan Card'}
              </button>
              <button
                onClick={openAddForm}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by company, product, person name, email, phone, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-xs text-slate-500 mt-2">
                {filteredContacts.length} of {contacts.length} contacts match
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-white/40 shadow-xl shadow-slate-200/40 text-center text-slate-500">
              <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">No contacts yet</p>
              <p className="text-sm mt-1">Click "Add Contact" to save your first OEM contact.</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-white/40 shadow-xl shadow-slate-200/40 text-center text-slate-500">
              <Search className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">No matches for "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-blue-500 hover:text-blue-600 font-medium text-sm mt-2">Clear search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg truncate">{c.companyName}</h3>
                      {c.products && (
                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <Package className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{c.products}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => openEditForm(c)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmModal({ isOpen: true, id: c.id, name: c.companyName })}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {Array.isArray(c.people) && c.people.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {c.people.map((p, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-semibold text-slate-800 text-sm">{p.name || 'Unnamed'}</span>
                            {p.designation && <span className="text-xs text-slate-500">· {p.designation}</span>}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 pl-5">
                            {(p.mobile || '').split(/[\/,;]/).map(x => x.trim()).filter(Boolean).map((num, k) => (
                              <a key={`t${k}`} href={`tel:${num}`} className="flex items-center gap-1 hover:text-blue-600">
                                <Phone className="w-3 h-3" /> {num}
                              </a>
                            ))}
                            {(p.email || '').split(/[\/,;\s]/).map(x => x.trim()).filter(Boolean).map((addr, k) => (
                              <a key={`e${k}`} href={`mailto:${addr}`} className="flex items-center gap-1 hover:text-blue-600 truncate">
                                <Mail className="w-3 h-3" /> {addr}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(c.officeAddress || c.rmaAddress) && (
                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      {c.officeAddress && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 mt-0.5 text-slate-400 flex-shrink-0" />
                          <span><span className="font-semibold text-slate-700">Office:</span> {c.officeAddress}</span>
                        </div>
                      )}
                      {c.rmaAddress && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 mt-0.5 text-slate-400 flex-shrink-0" />
                          <span><span className="font-semibold text-slate-700">RMA:</span> {c.rmaAddress}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {c.notes && (
                    <p className="text-xs text-slate-500 italic mt-3 pt-3 border-t border-slate-100">
                      {c.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setScanImages([]); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">Scan a business card</p>
                    <p className="text-[11px] text-slate-500">Add front only, or front + back — we'll merge both sides into one contact.</p>
                  </div>
                </div>

                {scanImages.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {scanImages.map((src, i) => (
                      <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden border border-indigo-200 bg-white">
                        <img src={src} alt={i === 0 ? 'Front' : 'Back'} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-semibold uppercase">
                          {i === 0 ? 'Front' : 'Back'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeScanImage(i)}
                          className="absolute -top-1 -right-1 bg-white border border-slate-300 rounded-full p-0.5 text-slate-500 hover:text-red-600 shadow-sm"
                          title="Remove"
                          disabled={isScanning}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {scanImages.length < 2 && (
                    <button
                      type="button"
                      onClick={() => scanInputRef.current?.click()}
                      disabled={isScanning}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-50 disabled:opacity-60"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {scanImages.length === 0 ? 'Take / choose photo' : '+ Add back side'}
                    </button>
                  )}
                  {scanImages.length > 0 && (
                    <button
                      type="button"
                      onClick={runScan}
                      disabled={isScanning}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-60"
                    >
                      <ScanLine className="w-3.5 h-3.5" />
                      {isScanning
                        ? 'Reading…'
                        : `Read ${scanImages.length === 2 ? 'both sides' : 'card'}`}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Company / OEM Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Hikvision India"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Products / What they sell</label>
                <textarea
                  rows={2}
                  value={formData.products}
                  onChange={(e) => handleFieldChange('products', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. CCTV cameras, NVRs, access control, video door phones"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Office Address</label>
                  <textarea
                    rows={3}
                    value={formData.officeAddress}
                    onChange={(e) => handleFieldChange('officeAddress', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Head office / sales office address"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">RMA Address</label>
                  <textarea
                    rows={3}
                    value={formData.rmaAddress}
                    onChange={(e) => handleFieldChange('rmaAddress', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Where to send items for replacement / repair"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">People</label>
                  <button
                    type="button"
                    onClick={addPerson}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Person
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.people.map((p, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500">Person #{i + 1}</span>
                        {formData.people.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePerson(i)}
                            className="text-rose-500 hover:text-rose-700"
                            title="Remove person"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={p.name}
                          onChange={(e) => handlePersonChange(i, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Designation (e.g. Sales Manager)"
                          value={p.designation}
                          onChange={(e) => handlePersonChange(i, 'designation', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="tel"
                          placeholder="Mobile / Phone"
                          value={p.mobile}
                          onChange={(e) => handlePersonChange(i, 'mobile', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Email (multiple allowed, separated by / or ,)"
                          value={p.email}
                          onChange={(e) => handlePersonChange(i, 'email', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Anything else worth remembering"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setScanImages([]); }}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : (editingId ? 'Update Contact' : 'Save Contact')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
        onConfirm={() => {
          if (confirmModal.id) handleDelete(confirmModal.id);
        }}
        title="Delete Contact"
        message={`Delete "${confirmModal.name}"? This cannot be undone.`}
      />

      <input
        ref={scanInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleScanFile(file);
        }}
      />

      {isScanning && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl z-[60] flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <div className="text-sm">
            <p className="font-semibold">Reading card…</p>
            <p className="text-xs text-slate-300">Usually takes 2–5 seconds.</p>
          </div>
        </div>
      )}
    </div>
  );
}
