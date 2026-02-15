'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Link from 'next/link';
import { Menu, Plus, FileText, Trash2, Eye, Calendar, DollarSign, Edit, FileDown } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SalarySlipsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    if (isLoaded) {
        const role = user?.publicMetadata?.role;
        if (role !== 'admin' && role !== 'super-admin') {
            router.push('/'); // Redirect non-admins
        } else {
            fetchSlips();
        }
    }
  }, [isLoaded, user, router]);

  const fetchSlips = async () => {
    try {
        const res = await fetch('/api/salary');
        const data = await res.json();
        if (Array.isArray(data)) setSlips(data);
    } catch (e) {
        console.error('Error fetching slips:', e);
    } finally {
        setLoading(false);
    }
  };

  const deleteSlip = async (id) => {
      if(!confirm("Delete this salary slip?")) return;
      try {
          const res = await fetch(`/api/salary/${id}`, { method: 'DELETE' });
          if (res.ok) {
              setSlips(prev => prev.filter(s => s.id !== id));
          } else {
              alert("Failed to delete");
          }
      } catch (e) {
          console.error(e);
          alert("Error deleting slip");
      }
  };

  const handleExport = () => {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text("Salary Slips Report", 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
      if (filterEmployee) doc.text(`Employee: ${filterEmployee}`, 14, 33);
      if (filterMonth) doc.text(`Month: ${filterMonth}`, 14, filterEmployee ? 38 : 33);

      // Filter Data
      const filteredSlips = slips.filter(slip => {
          const matchesEmployee = filterEmployee ? slip.employeeName === filterEmployee : true;
          const matchesMonth = filterMonth ? slip.monthYear === filterMonth : true;
          return matchesEmployee && matchesMonth;
      });

      // Columns
      const tableColumn = ["Employee", "Month", "Basic Salary", "Pre-Advance", "Net Pay"];
      const tableRows = filteredSlips.map(slip => [
          slip.employeeName,
          slip.monthYear,
          (Number(slip.earnings?.basic) || 0).toLocaleString('en-IN'),
          ((Number(slip.netPayable) || 0) + (Number(slip.deductions?.advance) || 0)).toLocaleString('en-IN'),
          (Number(slip.netPayable) || 0).toLocaleString('en-IN')
      ]);

      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: filterEmployee || filterMonth ? 45 : 40,
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      });

      // Footer Summaries (Calculated manually to add below table)
      const totalBasic = filteredSlips.reduce((sum, s) => sum + (Number(s.earnings?.basic) || 0), 0);
      const totalPreAdvance = filteredSlips.reduce((sum, s) => sum + ((Number(s.netPayable) || 0) + (Number(s.deductions?.advance) || 0)), 0);
      const totalNet = filteredSlips.reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0);

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Basic: ${totalBasic.toLocaleString('en-IN')}`, 14, finalY);
      doc.text(`Total Pre-Advance: ${totalPreAdvance.toLocaleString('en-IN')}`, 80, finalY);
      doc.text(`Total Net Pay: ${totalNet.toLocaleString('en-IN')}`, 150, finalY);

      doc.save("Salary_Report.pdf");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
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
      
      <main className={`flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 bg-slate-50 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="max-w-6xl mx-auto pb-24">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Salary Slips
                    </h1>
                    <p className="text-slate-500 mt-1">Manage and generate employee payslips.</p>
                </div>
                
                <Link 
                    href="/salary/create" 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Create New Slip
                </Link>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium rounded-xl transition-all"
                >
                    <FileDown className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            {/* Filters */}
            {!loading && slips.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Filter by Employee</label>
                        <select 
                            value={filterEmployee} 
                            onChange={(e) => setFilterEmployee(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                            <option value="">All Employees</option>
                            {[...new Set(slips.map(s => s.employeeName))].sort().map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Filter by Month</label>
                        <select 
                            value={filterMonth} 
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                            <option value="">All Months</option>
                             {[...new Set(slips.map(s => s.monthYear))].sort((a, b) => {
                                 // Try to sort months roughly correctly if they are Month Year
                                 return new Date(a) - new Date(b); 
                             }).map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>
                    {(filterEmployee || filterMonth) && (
                        <div className="flex items-end">
                            <button 
                                onClick={() => { setFilterEmployee(''); setFilterMonth(''); }}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-[1px]"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                 <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                 </div>
            ) : slips.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-700">No Salary Slips Generated</p>
                    <p className="text-sm mt-1">Click "Create New Slip" to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Month</th>
                                    <th className="px-6 py-4">Pre-Advance</th>
                                    <th className="px-6 py-4">Net Pay</th>
                                    <th className="px-6 py-4">Basic Salary</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {slips
                                    .filter(slip => {
                                        const matchesEmployee = filterEmployee ? slip.employeeName === filterEmployee : true;
                                        const matchesMonth = filterMonth ? slip.monthYear === filterMonth : true;
                                        return matchesEmployee && matchesMonth;
                                    })
                                    .map((slip) => (
                                    <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{slip.employeeName}</div>
                                            <div className="text-xs text-slate-500">{slip.designation}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {slip.monthYear}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700 font-medium">
                                                ₹{((Number(slip.netPayable) || 0) + (Number(slip.deductions?.advance) || 0)).toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                                                ₹{slip.netPayable?.toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            ₹{Number(slip.earnings?.basic || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link 
                                                    href={`/salary/${slip.id}`}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View/Print"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link 
                                                    href={`/salary/${slip.id}/edit`}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => deleteSlip(slip.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>


        {/* Sticky Footer Summary */}
        {!loading && slips.length > 0 && (
             <div className="fixed bottom-0 left-0 right-0 md:ml-64 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm font-medium text-slate-500 hidden md:block">
                    Summary of visible slips
                </div>
                <div className="flex gap-8 text-sm w-full md:w-auto justify-between md:justify-end">
                    <div>
                        <span className="text-slate-500 mr-2 text-xs uppercase tracking-wide">Slips:</span>
                        <span className="font-bold text-slate-700">
                            {slips.filter(s => (filterEmployee ? s.employeeName === filterEmployee : true) && (filterMonth ? s.monthYear === filterMonth : true)).length}
                        </span>

                    </div>
                    <div>
                        <span className="text-slate-500 mr-2 text-xs uppercase tracking-wide">Pre-Advance Total:</span>
                        <span className="font-bold text-blue-600 text-lg">
                            ₹{slips
                                .filter(s => (filterEmployee ? s.employeeName === filterEmployee : true) && (filterMonth ? s.monthYear === filterMonth : true))
                                .reduce((sum, s) => sum + ((Number(s.netPayable) || 0) + (Number(s.deductions?.advance) || 0)), 0)
                                .toLocaleString('en-IN')
                            }
                        </span>

                    </div>
                    <div>
                        <span className="text-slate-500 mr-2 text-xs uppercase tracking-wide">Total Basic:</span>
                        <span className="font-bold text-slate-700 text-lg">
                            ₹{slips
                                .filter(s => (filterEmployee ? s.employeeName === filterEmployee : true) && (filterMonth ? s.monthYear === filterMonth : true))
                                .reduce((sum, s) => sum + (Number(s.earnings?.basic) || 0), 0)
                                .toLocaleString('en-IN')
                            }
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 mr-2 text-xs uppercase tracking-wide">Net Paid:</span>
                        <span className="font-bold text-emerald-600 text-lg">
                            ₹{slips
                                .filter(s => (filterEmployee ? s.employeeName === filterEmployee : true) && (filterMonth ? s.monthYear === filterMonth : true))
                                .reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0)
                                .toLocaleString('en-IN')
                            }
                        </span>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
