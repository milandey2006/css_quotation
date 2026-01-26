'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Printer, Edit } from 'lucide-react';
import Link from 'next/link';

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

export default function ViewSalarySlip() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetch(`/api/salary/${id}`)
                .then(res => res.json())
                .then(fetchedData => {
                    if (fetchedData.error) {
                        alert(fetchedData.error);
                        router.push('/salary');
                    } else {
                        setData(fetchedData);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [id, router]);

    if (loading) return <div className="flex justify-center p-12">Loading...</div>;
    if (!data) return <div className="flex justify-center p-12">Salary slip not found</div>;

    const netPay = data.netPayable || 0;
    const totalEarnings = data.totalEarnings || 0;
    const totalDeductions = data.totalDeductions || 0;

    return (
        <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
            <div className="max-w-[210mm] mx-auto print:mx-0 print:w-full">
                {/* Actions Header - Hidden in Print */}
                <div className="mb-6 flex justify-between items-center print:hidden">
                    <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
                        <ChevronLeft className="w-4 h-4" /> Back to List
                    </button>
                    <div className="flex gap-3">
                         <Link 
                            href={`/salary/${id}/edit`} 
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 flex items-center gap-2 font-medium"
                        >
                            <Edit className="w-4 h-4" /> Edit
                        </Link>
                        <button 
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-500/30"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                </div>

                {/* Slip Content */}
                <div className="bg-white shadow-2xl p-8 print:shadow-none print:p-6 text-black min-h-[297mm]">
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
                                    <span className="font-bold">: {data.dateOfJoining ? new Date(data.dateOfJoining).toLocaleDateString() : ''}</span>
                                </div>
                            </div>
                         </div>
    
                         <div className="w-64 bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-center">
                             <h3 className="text-2xl font-bold text-emerald-700">₹{netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                             <p className="text-xs text-emerald-600 font-medium">Net Payable Salary</p>
                             
                             <div className="mt-2 pt-2 border-t border-emerald-200 grid grid-cols-2 gap-1 text-xs text-emerald-800">
                                 <div>Total Days: <span className="font-bold">{data.workDays}</span></div>
                                 <div className={data.holidays ? "text-red-700 font-bold" : ""}>Leaves: <span className="font-bold">{data.holidays}</span></div>
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
                                 <TableRow label="Basic Salary" value={data.earnings?.basic} />
                                 <TableRow label="Conveyance Allowance" value={data.earnings?.conveyance} />
                                 <TableRow label="Special Allowance" value={data.earnings?.special} />
                                 <TableRow label="Bonus / Overtime" value={data.earnings?.bonus} />
                                 <div className="p-2">&nbsp;</div>
                             </div>
                             
                             {/* Deductions Column */}
                             <div className="p-0 bg-slate-50/10">
                                 {/* <TableRow label="EPF Contribution" value={data.deductions?.epf} /> */}
                                 <TableRow label="Professional Tax" value={data.deductions?.pt} />
                                 {data.deductions?.leaveDeduction > 0 && (
                                    <TableRow label={`Leaves (${data.holidays} days)`} value={data.deductions.leaveDeduction} highlight />
                                 )}
                                 <TableRow label="Advance Salary" value={data.deductions?.advance} highlight />
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
