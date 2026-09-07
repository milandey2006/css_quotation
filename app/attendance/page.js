'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, MapPin, RefreshCw, Calendar, Search, Trash2, FileDown, FileText, Plus, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

export default function AttendancePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter(); // Need to import useRouter
  const role = user?.publicMetadata?.role;
  const isSuperAdmin = role === 'super-admin';
  const isAdmin = role === 'admin' || role === 'super-admin';

  useEffect(() => {
    if (isLoaded) {
        // Attendance is for office staff: both admin and super-admin can view it
        // and add manual entries; only super-admin can delete / edit remarks.
        if (role !== 'super-admin' && role !== 'admin') {
            router.push('/');
        }
    }
  }, [isLoaded, role, router]);

  // Employees — for the name→code map on the report and the manual-entry dropdown.
  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.ok ? res.json() : [])
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // name → employeeCode lookup (punches store the employee's name as employeeId).
  const empCodeByName = React.useMemo(() => {
    const map = {};
    employees.forEach(e => { if (e.name) map[e.name.toLowerCase()] = e.employeeCode || ''; });
    return map;
  }, [employees]);

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
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, row: null });

  // Manual attendance entry (admin / super-admin)
  const [manualOpen, setManualOpen] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const emptyManual = {
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    inTime: '10:00',
    outTime: '18:30',
    clientName: 'Office',
    workDetails: '',
    remark: '',
  };
  const [manualForm, setManualForm] = useState(emptyManual);

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
  // Only "Office" punches belong here -- client-site check-ins (from the Work List
  // "Punch in from Worklist" flow) live on the separate Site Visits page, so they're
  // excluded to stop the two attendance types from mixing in one table.
  useEffect(() => {
    const officeOnly = attendanceData.filter(record => (record.clientName || '').toLowerCase() === 'office');

    if (!officeOnly.length) {
      setProcessedRows([]);
      return;
    }

    const groups = {};

    officeOnly.forEach(record => {
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
      let isLate = false;

      if (firstInPunch) {
        status = 'Working';
        const inTime = new Date(firstInPunch.timestamp);
        isLate = (inTime.getHours() * 60 + inTime.getMinutes()) > (10 * 60 + 20); // after 10:20 AM (10:00 + grace period)
        if (lastOutPunch && new Date(lastOutPunch.timestamp) > new Date(firstInPunch.timestamp)) {
           status = 'Completed';
           const diff = new Date(lastOutPunch.timestamp) - new Date(firstInPunch.timestamp);
           const h = Math.floor(diff / (1000 * 60 * 60));
           const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
           hours = `${h}h ${m}m`;
        }
      }

      const inLoc = firstInPunch?.location;
      const outLoc = lastOutPunch?.location;

      return {
        ...group,
        startTime: firstInPunch ? new Date(firstInPunch.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-',
        endTime: lastOutPunch ? new Date(lastOutPunch.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-',
        hours,
        status,
        isLate,
        inMapLink: inLoc ? `https://www.google.com/maps?q=${inLoc.lat},${inLoc.lng}` : null,
        outMapLink: outLoc ? `https://www.google.com/maps?q=${outLoc.lat},${outLoc.lng}` : null,
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
      if (!reportStartDate || !reportEndDate) {
          toast.warning("Please select both Start Date and End Date for the report.");
          return;
      }

      try {
          const start = new Date(reportStartDate);
          const end = new Date(reportEndDate);
          start.setHours(0,0,0,0);
          end.setHours(23,59,59,999);

          if (start > end) {
              toast.error("Start Date cannot be after End Date.");
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
              toast.info("No records found for the selected criteria.");
              return;
          }

          setPreviewData(reportRows);
          setShowPreview(true);

      } catch (err) {
          console.error("Preview Error:", err);
          toast.error("An error occurred while generating the preview.");
      }
  };

  // Summarise a set of report rows: total hours worked, days present, Sundays
  // (which count as paid leave and are excluded from leave totals), and the
  // remaining working-day leaves within the selected date range.
  const computeReportSummary = (rows) => {
      let totalMinutes = 0;
      rows.forEach(r => {
          const m = /(\d+)\s*h\s*(\d+)\s*m/.exec(r.hours || '');
          if (m) totalMinutes += parseInt(m[1]) * 60 + parseInt(m[2]);
      });
      const totalHours = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

      const employeeIds = new Set(rows.map(r => r.employeeId));
      const singleEmployee = employeeIds.size <= 1;
      const presentDays = new Set(rows.map(r => r.date)).size;
      const lateDays = rows.filter(r => r.isLate).length;

      let sundays = 0, workingDays = 0, totalDays = 0;
      if (reportStartDate && reportEndDate) {
          const start = new Date(reportStartDate); start.setHours(0, 0, 0, 0);
          const end = new Date(reportEndDate); end.setHours(0, 0, 0, 0);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              totalDays++;
              if (d.getDay() === 0) sundays++;   // Sunday = paid leave
              else workingDays++;
          }
      }
      const leaves = Math.max(0, workingDays - presentDays);

      return { totalHours, presentDays, sundays, workingDays, leaves, totalDays, singleEmployee, lateDays };
  };

  // Save a manual attendance entry: writes an IN punch (and an OUT punch when an
  // out-time is given) with explicit timestamps, so a forgotten/missed punch can
  // be recorded by an admin. clientName defaults to "Office" so it shows here.
  const handleSaveManual = async () => {
    if (isSavingManual) return;
    if (!manualForm.employeeName) { toast.warning('Please select an employee'); return; }
    if (!manualForm.date || !manualForm.inTime) { toast.warning('Date and In time are required'); return; }
    if (manualForm.outTime && manualForm.outTime <= manualForm.inTime) {
      toast.error('Out time must be after In time'); return;
    }
    setIsSavingManual(true);
    try {
      const mkTs = (t) => new Date(`${manualForm.date}T${t}:00`).toISOString();
      const base = {
        employeeId: manualForm.employeeName, // punches key employees by name
        clientName: manualForm.clientName || 'Office',
        areaName: '',
        workDetails: manualForm.workDetails || 'Manual entry by admin',
      };

      const reqs = [
        fetch('/api/punch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...base, type: 'in', timestamp: mkTs(manualForm.inTime) }),
        }),
      ];
      if (manualForm.outTime) {
        reqs.push(fetch('/api/punch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...base, type: 'out', timestamp: mkTs(manualForm.outTime) }),
        }));
      }

      const results = await Promise.all(reqs);
      if (!results.every(r => r.ok)) throw new Error('One or more punches failed');

      // Optional remark for the day.
      if (manualForm.remark.trim()) {
        const dateStr = new Date(`${manualForm.date}T00:00:00`).toLocaleDateString();
        await fetch('/api/attendance/remarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: manualForm.employeeName, date: dateStr, remark: manualForm.remark.trim() }),
        }).catch(() => {});
      }

      toast.success('Manual attendance added');
      setManualOpen(false);
      setManualForm(emptyManual);
      // Refresh the list.
      fetch('/api/punch').then(res => res.json()).then(data => setAttendanceData(data)).catch(() => {});
    } catch (e) {
      console.error(e);
      toast.error('Failed to add manual attendance');
    } finally {
      setIsSavingManual(false);
    }
  };

  // Load a same-origin image as a data URL so jsPDF can embed it without
  // tainting the canvas. Returns null on any failure (PDF still generates).
  const loadImageDataUrl = (src) =>
      new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
              try {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  canvas.getContext('2d').drawImage(img, 0, 0);
                  resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
              } catch {
                  resolve(null);
              }
          };
          img.onerror = () => resolve(null);
          img.src = src;
      });

  const generatePDF = async () => {
       try {
          // Generate PDF
          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.getWidth();

          // --- Company letterhead ---------------------------------------
          const logo = await loadImageDataUrl('/company-logo.png');
          if (logo?.dataUrl) {
              const logoH = 16;
              const logoW = logo.h ? (logo.w / logo.h) * logoH : 16;
              doc.addImage(logo.dataUrl, 'PNG', 14, 12, logoW, logoH);
          }
          const textX = 34; // leave room for the logo on the left
          doc.setFontSize(16);
          doc.setTextColor(30, 58, 138); // blue-900
          doc.setFont(undefined, 'bold');
          doc.text('Champion Security System', textX, 18);
          doc.setFontSize(8);
          doc.setTextColor(60);
          doc.setFont(undefined, 'normal');
          doc.text('CCTV . Intruder Alarm . Access Controls . Multi Apt. VDP', textX, 23);
          doc.text('Office-21 A Gr Floor, New Apollo Estate, Old Nagardas Road, Andheri East, Mumbai 400069', textX, 27);
          doc.text('admin@championsecuritysystem.com', textX, 31);

          // Divider under the letterhead
          doc.setDrawColor(200);
          doc.line(14, 35, pageWidth - 14, 35);

          // Report title + meta
          doc.setTextColor(0);
          doc.setFont(undefined, 'bold');
          doc.setFontSize(13);
          doc.text('Attendance Report', 14, 43);

          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          doc.text(`Period: ${reportStartDate} to ${reportEndDate}`, 14, 49);
          if (reportEmployeeName) {
              doc.text(`Employee: ${reportEmployeeName}`, 14, 54);
          }
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 49, { align: 'right' });

          const tableStartY = reportEmployeeName ? 59 : 54;

          // Columns - Added Remarks + Status (Late marker)
          const tableColumn = ["Date", "Employee", "Client", "Work Details", "In", "Out", "Duration", "Status", "Remark"];
          const tableRows = previewData.map(row => {
              const code = empCodeByName[(row.employeeId || '').toLowerCase()];
              return [
              row.date,
              code ? `${row.employeeId}\n${code}` : row.employeeId,
              row.clientName,
              `${row.areaName ? `[${row.areaName}] ` : ''}${row.workDetails}`,
              row.startTime,
              row.endTime,
              row.hours,
              row.isLate ? 'Late' : '',
              row.remark || ''
          ];
          });

          autoTable(doc, {
              head: [tableColumn],
              body: tableRows,
              startY: tableStartY,
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
                  7: { cellWidth: 16 }, // Status
                  8: { cellWidth: 'auto' }, // Remark
              },
              didParseCell: (data) => {
                  if (data.section === 'body' && data.column.index === 7 && data.cell.raw === 'Late') {
                      data.cell.styles.textColor = [220, 38, 38];
                      data.cell.styles.fontStyle = 'bold';
                  }
              },
          });

          // Summary block (last row) -- totals for the report period
          const s = computeReportSummary(previewData);
          const afterTableY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 45;
          autoTable(doc, {
              startY: afterTableY + 8,
              head: [["Days Present", "Total Hours", "Sundays (Paid Leave)", "Leaves (excl. Sundays)", "Late Days"]],
              body: [[s.presentDays, s.totalHours, s.sundays, s.leaves, s.lateDays]],
              styles: { fontSize: 10, cellPadding: 3, halign: 'center' },
              headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 9 },
              bodyStyles: { fontStyle: 'bold', fontSize: 12 },
              theme: 'grid',
          });
          if (!s.singleEmployee) {
              const noteY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || afterTableY + 30;
              doc.setFontSize(8);
              doc.setTextColor(120);
              doc.text("Note: report covers multiple employees; select one employee for accurate per-person leave counts.", 14, noteY + 6);
              doc.setTextColor(0);
          }

          // Footer on every page: brand line + "not for official use" disclaimer.
          const pageHeight = doc.internal.pageSize.getHeight();
          const totalPages = doc.internal.getNumberOfPages();
          for (let p = 1; p <= totalPages; p++) {
              doc.setPage(p);
              doc.setDrawColor(220);
              doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
              doc.setFontSize(7.5);
              doc.setTextColor(150);
              doc.setFont(undefined, 'italic');
              doc.text('This is a system-generated attendance report — NOT FOR OFFICIAL USE.', 14, pageHeight - 9);
              doc.setFont(undefined, 'normal');
              doc.text('Champion Security System', pageWidth - 14, pageHeight - 9, { align: 'right' });
              doc.setTextColor(0);
          }

          const fileNameData = reportEmployeeName ? `_${reportEmployeeName.replace(/\s+/g, '_')}` : '';
          doc.save(`Attendance_Report${fileNameData}_${reportStartDate}_to_${reportEndDate}.pdf`);
          toast.success("PDF saved successfully");
      } catch (err) {
          console.error("Export Error:", err);
          toast.error("An error occurred while exporting the report.");
      }
  };


  const handleSaveRemark = async () => {
      if (!editingRemark || isSaving) return;
      setIsSaving(true);
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
              toast.success('Remark saved');
              setEditingRemark(null);
              setNewRemarkText('');
          } else {
              toast.error('Failed to save remark');
          }
      } catch (e) {
          console.error(e);
          toast.error('Error saving remark');
      } finally {
          setIsSaving(false);
      }
  };

  const handleDelete = async (row) => {
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
          toast.success('Record deleted successfully');

      } catch (e) {
          console.error(e);
          toast.error('Failed to delete records');
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

      <main className={`flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header & Report Tools */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900">Attendance Log</h1>
                  <p className="text-slate-500 text-sm">Track employee check-ins, locations, and working hours.</p>
               </div>
               <div className="flex items-center gap-2">
                 {isAdmin && (
                   <button
                     onClick={() => { setManualForm(emptyManual); setManualOpen(true); }}
                     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md shadow-blue-500/30"
                   >
                     <Plus className="w-4 h-4" />
                     Manual Entry
                   </button>
                 )}
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
            </div>

            {/* Report Generator Section */}
            <div className="bg-white/80 backdrop-blur-md border border-white/60 p-4 rounded-2xl shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-end md:items-center gap-4">
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
          <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden">
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              row.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              row.status === 'Working' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {row.status}
                            </span>
                            {row.isLate && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                                Late
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{row.startTime}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{row.endTime}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{row.hours}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs italic max-w-[150px] truncate" title={row.remark}>
                            {row.remark}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {row.inMapLink ? (
                            <a
                              href={row.inMapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors"
                              title="Punch-in location"
                            >
                              <MapPin className="w-3 h-3" />
                              In
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-300 border border-slate-100 rounded-full cursor-not-allowed" title="No punch-in location">
                              <MapPin className="w-3 h-3" />
                              In
                            </span>
                          )}
                          {row.outMapLink ? (
                            <a
                              href={row.outMapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full transition-colors"
                              title="Punch-out location"
                            >
                              <MapPin className="w-3 h-3" />
                              Out
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-300 border border-slate-100 rounded-full cursor-not-allowed" title="No punch-out location">
                              <MapPin className="w-3 h-3" />
                              Out
                            </span>
                          )}
                          
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
                                onClick={() => setConfirmModal({ isOpen: true, row })}
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
                                <th className="px-4 py-2">Status</th>
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
                                    <td className="px-4 py-2 text-xs">
                                        {row.isLate && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                                Late
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 text-xs italic">
                                        {row.remark}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary (last row) */}
                    {(() => {
                        const s = computeReportSummary(previewData);
                        return (
                            <div className="mt-6 border-t-2 border-slate-300 pt-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                                    Summary{!s.singleEmployee && ' (all employees)'}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Days Present</p>
                                        <p className="text-xl font-bold text-slate-800">{s.presentDays}</p>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Total Hours</p>
                                        <p className="text-xl font-bold text-slate-800">{s.totalHours}</p>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Sundays (Paid)</p>
                                        <p className="text-xl font-bold text-slate-800">{s.sundays}</p>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Leaves (excl. Sun)</p>
                                        <p className="text-xl font-bold text-slate-800">{s.leaves}</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Late Days</p>
                                        <p className="text-xl font-bold text-slate-800">{s.lateDays}</p>
                                    </div>
                                </div>
                                {!s.singleEmployee && (
                                    <p className="text-xs text-slate-400 mt-2 italic">
                                        Tip: select a single employee for accurate per-person leave counts.
                                    </p>
                                )}
                            </div>
                        );
                    })()}
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

      {/* Manual Attendance Entry Modal */}
      {manualOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manual Attendance Entry</h3>
                <p className="text-xs text-slate-500">Record a missed / forgotten punch for an employee.</p>
              </div>
              <button onClick={() => setManualOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee *</label>
                <select
                  value={manualForm.employeeName}
                  onChange={(e) => setManualForm(f => ({ ...f, employeeName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select employee…</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name}{emp.employeeCode ? ` (${emp.employeeCode})` : ''}{emp.status === 'inactive' ? ' — Inactive' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">In Time *</label>
                  <input
                    type="time"
                    value={manualForm.inTime}
                    onChange={(e) => setManualForm(f => ({ ...f, inTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Out Time <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="time"
                    value={manualForm.outTime}
                    onChange={(e) => setManualForm(f => ({ ...f, outTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Client</label>
                <input
                  type="text"
                  value={manualForm.clientName}
                  onChange={(e) => setManualForm(f => ({ ...f, clientName: e.target.value }))}
                  placeholder="Office"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Keep &quot;Office&quot; for regular office attendance.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Work Details / Remark <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  rows={2}
                  value={manualForm.remark}
                  onChange={(e) => setManualForm(f => ({ ...f, remark: e.target.value, workDetails: e.target.value }))}
                  placeholder="e.g. Forgot to punch, added manually"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setManualOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManual}
                disabled={isSavingManual}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-70"
              >
                {isSavingManual && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save Entry
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
                          disabled={isSaving}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/30 disabled:opacity-70 flex items-center gap-2"
                      >
                          {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          Save Remark
                      </button>
                  </div>
              </div>
          </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, row: null })}
        onConfirm={() => {
            if (confirmModal.row) handleDelete(confirmModal.row);
        }}
        title="Delete Attendance Record"
        message={`Are you sure you want to delete attendance for ${confirmModal.row?.employeeId} on ${confirmModal.row?.date}?`}
      />

    </div>
  );
}
