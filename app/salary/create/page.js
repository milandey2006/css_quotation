'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Printer, RefreshCw, Plus, Trash2 } from 'lucide-react';

// Number to Words Conversion
function numberToWords(num) {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    function convertLessThanThousand(n) {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    }
    
    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertLessThanThousand(num % 1000) : '');
    if (num < 10000000) return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
    return convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
}

export default function CreateSalarySlip() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [fixedBasic, setFixedBasic] = useState(0);
  const [currentAdvanceBalance, setCurrentAdvanceBalance] = useState(0);
  const [advanceRows, setAdvanceRows] = useState([{ id: 1, month: '', amount: 0 }]); // Dynamic advance deductions

  useEffect(() => {
    fetch('/api/employees')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setEmployees(data);
        })
        .catch(err => console.error('Failed to load employees', err));
  }, []);

  const handleEmployeeSelect = (e) => {
      const empId = e.target.value;
      const emp = employees.find(emp => emp.id.toString() === empId);
      if (emp) {
          const empBasic = emp.basicSalary || 0;
          setFixedBasic(empBasic);
          setCurrentAdvanceBalance(emp.advanceBalance || 0);
          
          setData(prev => ({
              ...prev,
              employeeName: emp.name,
              employeeId: emp.employeeCode || emp.id.toString(), // Use custom code or fallback to ID
              dateOfJoining: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : '',
              designation: emp.designation || '',
              panNo: emp.panNo || '',
              aadhaarNo: emp.aadhaarNo || '',
              uanNo: emp.uanNo || '',
              earnings: {
                  ...prev.earnings,
                  basic: empBasic // Initialize with full basic
              }
          }));
      }
  };

  // Initial State
  const [data, setData] = useState({
      employeeName: '',
      employeeId: '',
      designation: '',
      monthYear: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      dateOfJoining: '',
      
      // Document numbers
      panNo: '',
      aadhaarNo: '',
      uanNo: '',
      utrNo: '', // Payment reference
      
      workDays: 30, // Default typical month
      paidDays: 30,
      holidays: 0, 
      lopDays: 0, // Loss of Pay

      earnings: {
          basic: 0,
          hra: 0, // House Rent Allowance
          conveyance: 0,
          special: 0, // Catch-all for "Fixed Allowance" replacement if needed or generic
          bonus: 0,
      },

      deductions: {
          epf: 0, // Employee Provident Fund
          pt: 0, // Professional Tax
          advance: 0, // Advance Salary (Requested Provision)
          leaveDeduction: 0, // New field for calculated leave deduction
          tds: 0,
      }
  });

  // Auto-calculate Basic Salary and Paid Days
  useEffect(() => {
      // Logic: Paid Days = Total Work Days - Leaves (stored in holidays)
      const totalDays = data.workDays > 0 ? data.workDays : 30;
      const leaves = data.holidays || 0; 
      const calculatedPaidDays = Math.max(0, totalDays - leaves);

      // Only update if paidDays is different
      if (data.paidDays !== calculatedPaidDays) {
          setData(prev => ({ ...prev, paidDays: calculatedPaidDays }));
      }
      
      // Calculate Salary & Deductions
      if (fixedBasic > 0 && totalDays > 0) {
          // New Requirement: Basic stays full. Leaves are a deduction.
          const leaveDeductionAmount = Math.round((fixedBasic / totalDays) * leaves);

          setData(prev => ({
              ...prev,
              paidDays: calculatedPaidDays,
              earnings: {
                  ...prev.earnings,
                  basic: fixedBasic // Always full basic
              },
              deductions: {
                  ...prev.deductions,
                  leaveDeduction: leaveDeductionAmount // Add explicit deduction
              }
          }));
      }
  }, [data.workDays, data.holidays, fixedBasic]);

  // Sync Advance Rows to Total Advance Deduction
  useEffect(() => {
      const totalAdvance = advanceRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      if (totalAdvance !== data.deductions.advance) {
          setData(prev => ({
              ...prev,
              deductions: {
                  ...prev.deductions,
                  advance: totalAdvance
              }
          }));
      }
  }, [advanceRows]);

  const handleAdvanceChange = (id, field, value) => {
      setAdvanceRows(prev => prev.map(row => 
          row.id === id ? { ...row, [field]: field === 'amount' ? Number(value) : value } : row
      ));
  };

  const addAdvanceRow = () => {
      setAdvanceRows(prev => [...prev, { id: Date.now(), month: '', amount: 0 }]);
  };

  const removeAdvanceRow = (id) => {
      setAdvanceRows(prev => prev.filter(row => row.id !== id));
  };

  // Derived Totals
  const totalEarnings = Object.values(data.earnings).reduce((a, b) => a + Number(b), 0);
  const totalDeductions = Object.values(data.deductions).reduce((a, b) => a + Number(b), 0);
  const netPay = totalEarnings - totalDeductions;

  const handleChange = (section, field, value) => {
      if (section === 'root') {
          setData(prev => ({ ...prev, [field]: value }));
      } else {
          setData(prev => ({
              ...prev,
              [section]: { ...prev[section], [field]: Number(value) }
          }));
      }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const payload = {
            ...data,
            earnings: data.earnings,
            deductions: {
                ...data.deductions,
                advanceBreakdown: advanceRows.filter(r => r.amount > 0)
            },
            basicSalary: data.earnings.basic,
            advanceSalary: data.deductions.advance,
            totalEarnings,
            totalDeductions,
            netPayable: netPay,
            openingAdvanceBalance: currentAdvanceBalance,
        };

        const res = await fetch('/api/salary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            router.push('/salary');
        } else {
            alert('Failed to save');
        }
    } catch (e) {
        console.error(e);
        alert('Error saving');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row print:block">
        {/* Editor Sidebar */}
        <div className="w-full md:w-[450px] bg-white border-r border-slate-200 flex-shrink-0 h-screen overflow-y-auto print:hidden shadow-xl z-10 block">
            <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10 flex justify-between items-center">
                 <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
                    <ChevronLeft className="w-4 h-4" /> Back
                 </button>
                 <h2 className="font-bold text-slate-800">Generate Payslip</h2>
            </div>
            
            <div className="p-6 space-y-8">
                {/* Employee Details */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employee Summary</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Select Employee</label>
                            <select 
                                onChange={handleEmployeeSelect}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 mb-2"
                            >
                                <option value="">-- Select Employee --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <Input label="Employee Name" value={data.employeeName} onChange={v => handleChange('root', 'employeeName', v)} />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Designation" value={data.designation} onChange={v => handleChange('root', 'designation', v)} />
                            <Input label="Emp ID" value={data.employeeId} onChange={v => handleChange('root', 'employeeId', v)} />
                        </div>
                         <Input label="Month & Year" value={data.monthYear} onChange={v => handleChange('root', 'monthYear', v)} placeholder="March 2024" />
                         <Input label="Date of Joining" type="date" value={data.dateOfJoining} onChange={v => handleChange('root', 'dateOfJoining', v)} />
                    </div>
                </section>

                {/* Document Details */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Details</h3>
                    <div className="space-y-3">
                        <Input label="PAN Card No" value={data.panNo} onChange={v => handleChange('root', 'panNo', v)} placeholder="ABCDE1234F" />
                        <Input label="Aadhaar Card No" value={data.aadhaarNo} onChange={v => handleChange('root', 'aadhaarNo', v)} placeholder="1234 5678 9012" />
                        <Input label="UAN No" value={data.uanNo} onChange={v => handleChange('root', 'uanNo', v)} placeholder="123456789012" />
                        <Input label="UTR/Payment Ref No" value={data.utrNo} onChange={v => handleChange('root', 'utrNo', v)} placeholder="Transaction reference" />
                    </div>
                </section>

                {/* Attendance */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance</h3>
                    <div className="grid grid-cols-3 gap-3">
                         <Input label="Total Working Days" type="number" value={data.workDays} onChange={v => handleChange('root', 'workDays', v)} />
                         <Input label="Leaves" type="number" value={data.holidays} onChange={v => handleChange('root', 'holidays', v)} />
                         <div className="bg-slate-50 p-2 rounded border border-slate-200">
                             <label className="block text-xs font-medium text-slate-400 mb-1">Paid Days (Auto)</label>
                             <div className="font-bold text-slate-700 text-sm mt-2">{data.paidDays}</div>
                         </div>
                    </div>
                </section>

                {/* Earnings */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 inline-block px-2 py-1 rounded">Earnings (+ ₹{totalEarnings})</h3>
                    <div className="space-y-3">
                        <CurrencyInput label="Basic Salary" value={data.earnings.basic} onChange={v => handleChange('earnings', 'basic', v)} />
                        {/* Removed Fixed, HRA, Child Edu as requested, kept Conveyance & logic implies we can rename headers in preview if needed but fields are flexible */}
                         <CurrencyInput label="Conveyance Allowance" value={data.earnings.conveyance} onChange={v => handleChange('earnings', 'conveyance', v)} />
                         <CurrencyInput label="Special / Other Allowance" value={data.earnings.special} onChange={v => handleChange('earnings', 'special', v)} />
                         <CurrencyInput label="Bonus / Overtime" value={data.earnings.bonus} onChange={v => handleChange('earnings', 'bonus', v)} />
                    </div>
                </section>

                {/* Deductions */}
                <section className="space-y-4">
                     <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50 inline-block px-2 py-1 rounded">Deductions (- ₹{totalDeductions})</h3>
                    <div className="space-y-3">
                        {/* <CurrencyInput label="EPF Contribution" value={data.deductions.epf} onChange={v => handleChange('deductions', 'epf', v)} /> */}
                        <CurrencyInput label="Professional Tax" value={data.deductions.pt} onChange={v => handleChange('deductions', 'pt', v)} />
                        <CurrencyInput label="Professional Tax" value={data.deductions.pt} onChange={v => handleChange('deductions', 'pt', v)} />
                        
                        {/* Advance Salary Dynamic Section */}
                        <div className="bg-red-50 p-3 rounded-lg -mx-2 border border-red-100">
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-red-700">Advance Salary Deductions</label>
                             </div>
                             
                             {/* Dynamic Advance Balance Display */}
                             <div className="mb-3 bg-white border border-red-200 rounded p-2 text-xs flex justify-between items-center shadow-sm">
                                <div className="text-slate-500 flex items-center gap-2">
                                    <span>Total:</span>
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                        <input 
                                            type="number" 
                                            value={currentAdvanceBalance}
                                            onChange={(e) => setCurrentAdvanceBalance(Number(e.target.value))}
                                            className="w-full pl-5 pr-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                                        />
                                    </div>
                                </div>
                                <div className="text-red-700 font-bold flex items-center gap-1">
                                    <span>Remaining:</span>
                                    <span className="text-sm">₹{Math.max(0, currentAdvanceBalance - data.deductions.advance)}</span>
                                </div>
                             </div>

                             {/* Button moved up as requested - sort of, putting it between label and list creates a flow */}
                             
                             <div className="space-y-2 mb-2">
                                {advanceRows.map((row, index) => (
                                    <div key={row.id} className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            placeholder="Month (e.g. Feb)" 
                                            className="flex-1 px-2 py-1.5 text-xs border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-red-800 placeholder:text-red-300"
                                            value={row.month}
                                            onChange={(e) => handleAdvanceChange(row.id, 'month', e.target.value)}
                                        />
                                        <div className="relative w-24">
                                            <input 
                                                type="number" 
                                                placeholder="Amt"
                                                className="w-full px-2 py-1.5 text-xs border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-red-800 font-mono text-right"
                                                value={row.amount || ''}
                                                onChange={(e) => handleAdvanceChange(row.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                        {advanceRows.length > 1 && (
                                            <button onClick={() => removeAdvanceRow(row.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                             </div>
                             
                             <button 
                                onClick={addAdvanceRow}
                                className="w-full py-2 flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors shadow-sm"
                             >
                                <Plus className="w-3 h-3" /> Add Advance Salary for Month
                             </button>
                        </div>
                    </div>
                </section>
                
                {/* Actions */}
                <div className="pt-8 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={() => window.print()}
                        className="flex-1 py-3 border border-slate-300 rounded-xl font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Slip
                    </button>
                </div>
            </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 bg-slate-200 p-8 flex justify-center items-start overflow-y-auto print:absolute print:inset-0 print:p-0 print:m-0 print:bg-white print:h-screen print:w-screen print:overflow-visible print:z-50">
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-8 print:shadow-none print:w-full print:h-full print:p-6 text-black">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-slate-100">
                    <div className="text-sm space-y-1 text-black">
                         <h1 className="text-2xl font-bold text-black">Champion Security System</h1>
                         <p>Office No- 21A, Gr Floor, New Apollo Estate</p>
                         <p>Mogra Lane, Andheri East, Mumbai, Maharashtra 400069</p>
                         <p>Trademark No- 5290052</p>
                         <p>https://championsecuritysystem.com/</p>
                         <p>GSTIN: 27AHXPD7350C1Z8</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Payslip For</p>
                        <h2 className="text-xl font-bold text-black">{data.monthYear}</h2>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="flex gap-8 mb-6">
                     <div className="flex-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Employee Summary</h3>
                        <div className="space-y-1 text-sm text-black">
                            <div className="flex">
                                <span className="w-32 font-medium">Name</span>
                                <span className="font-bold">: {data.employeeName}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Designation</span>
                                <span className="font-bold">: {data.designation}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Emp ID</span>
                                <span className="font-bold">: {data.employeeId}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Joining Date</span>
                                <span className="font-bold">: {data.dateOfJoining}</span>
                            </div>
                        </div>
                     </div>

                     <div className="w-64 bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-center">
                         <h3 className="text-2xl font-bold text-emerald-700">₹{netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                         <p className="text-xs text-emerald-600 font-medium">Net Payable Salary</p>
                         
                         <div className="mt-2 pt-2 border-t border-emerald-200 grid grid-cols-2 gap-1 text-xs text-emerald-800">
                             <div>Total Days: <span className="font-bold">{data.workDays}</span></div>
                             <div>Leaves: <span className="font-bold">{data.holidays}</span></div>
                             <div>Paid Days: <span className="font-bold">{data.paidDays}</span></div>
                         </div>
                     </div>
                </div>

                {/* Document Details Row */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-xs text-black border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">PAN:</span>
                        <span className="font-mono font-bold">{maskDocument(data.panNo) || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">UAN:</span>
                        <span className="font-mono font-bold">{data.uanNo || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Aadhaar:</span>
                        <span className="font-mono font-bold">{maskDocument(data.aadhaarNo) || '-'}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                     <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                         <div className="p-3 border-r border-slate-200">Earnings</div>
                         <div className="p-3 bg-slate-50">Deductions</div>
                     </div>
                     
                     <div className="grid grid-cols-2 text-sm">
                         {/* Earnings Column */}
                         <div className="border-r border-slate-200 p-0">
                             <TableRow label="Basic Salary" value={data.earnings.basic} />
                             <TableRow label="Conveyance Allowance" value={data.earnings.conveyance} />
                             <TableRow label="Special Allowance" value={data.earnings.special} />
                             <TableRow label="Bonus / Overtime" value={data.earnings.bonus} />
                             <div className="p-2">&nbsp;</div>
                         </div>
                         
                         {/* Deductions Column */}
                         <div className="p-0 bg-slate-50/10">
                             {/* <TableRow label="EPF Contribution" value={data.deductions.epf} /> */}
                             <TableRow label="Professional Tax" value={data.deductions.pt} />
                             {data.deductions.leaveDeduction > 0 && (
                                <TableRow label={`Leaves (${data.holidays} days)`} value={data.deductions.leaveDeduction} highlight />
                             )}
                              {advanceRows.filter(r => r.amount > 0).map(row => (
                                  <TableRow key={row.id} label={`Advance Salary (${row.month || 'Deduction'})`} value={row.amount} highlight />
                              ))}
                              {advanceRows.filter(r => r.amount > 0).length === 0 && data.deductions.advance > 0 && <TableRow label="Advance Salary" value={data.deductions.advance} highlight />}
                             <div className="p-2">&nbsp;</div>
                         </div>
                     </div>

                     {/* Total Row */}
                     <div className="grid grid-cols-2 border-t border-slate-200 bg-slate-100 font-bold text-black border-b border-slate-200">
                          <div className="p-3 border-r border-slate-200 flex justify-between">
                              <span>Gross Earnings</span>
                              <span>₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 flex justify-between text-red-700">
                              <span>Total Deductions</span>
                              <span>₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                     </div>
                </div>

                {/* Net Payable Section */}
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 mb-6 border border-emerald-200">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-base font-bold text-black">Total Net Payable</h3>
                        <p className="text-xl font-bold text-emerald-700">₹{netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="border-t border-emerald-200 pt-2">
                        <p className="text-xs text-slate-600 mb-1">Amount in Words:</p>
                        <p className="font-serif text-black font-semibold text-sm">
                            {netPay > 0 ? `Rupees ${numberToWords(Math.floor(netPay))} Only` : 'Zero Rupees'}
                        </p>
                    </div>
                     {data.utrNo && (
                        <div className="mt-2 pt-2 border-t border-emerald-200">
                            <p className="text-xs text-slate-600">Payment Reference (UTR): <span className="font-mono font-bold text-black">{data.utrNo}</span></p>
                        </div>
                    )}
                    
                    {currentAdvanceBalance > 0 && (
                        <div className="mt-2 pt-2 border-t border-emerald-200 text-xs text-red-700 flex justify-between items-center">
                            <span>Outstanding Advance Balance:</span>
                            <span className="font-bold font-mono">₹{(currentAdvanceBalance - data.deductions.advance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
                    <p className="font-semibold text-black mb-1">This is a computer generated document, no signature required.</p>
                    <p>This slip is only for record purposes and the employee should not use this for any other purpose.</p>
                </div>

            </div>
        </div>
    </div>
  );
}

// Helper Components
const Input = ({ label, onChange, ...props }) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
            onChange={(e) => onChange && onChange(e.target.value)}
            {...props} 
        />
    </div>
);

const CurrencyInput = ({ label, active, onChange, ...props }) => (
     <div className={active ? "bg-red-50 p-2 rounded-lg -mx-2" : ""}>
        <label className={`block text-xs font-medium mb-1 ${active ? 'text-red-700' : 'text-slate-500'}`}>{label}</label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
            <input 
                type="number"
                className={`w-full pl-6 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all font-mono ${active ? 'bg-white border-red-200 focus:ring-red-500 text-red-700' : 'bg-slate-50 border-slate-200 focus:ring-blue-500 text-slate-700'}`} 
                onChange={(e) => onChange && onChange(e.target.value)}
                {...props} 
            />
        </div>
    </div>
);

const TableRow = ({ label, value, highlight }) => (
    <div className={`flex justify-between p-3 border-b border-slate-100 last:border-0 ${highlight ? 'bg-red-50/50' : ''}`}>
        <span className={highlight ? 'text-red-700 font-medium' : 'text-black'}>{label}</span>
        <span className="font-mono text-black font-semibold">
            {Number(value) > 0 ? `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
        </span>
    </div>
);

const maskDocument = (doc) => {
    if (!doc || doc.length <= 4) return doc;
    return '*'.repeat(doc.length - 4) + doc.slice(-4);
};
