'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Link from 'next/link';
import { Menu, Plus, Users, Trash2, Edit, Save, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function EmployeesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
      name: '',
      designation: '',
      mobile: '',
      email: '',
      address: '',
      panNo: '',
      aadhaarNo: '',
      uanNo: '',
      bankAccountNo: '',
      ifscCode: '',
      joinDate: '',
      basicSalary: 0,
      advanceBalance: 0
  });

  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
        const role = user?.publicMetadata?.role;
        if (role !== 'admin') {
            router.push('/');
        } else {
            fetchEmployees();
        }
    }
  }, [isLoaded, user, router]);

  const fetchEmployees = async () => {
    try {
        const res = await fetch('/api/employees');
        const data = await res.json();
        if (Array.isArray(data)) setEmployees(data);
    } catch (e) {
        console.error('Error fetching employees:', e);
    } finally {
        setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const url = editingId ? `/api/employees/${editingId}` : '/api/employees';
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (res.ok) {
            fetchEmployees();
            setView('list');
            resetForm();
        } else {
            alert('Failed to save employee');
        }
    } catch (error) {
        console.error(error);
        alert('Error saving employee');
    }
  };

  const handleEdit = (emp) => {
      setEditingId(emp.id);
      setFormData({
          name: emp.name || '',
          designation: emp.designation || '',
          mobile: emp.mobile || '',
          email: emp.email || '',
          address: emp.address || '',
          panNo: emp.panNo || '',
          aadhaarNo: emp.aadhaarNo || '',
          uanNo: emp.uanNo || '',
          bankAccountNo: emp.bankAccountNo || '',
          ifscCode: emp.ifscCode || '',
          joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : '', // Format for date input
          basicSalary: emp.basicSalary || 0,
          advanceBalance: emp.advanceBalance || 0
      });
      setView('form');
  };

  const handleDelete = async (id) => {
      if (!confirm('Are you sure you want to delete this employee?')) return;
      
      try {
          const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
          if (res.ok) {
              fetchEmployees();
          } else {
              alert('Failed to delete');
          }
      } catch (error) {
          console.error(error);
          alert('Error deleting');
      }
  };

  const resetForm = () => {
      setEditingId(null);
      setFormData({  name: '', designation: '', mobile: '', email: '', address: '', panNo: '', aadhaarNo: '', uanNo: '', bankAccountNo: '', ifscCode: '', joinDate: '', basicSalary: 0, advanceBalance: 0 });
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
        <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-8 h-8 text-blue-600" />
                        Employees
                    </h1>
                    <p className="text-slate-500 mt-1">Manage employee records.</p>
                </div>
                
                {view === 'list' && (
                    <button 
                        onClick={() => { resetForm(); setView('form'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Employee
                    </button>
                )}
            </div>

            {view === 'list' ? (
                loading ? (
                     <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                     </div>
                ) : employees.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                        <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-700">No Employees Found</p>
                        <p className="text-sm mt-1">Click "Add Employee" to create one.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Designation</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Join Date</th>
                                        <th className="px-6 py-4">Adv. Balance</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{emp.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{emp.designation}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="text-xs">{emp.mobile}</div>
                                                <div className="text-xs text-slate-400">{emp.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-red-600">
                                                ₹{(emp.advanceBalance || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleEdit(emp)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(emp.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                )
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">New Employee Details</h2>
                        <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="name" label="Full Name" value={formData.name} onChange={handleInputChange} required />
                            <Input name="designation" label="Designation" value={formData.designation} onChange={handleInputChange} />
                            <Input name="mobile" label="Mobile Number" value={formData.mobile} onChange={handleInputChange} />
                            <Input name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} />
                            <Input name="joinDate" label="Join Date" type="date" value={formData.joinDate} onChange={handleInputChange} />
                            <Input name="basicSalary" label="Basic Salary" type="number" value={formData.basicSalary} onChange={handleInputChange} />
                            <Input name="advanceBalance" label="Advance Balance" type="number" value={formData.advanceBalance} onChange={handleInputChange} />
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input name="panNo" label="PAN No" value={formData.panNo} onChange={handleInputChange} />
                                <Input name="aadhaarNo" label="Aadhaar No" value={formData.aadhaarNo} onChange={handleInputChange} />
                                <Input name="uanNo" label="UAN No (PF)" value={formData.uanNo} onChange={handleInputChange} />
                                <Input name="bankAccountNo" label="Bank Account No" value={formData.bankAccountNo} onChange={handleInputChange} />
                                <Input name="ifscCode" label="IFSC Code" value={formData.ifscCode} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Address</h3>
                            <textarea 
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                                rows={3}
                                placeholder="Full Address"
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setView('list')}
                                className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Employee
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

const Input = ({ label, onChange, ...props }) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
            onChange={onChange}
            {...props} 
        />
    </div>
);
