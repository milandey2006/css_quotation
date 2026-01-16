"use client";
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export const DashboardCharts = ({ quotations }) => {
  // --- Data Processing for Charts ---
  
  // 1. Monthly Data Aggregation
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

  const monthlyData = months.map((month, index) => {
      // Filter quotes for this month and current year
      const monthlyQuotes = quotations.filter(q => {
          const d = new Date(q.date);
          return d.getMonth() === index && d.getFullYear() === currentYear;
      });
      
      const value = monthlyQuotes.reduce((acc, q) => acc + (q.totalAmount || 0), 0);
      return { name: month, value };
  });

  // 2. Status Distribution
  const activeCount = quotations.filter(q => !['Converted', 'Lost'].includes(q.status)).length; // Treat anything not converted/lost as active/pending
  const convertedCount = quotations.filter(q => q.status === 'Converted').length;
  const lostCount = quotations.filter(q => q.status === 'Lost').length;
  
  const pieData = [
    { name: 'Active', value: activeCount },
    { name: 'Converted', value: convertedCount },
    { name: 'Lost', value: lostCount },
  ].filter(d => d.value > 0); // Only show segments with data? Or keep 0s. distinct segments look better if 0s are filtered or handled. Recharts handles 0s fine usually.

  // Ensure at least some dummy data if empty to avoid broken chart look? 
  // User wants "real data", so showing empty is "real".
  const finalPieData = pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1 }];
  const pieColors = pieData.length > 0 ? ['#3b82f6', '#10b981', '#ef4444'] : ['#e2e8f0'];

  const COLORS = ['#3b82f6', '#10b981', '#ef4444']; 

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Main Bar Chart - "Result" / Performance */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-slate-800">Monthly Performance ({currentYear})</h3>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{fill: '#94a3b8', fontSize: 12}} 
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Value']}
              />
               <Bar dataKey="value" fill="#1e293b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart / Donut - Distribution */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
         <h3 className="text-lg font-bold text-slate-800 self-start mb-4">Status Overview</h3>
         <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={finalPieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {finalPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{quotations.length}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Total</span>
            </div>
         </div>
         
         <div className="w-full mt-6 space-y-3">
             {finalPieData.map((entry, index) => (
                 <div key={entry.name} className="flex justify-between items-center text-sm">
                     <span className="flex items-center gap-2 text-slate-600">
                         <span className="w-3 h-3 rounded-full" style={{backgroundColor: pieColors[index % pieColors.length]}}></span>
                         {entry.name}
                     </span>
                     <span className="font-bold text-slate-800">{entry.value}</span>
                 </div>
             ))}
         </div>
      </div>

      {/* Area Chart - Bottom wide one */}
      <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-slate-800">Sales Trend</h3>
        </div>
        <div className="h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                     <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Value']} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBlue)" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
