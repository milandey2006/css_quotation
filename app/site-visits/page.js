"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, MapPin, RefreshCw, Calendar, Search, FileDown } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SiteVisitsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // RBAC: Only admin and super-admin
  useEffect(() => {
    if (isLoaded) {
        const role = user?.publicMetadata?.role;
        if (role !== 'admin' && role !== 'super-admin') {
            router.push('/');
        }
    }
  }, [isLoaded, user, router]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [siteVisits, setSiteVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Fetch and Process Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/punch');
      if (res.ok) {
        const rawPunches = await res.json();
        processPunches(rawPunches);
      }
    } catch (error) {
      console.error("Failed to fetch site visits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && (user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'super-admin')) {
        fetchData();
    }
  }, [isLoaded, user]);

  const processPunches = (punches) => {
    // 1. Sort by timestamp ascending
    const sorted = [...punches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 2. Group by Employee
    const byEmployee = {};
    sorted.forEach(p => {
        if (!byEmployee[p.employeeId]) byEmployee[p.employeeId] = [];
        byEmployee[p.employeeId].push(p);
    });

    // 3. Pair In/Out
    const visits = [];

    Object.keys(byEmployee).forEach(empId => {
        const empPunches = byEmployee[empId];
        let currentIn = null;

        empPunches.forEach(p => {
            if (p.type === 'in') {
                // If we already have an 'currentIn', it means the previous one was never clocked out. 
                // We could mark it as incomplete, or just overwrite. 
                // For this view, we'll overwrite to focus on valid pairs, 
                // or we could push the previous as 'Incomplete'.
                // Let's just reset for now.
                currentIn = p;
            } else if (p.type === 'out' && currentIn) {
                // Found a pair
                const inTime = new Date(currentIn.timestamp);
                const outTime = new Date(p.timestamp);
                const diffMs = outTime - inTime;
                
                // Duration Calculation
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                visits.push({
                    id: `${currentIn.id}-${p.id}`,
                    date: inTime.toLocaleDateString(),
                    rawDate: inTime, // For sorting final list
                    employeeId: empId,
                    clientName: currentIn.clientName || '-',
                    areaName: currentIn.areaName || '-',
                    workDetails: currentIn.workDetails || '-',
                    startTime: inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    endTime: outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    duration: `${hours}h ${minutes}m`,
                    locationIn: currentIn.location,
                    locationOut: p.location
                });

                currentIn = null; // Reset
            }
        });
    });

    // Filter out "Office" visits (case-insensitive)
    const clientVisits = visits.filter(v => v.clientName.toLowerCase() !== 'office');

    // 4. Sort Final List (Newest first)
    clientVisits.sort((a, b) => b.rawDate - a.rawDate);
    setSiteVisits(clientVisits);
  };

  // Filter Logic
  const filteredVisits = siteVisits.filter(visit => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
        visit.employeeId.toLowerCase().includes(term) ||
        visit.clientName.toLowerCase().includes(term) ||
        visit.areaName.toLowerCase().includes(term);

    const matchesDate = filterDate ? (() => {
        const fDate = new Date(filterDate).toLocaleDateString();
        return visit.date === fDate;
    })() : true;

    return matchesSearch && matchesDate;
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Site Visit Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    const tableColumn = ["Date", "Employee", "Client", "Location", "In", "Out", "Duration"];
    const tableRows = filteredVisits.map(v => [
        v.date,
        v.employeeId,
        v.clientName,
        v.areaName,
        v.startTime,
        v.endTime,
        v.duration
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`Site_Visits_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative">
       {/* Mobile Header */}
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

      <main className={`flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900">Site Visit Logs</h1>
                   <p className="text-slate-500 text-sm">Detailed breakdown of work sessions and duration per site.</p>
                </div>
                <button 
                  onClick={fetchData}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search Employee, Client, or Location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                    />
                </div>
                {(searchTerm || filterDate) && (
                    <button onClick={() => { setSearchTerm(''); setFilterDate(''); }} className="text-red-500 text-xs font-medium px-2">
                        Clear
                    </button>
                )}
                <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                <button 
                    onClick={generatePDF}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                    <FileDown className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Client / Work</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">In Time</th>
                                <th className="px-6 py-4">Out Time</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4 text-right">Map</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500">Loading visit logs...</td></tr>
                            ) : filteredVisits.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500">No visit records found matching your filters.</td></tr>
                            ) : (
                                filteredVisits.map((visit) => (
                                    <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{visit.date}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{visit.employeeId}</td>
                                        <td className="px-6 py-4 text-slate-700">
                                            <div className="font-medium">{visit.clientName}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{visit.workDetails}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{visit.areaName}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600 text-xs">{visit.startTime}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600 text-xs">{visit.endTime}</td>
                                        <td className="px-6 py-4 font-bold text-blue-600">{visit.duration}</td>
                                        <td className="px-6 py-4 text-right">
                                            {visit.locationIn && (
                                                <a 
                                                    href={`https://www.google.com/maps?q=${visit.locationIn.lat},${visit.locationIn.lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="View Location"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}
