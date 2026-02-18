"use client";
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Search, Calendar, FileDown, Plus, Save } from 'lucide-react';

import Sidebar from '../components/Sidebar';

const WorksheetPage = () => {
    // Initial data structure
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Columns configuration
    const columns = [
        { key: 'date', label: 'DATE', type: 'date', width: 'min-w-[130px]' },
        { key: 'work', label: 'WORK DETAILS', type: 'text', width: 'min-w-[180px]' },
        { key: 'person', label: 'ASSIGNED PERSON', type: 'text', width: 'min-w-[140px]' },
        { key: 'client', label: 'CLIENT INFO', type: 'textarea', width: 'min-w-[200px]' },
        { key: 'startTime', label: 'START', type: 'time', width: 'min-w-[100px]' },
        { key: 'endTime', label: 'END', type: 'time', width: 'min-w-[100px]' },
        { key: 'location', label: 'LOCATION', type: 'text', width: 'min-w-[140px]' },
        { key: 'products', label: 'PRODUCT INFO', type: 'textarea', width: 'min-w-[220px]' }, 
        { key: 'report', label: 'REPORT', type: 'text', width: 'min-w-[150px]' },
        { key: 'status', label: 'STATUS', type: 'select', options: ['Pending', 'Completed', 'In Progress', 'Cancelled'], width: 'min-w-[130px]' },
        { key: 'payment', label: 'PAYMENT', type: 'text', width: 'min-w-[120px]' },
        { key: 'remark', label: 'REMARK', type: 'text', width: 'min-w-[150px]' },
    ];

    // Load from API on mount
    useEffect(() => {
        fetchWorksheets();
    }, []);

    const fetchWorksheets = async () => {
        try {
            const res = await fetch('/api/worksheets');
            const data = await res.json();
            if (Array.isArray(data)) {
                setRows(data);
            }
        } catch (error) {
            console.error("Failed to load worksheets:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredRows = rows.filter(row => {
        const matchesSearch = 
            (row.client?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (row.work?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (row.person?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (row.products?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (row.location?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
        
        const matchesDate = filterDate ? row.date === filterDate : true;

        return matchesSearch && matchesDate;
    });

    const handleChange = async (id, field, value) => {
        // Optimistic update
        const oldRows = [...rows];
        setRows(prev => prev.map(row => 
            row.id === id ? { ...row, [field]: value } : row
        ));

        // Debounce or just save on blur would be better, but for now specific save button is used, 
        // however the user asked for "updates automatically". 
        // Let's implement auto-save for status or critical fields, or keep the save button for bulk.
        // Actually the prompt said "when the employee punch out the worksheet should get updated automatically", which is handled in works/page.js
        // For this admin grid, we can keep the save button or auto-save.
        // Let's implement individual field update if needed, but for now we'll stick to the "Save Grid" button logic modified to generic "Save Row" or keep "Save Grid" as bulk update?
        // Bulk update might be heavy. Let's do row-level update on Save, or keep local state and batch save.
        // To be safe and simple, let's keep local state updating, and "Save Grid" will push changes.
        // BUT, since we have a database now, it's better to update per row or have a clear save action.
        // The original code had a "Save Grid" button. Let's make that button save ALL modified rows or just all rows.
    };

    const addRow = async () => {
        try {
            const res = await fetch('/api/worksheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString().split('T')[0],
                    work: '', person: '', client: '', startTime: '', endTime: '', location: '', products: '', report: '', status: 'Pending', payment: '', remark: ''
                })
            });
            const newRow = await res.json();
            setRows(prev => [newRow, ...prev]);
        } catch (error) {
            console.error("Failed to add row:", error);
            alert("Failed to add new row");
        }
    };

    const deleteRow = async (id) => {
        if (confirm('Are you sure you want to delete this row?')) {
            // Optimistic
            setRows(prev => prev.filter(row => row.id !== id));
            try {
                await fetch(`/api/worksheets?id=${id}`, { method: 'DELETE' });
            } catch (error) {
                console.error("Failed to delete:", error);
                alert("Failed to delete row");
                fetchWorksheets(); // Revert
            }
        }
    };

    const saveData = async () => {
        // We'll treat this as "Save All Changes" - might be inefficient but simple for migration
        // Or better, we only save changed rows? Tracking changes is complex.
        // Let's just loop and update all? No, that's too many requests.
        // Let's just create a BULK UPDATE endpoint vs loop.
        // For now, let's just make it clear: "Changes are saved locally until you click Save?". No, with DB it should be more instant or explicit.
        // Let's make "Save Grid" update each row that changed?
        // Simplest strategy for now: Loop through rows and PUT.
        
        // BETTER: The user might expect auto-save now that we are online.
        // BUT, to avoid regression, let's make the "Save Grid" button work by iterating.
        
        let success = true;
        for(let row of rows) {
             try {
                 await fetch('/api/worksheets', {
                     method: 'PUT',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(row)
                 });
             } catch(e) {
                 console.error(e);
                 success = false;
             }
        }
        
        if(success) alert('Worksheet saved successfully!');
        else alert('Some rows failed to save.');
    };

    // PDF Export
    const exportPDF = (type = 'all') => {
        const doc = new jsPDF('l', 'mm', 'a3'); 
        const today = new Date();
        
        let dataToExport = rows;
        let title = 'Worksheet Report';

        const isWithinDays = (dateStr, days) => {
             if(!dateStr) return false;
             const d = new Date(dateStr);
             const diffTime = Math.abs(today - d);
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             return diffDays <= days;
        };

        if (type === 'weekly') {
            dataToExport = rows.filter(r => isWithinDays(r.date, 7));
            title += ' - Weekly';
        } else if (type === 'monthly') {
            dataToExport = rows.filter(r => isWithinDays(r.date, 30));
             title += ' - Monthly';
        } else if (type === 'yearly') {
            dataToExport = rows.filter(r => isWithinDays(r.date, 365));
             title += ' - Yearly';
        } else if (type === 'filtered') {
            dataToExport = filteredRows;
            title += ' - Custom Filter';
        }

        if (dataToExport.length === 0) {
            alert('No data found for the selected range. Please ensure your rows have valid "Date" entries for Weekly/Monthly/Yearly exports.');
            return;
        }

        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${today.toLocaleDateString()}`, 14, 20);

        const tableColumn = columns.map(col => col.label);
        const tableRows = dataToExport.map(row => {
            return columns.map(col => row[col.key] || '');
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: {
                8: { cellWidth: 50 }, // Products column
            },
            theme: 'grid'
        });

        doc.save(`worksheet_${type}_${today.toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans relative overflow-x-hidden">
             {/* Mobile Header / Hamburger */}
             <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm">
                <div className="font-bold text-slate-800">Champion Security</div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
             </div>

             {/* Fixed Sidebar */}
             <Sidebar 
                 isOpen={isMobileMenuOpen} 
                 onClose={() => setIsMobileMenuOpen(false)} 
                 isCollapsed={isSidebarCollapsed}
                 toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
             />

            {/* Main Content Area */}
            <main className={`min-w-0 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300 min-h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                {/* Header */}
                <div className="flex flex-col mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mb-2 uppercase tracking-wider font-medium">
                                <span>Operations</span>
                                <span className="text-slate-300">/</span>
                                <span>Worksheets</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-900">Main Grid</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Operational Grid</h1>
                            <p className="text-slate-500 max-w-2xl text-sm leading-relaxed">
                                Comprehensive management of daily tasks, client interactions, site deployments, and operational reports.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <button 
                                onClick={saveData}
                                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-all border border-slate-200"
                            >
                                <Save className="w-3.5 h-3.5" />
                                Save Grid
                            </button>
                            <button 
                                onClick={addRow}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all shadow-blue-200 shadow-lg"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add New Row
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-t-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm relative z-20">
                    <div className="flex gap-4 w-full md:w-auto flex-1">
                        <div className="relative group flex-1 md:flex-initial md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search entries..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="date" 
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-500"
                            />
                        </div>
                        {(searchTerm || filterDate) && (
                            <button 
                                onClick={() => { setSearchTerm(''); setFilterDate(''); }}
                                className="text-xs text-red-500 hover:text-red-700 ml-2"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest mr-3">Export As</span>
                        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                            <button onClick={() => exportPDF('filtered')} className="px-3 py-1.5 hover:bg-white text-slate-500 hover:text-slate-800 text-xs font-medium rounded transition-colors shadow-sm">All</button>
                            <div className="w-px h-4 bg-slate-300 mx-1"></div>
                            <button onClick={() => exportPDF('weekly')} className="px-3 py-1.5 hover:bg-white text-slate-500 hover:text-slate-800 text-xs font-medium rounded transition-colors shadow-sm">Weekly</button>
                            <div className="w-px h-4 bg-slate-300 mx-1"></div>
                            <button onClick={() => exportPDF('monthly')} className="px-3 py-1.5 hover:bg-white text-slate-500 hover:text-slate-800 text-xs font-medium rounded transition-colors shadow-sm">Monthly</button>
                            <div className="w-px h-4 bg-slate-300 mx-1"></div>
                            <button onClick={() => exportPDF('yearly')} className="px-3 py-1.5 hover:bg-white text-slate-500 hover:text-slate-800 text-xs font-medium rounded transition-colors shadow-sm">Yearly</button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto bg-white border-x border-b border-slate-200 rounded-b-xl relative shadow-sm">
                    <table className="min-w-max text-sm text-left border-collapse w-full">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-slate-200 text-center w-12 text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-12">#</th>
                                {columns.map(col => (
                                    <th key={col.key} className={`p-4 border-b border-slate-200 text-left ${col.width} whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-slate-500`}>
                                        {col.label}
                                    </th>
                                ))}
                                <th className="p-4 border-b border-slate-200 w-12 sticky right-0 bg-slate-50 z-10"></th>
                            </tr>
                        </thead>
                        <tbody className="">
                            {filteredRows.map((row, index) => (
                                <tr key={row.id} className="group hover:bg-blue-50/30 transition-colors border-b border-slate-100 last:border-0">
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">
                                        {String(index + 1).padStart(4, '0')}
                                    </td>
                                    {columns.map(col => (
                                        <td key={`${row.id}-${col.key}`} className="p-2 align-top">
                                            {col.type === 'select' ? (
                                                <div className="relative">
                                                    <select
                                                        value={row[col.key]}
                                                        onChange={(e) => handleChange(row.id, col.key, e.target.value)}
                                                        className={`w-full p-2 bg-transparent outline-none rounded text-xs font-medium appearance-none cursor-pointer transition-colors ${
                                                            row[col.key] === 'Completed' ? 'text-emerald-600 font-semibold' :
                                                            row[col.key] === 'Pending' ? 'text-amber-600 font-semibold' :
                                                            row[col.key] === 'Cancelled' ? 'text-red-500 font-semibold' :
                                                            'text-slate-700'
                                                        }`}
                                                    >
                                                        <option value="" className="bg-white text-slate-400">Select Status</option>
                                                        {col.options.map(opt => (
                                                            <option key={opt} value={opt} className="bg-white text-slate-900">{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : col.type === 'textarea' ? (
                                                <textarea
                                                    value={row[col.key]}
                                                    onChange={(e) => handleChange(row.id, col.key, e.target.value)}
                                                    className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm resize-none overflow-hidden min-h-[24px] leading-relaxed selection:bg-blue-100"
                                                    placeholder="Enter details..."
                                                    rows={1}
                                                    style={{ height: 'auto' }}
                                                    onInput={(e) => {
                                                        e.target.style.height = 'auto'; 
                                                        e.target.style.height = e.target.scrollHeight + 'px'; 
                                                    }}
                                                />
                                            ) : (
                                                <input
                                                    type={col.type}
                                                    value={row[col.key]}
                                                    onChange={(e) => handleChange(row.id, col.key, e.target.value)}
                                                    className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm h-full py-1 selection:bg-blue-100"
                                                    placeholder="..."
                                                />
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-2 text-center sticky right-0 bg-white group-hover:bg-blue-50/10 transition-colors shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.05)]">
                                        <button 
                                            onClick={() => deleteRow(row.id)}
                                            className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Row"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {filteredRows.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <p className="mb-4 text-sm font-medium">No filtered results found</p>
                            {(searchTerm || filterDate) ? (
                                <button onClick={() => { setSearchTerm(''); setFilterDate(''); }} className="text-blue-600 hover:text-blue-800 underline text-xs">Clear filters</button>
                            ) : (
                                <button onClick={addRow} className="text-blue-600 hover:text-blue-800 underline text-xs">Add your first entry</button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WorksheetPage;
