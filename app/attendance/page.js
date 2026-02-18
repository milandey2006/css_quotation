'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, MapPin, RefreshCw, Calendar, Search, Trash2, FileDown, FileText } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AttendancePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter(); // Need to import useRouter
  const isSuperAdmin = user?.publicMetadata?.role === 'super-admin';

  useEffect(() => {
    if (isLoaded) {
        if (user?.publicMetadata?.role !== 'super-admin') {
            router.push('/');
        }
    }
  }, [isLoaded, user, router]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [processedRows, setProcessedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // Report State
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportEmployeeName, setReportEmployeeName] = useState('');

  // Remarks State
  const [remarks, setRemarks] = useState({});
  const [editingRemark, setEditingRemark] = useState(null); // { employeeId, date, currentRemark }
  const [newRemarkText, setNewRemarkText] = useState('');

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [punchRes, remarkRes] = await Promise.all([
          fetch('/api/punch'),
          fetch('/api/attendance/remarks')
        ]);

        if (punchRes.ok) {
          const data = await punchRes.json();
          setAttendanceData(data);
        }
        
        if (remarkRes.ok) {
           const rData = await remarkRes.json();
           // Map remarks by "employeeId-dateString"
           const rMap = {};
           if (Array.isArray(rData)) {
               rData.forEach(r => {
                   rMap[`${r.employeeId}-${r.date}`] = r.remark;
               });
           }
           setRemarks(rMap);
        }

      } catch (error) {
        console.error("Failed to load data", error);
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
        status,
        mapLink: group.locations.length > 0 ? `https://www.google.com/maps?q=${group.locations[0].lat},${group.locations[0].lng}` : '#',
        remark: remarks[group.id] || ''
      };
    });

    // Sort by Date (newest first)
    rows.sort((a, b) => b.rawDate - a.rawDate);

    setProcessedRows(rows);
  }, [attendanceData, remarks]);

  // Filtering
  const filteredRows = processedRows.filter(row => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (
        row.employeeId.toLowerCase().includes(q) ||
        row.clientName.toLowerCase().includes(q) ||
        (row.areaName && row.areaName.toLowerCase().includes(q)) ||
        row.workDetails.toLowerCase().includes(q)
    );
    
    // Simple date string match for now:
    const matchesDate = filterDate ? (() => {
       const selectedDate = new Date(filterDate).toLocaleDateString();
       return row.date === selectedDate;
    })() : true;

    return matchesSearch && matchesDate;
  });


  // Preview State
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreviewReport = () => {
      console.log("preview button clicked");
      if (!reportStartDate || !reportEndDate) {
          alert("Please select both Start Date and End Date for the report.");
          return;
      }

      try {
          const start = new Date(reportStartDate);
          const end = new Date(reportEndDate);
          start.setHours(0,0,0,0);
          end.setHours(23,59,59,999);

          if (start > end) {
              alert("Start Date cannot be after End Date.");
              return;
          }

          console.log(`Filtering from ${start} to ${end}`);
          
          // Filter rows for report
          const reportRows = processedRows.filter(row => {
              const rowDate = new Date(row.rawDate); // Ensure it is a date
              const inDateRange = rowDate >= start && rowDate <= end;
              
              const nameMatch = reportEmployeeName 
                ? row.employeeId.toLowerCase().includes(reportEmployeeName.toLowerCase()) 
                : true;

              return inDateRange && nameMatch;
          });

          if (reportRows.length === 0) {
              alert("No records found for the selected criteria.");
              return;
          }

          setPreviewData(reportRows);
          setShowPreview(true);

      } catch (err) {
          console.error("Preview Error:", err);
          alert("An error occurred while generating the preview.");
      }
  };

  const generatePDF = () => {
       try {
          // Generate PDF
          const doc = new jsPDF();
          console.log("PDF Document created");
          
          // Title
          doc.setFontSize(18);
          doc.text("Attendance Report", 14, 20);
          
          doc.setFontSize(10);
          doc.text(`Period: ${reportStartDate} to ${reportEndDate}`, 14, 28);
          if (reportEmployeeName) {
              doc.text(`Employee: ${reportEmployeeName}`, 14, 33);
          }
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, reportEmployeeName ? 38 : 33);
          

          // Columns - Added Remarks
          const tableColumn = ["Date", "Employee", "Client", "Work Details", "In", "Out", "Duration", "Remark"];
          const tableRows = previewData.map(row => [
              row.date,
              row.employeeId,
              row.clientName,
              `${row.areaName ? `[${row.areaName}] ` : ''}${row.workDetails}`,
              row.startTime,
              row.endTime,
              row.hours,
              row.remark || ''
          ]);

          autoTable(doc, {
              head: [tableColumn],
              body: tableRows,
              startY: reportEmployeeName ? 45 : 40,
              styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
              headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
              columnStyles: {
                  0: { cellWidth: 20 }, // Date
                  1: { cellWidth: 25 }, // Employee
                  2: { cellWidth: 30 }, // Client
                  3: { cellWidth: 'auto' }, // Work Details (Expanded)
                  4: { cellWidth: 15 }, // In
                  5: { cellWidth: 15 }, // Out
                  6: { cellWidth: 20 }, // Duration
                  6: { cellWidth: 20 }, // Duration
                  7: { cellWidth: 'auto' }, // Remark
              },
          });

          const fileNameData = reportEmployeeName ? `_${reportEmployeeName.replace(/\s+/g, '_')}` : '';
          doc.save(`Attendance_Report${fileNameData}_${reportStartDate}_to_${reportEndDate}.pdf`);
          console.log("PDF saved");
      } catch (err) {
          console.error("Export Error:", err);
          alert("An error occurred while exporting the report.");
      }
  };


  const handleSaveRemark = async () => {
      if (!editingRemark) return;
      try {
          const res = await fetch('/api/attendance/remarks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  employeeId: editingRemark.employeeId,
                  date: editingRemark.date,
                  remark: newRemarkText
              })
          });

          if (res.ok) {
              const savedRemark = await res.json();
              setRemarks(prev => ({
                  ...prev,
                  [editingRemark.id]: savedRemark.remark
              }));
              setEditingRemark(null);
              setNewRemarkText('');
          } else {
              alert('Failed to save remark');
          }
      } catch (e) {
          console.error(e);
          alert('Error saving remark');
      }
  };

  const handleDelete = async (row) => {
      if (!confirm(`Are you sure you want to delete attendance for ${row.employeeId} on ${row.date}?`)) return;

      // Delete all punches for this row
      try {
          // Identify IDs to delete
          const punchIds = row.punches.map(p => p.id);
          
          const results = await Promise.all(punchIds.map(id => 
              fetch(`/api/punch/${id}`, { method: 'DELETE' })
          ));

          const allSuccess = results.every(res => res.ok);

          if (!allSuccess) {
              throw new Error("One or more punches failed to delete.");
          }

          // Refresh locally
          setAttendanceData(prev => prev.filter(p => !punchIds.includes(p.id)));
          alert('Record deleted successfully');

      } catch (e) {
          console.error(e);
          alert('Failed to delete records');
      }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative">
       {/* Mobile Menu Button - Consistent Header Style */}
       <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm h-16">
          <div className="font-bold text-slate-800">Champion Security</div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
             <Menu className="w-6 h-6" />
          </button>
      </div>

      <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={`flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 bg-slate-50 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header & Report Tools */}
          <div className="flex flex-col gap-6">
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
                  Refresh
                </button>
            </div>

            {/* Report Generator Section */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col md:flex-row items-end md:items-center gap-4">
                 <div className="flex-1 w-full md:w-auto">
                    <label className="block text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">Report Start Date</label>
                    <input 
                        type="date" 
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                 </div>
                 <div className="flex-1 w-full md:w-auto">
                    <label className="block text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">Report End Date</label>
                    <input 
                        type="date" 
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                 </div>
                 <div className="flex-1 w-full md:w-auto">
                    <label className="block text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">Employee (Optional)</label>
                    <input 
                        type="text" 
                        placeholder="Search Name..."
                        value={reportEmployeeName}
                        onChange={(e) => setReportEmployeeName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                 </div>
                 <button 
                    onClick={handlePreviewReport}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition-all shadow-blue-200"
                 >
                    <FileDown className="w-4 h-4" />
                    View Report
                 </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 shadow-sm">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by Employee, Client, or Area..." 
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
                    <th className="px-6 py-4">Work Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">In Time</th>
                    <th className="px-6 py-4">Out Time</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Remark</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="px-6 py-4 text-slate-600">{row.date}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{row.employeeId}</td>
                        <td className="px-6 py-4 text-slate-600">{row.clientName}</td>

                        <td className="px-6 py-4 text-slate-600 max-w-md" title={row.workDetails}>
                            {row.areaName && <span className="font-semibold text-slate-500 block text-xs mb-1">[{row.areaName}]</span>}
                            {row.workDetails}
                        </td>
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
                        <td className="px-6 py-4 text-slate-500 text-xs italic max-w-[150px] truncate" title={row.remark}>
                            {row.remark}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <a 
                            href={row.mapLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="View on Map"
                          >
                            <MapPin className="w-4 h-4" />
                          </a>
                          
                          {isSuperAdmin && (
                            <>
                              <button
                                onClick={() => {
                                    setEditingRemark({ id: row.id, employeeId: row.employeeId, date: row.date });
                                    setNewRemarkText(row.remark || '');
                                }}
                                className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                                title="Add/Edit Remark"
                              >
                                  <FileText className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {isSuperAdmin && (
                              <button 
                                onClick={() => handleDelete(row)}
                                className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center text-slate-400">
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Report Preview</h2>
                        <p className="text-sm text-slate-500">
                            {previewData.length} records found from {new Date(reportStartDate).toLocaleDateString()} to {new Date(reportEndDate).toLocaleDateString()}
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowPreview(false)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <Trash2 className="w-6 h-6 rotate-45" /> {/* Using Trash2 as Close icon roughly */}
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    <table className="w-full text-sm text-left border border-slate-200 rounded-lg">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Employee</th>
                                <th className="px-4 py-2">Client</th>
                                <th className="px-4 py-2">Work Details</th>
                                <th className="px-4 py-2">Time</th>
                                <th className="px-4 py-2">Duration</th>
                                <th className="px-4 py-2">Remark</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {previewData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 text-slate-600">{row.date}</td>
                                    <td className="px-4 py-2 font-medium text-slate-900">{row.employeeId}</td>
                                    <td className="px-4 py-2 text-slate-600">{row.clientName}</td>
                                    <td className="px-4 py-2 text-slate-600">
                                        {row.areaName && `[${row.areaName}] `}{row.workDetails}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">
                                        {row.startTime} - {row.endTime}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">
                                        {row.hours}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 text-xs italic">
                                        {row.remark}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    <button 
                        onClick={() => setShowPreview(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={generatePDF}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition-all shadow-blue-200"
                    >
                        <FileDown className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Remark Modal */}
      {editingRemark && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Add Remark</h3>
                  <p className="text-sm text-slate-500 mb-4">
                      Adding remark for <strong>{editingRemark.employeeId}</strong> on {editingRemark.date}
                  </p>
                  
                  <textarea
                      className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 text-slate-700"
                      placeholder="Enter remark here..."
                      value={newRemarkText}
                      onChange={(e) => setNewRemarkText(e.target.value)}
                  ></textarea>
                  
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setEditingRemark(null)}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleSaveRemark}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md shadow-blue-200"
                      >
                          Save Remark
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
