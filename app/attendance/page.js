'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, MapPin, RefreshCw, Calendar, Search } from 'lucide-react';

export default function AttendancePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [processedRows, setProcessedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/punch');
        if (response.ok) {
          const data = await response.json();
          setAttendanceData(data);
        }
      } catch (error) {
        console.error("Failed to load attendance", error);
      }
    };
    loadData();
    // Refresh every 30s to see new punches in real-time-ish
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Process Data: Group by (Person + Date)
  useEffect(() => {
    if (!attendanceData.length) {
      setProcessedRows([]);
      return;
    }

    const groups = {};

    attendanceData.forEach(record => {
      const dateStr = new Date(record.timestamp).toLocaleDateString();
      const key = `${record.employeeId}-${dateStr}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          date: dateStr,
          rawDate: new Date(record.timestamp), // for sorting
          employeeId: record.employeeId,
          clientName: record.clientName || '-', // Capture from record
          areaName: record.areaName || '-',     // Capture from record
          workDetails: record.workDetails || '-', // Capture from record
          punches: [],
          firstIn: null,
          lastOut: null,
          locations: []
        };
      }
      
      groups[key].punches.push(record);
      if (record.location) {
        groups[key].locations.push(record.location);
      }
    });

    // Analyze each group to find First IN, Last OUT
    const rows = Object.values(groups).map(group => {
      // Sort punches by time
      group.punches.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const firstInPunch = group.punches.find(p => p.type === 'in');
      const lastOutPunch = [...group.punches].reverse().find(p => p.type === 'out');

      let hours = '0h 0m';
      let status = 'Absent';

      if (firstInPunch) {
        status = 'Working';
        if (lastOutPunch && new Date(lastOutPunch.timestamp) > new Date(firstInPunch.timestamp)) {
           status = 'Completed';
           const diff = new Date(lastOutPunch.timestamp) - new Date(firstInPunch.timestamp);
           const h = Math.floor(diff / (1000 * 60 * 60));
           const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
           hours = `${h}h ${m}m`;
        }
      }

      return {
        ...group,
        startTime: firstInPunch ? new Date(firstInPunch.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-',
        endTime: lastOutPunch ? new Date(lastOutPunch.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-',
        hours,
        status,
        mapLink: group.locations.length > 0 ? `https://www.google.com/maps?q=${group.locations[0].lat},${group.locations[0].lng}` : '#'
      };
    });

    // Sort by Date (newest first)
    rows.sort((a, b) => b.rawDate - a.rawDate);

    setProcessedRows(rows);
  }, [attendanceData]);

  // Filtering
  const filteredRows = processedRows.filter(row => {
    const matchesSearch = row.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Convert row.date (e.g., "1/20/2026") to YYYY-MM-DD for comparison if needed
    // But row.date format depends on locale. Let's compare loosely or use rawDate
    // Simple date string match for now:
    const matchesDate = filterDate ? (() => {
       const selectedDate = new Date(filterDate).toLocaleDateString();
       return row.date === selectedDate;
    })() : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="flex h-screen bg-slate-50">
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
        <Sidebar activePage="Attendance" />
      </div>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Attendance Log</h1>
              <p className="text-slate-500 text-sm">Track employee check-ins, locations, and working hours.</p>
            </div>
            
            <button 
              onClick={() => {
                fetch('/api/punch')
                  .then(res => res.json())
                  .then(data => setAttendanceData(data))
                  .catch(err => console.error(err));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 shadow-sm">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by Employee Name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <button 
                    onClick={() => { setSearchTerm(''); setFilterDate(''); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2"
                >
                    Clear Filters
                </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Area</th>
                    <th className="px-6 py-4">Work Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">In Time</th>
                    <th className="px-6 py-4">Out Time</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4 text-right">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="px-6 py-4 text-slate-600">{row.date}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{row.employeeId}</td>
                        <td className="px-6 py-4 text-slate-600">{row.clientName}</td>
                        <td className="px-6 py-4 text-slate-600">{row.areaName}</td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={row.workDetails}>{row.workDetails}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            row.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            row.status === 'Working' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{row.startTime}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{row.endTime}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{row.hours}</td>
                        <td className="px-6 py-4 text-right">
                          <a 
                            href={row.mapLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="View on Map"
                          >
                            <MapPin className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                        No attendance records found. Use the Punch App to add entries.
                      </td>
                    </tr>
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
