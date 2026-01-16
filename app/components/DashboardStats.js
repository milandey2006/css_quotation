"use client";
import React from 'react';
import { ArrowUpRight, ArrowDownRight, IndianRupee, FileText, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, trend, color }) => {
  const colorStyles = {
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    green: "bg-emerald-500",
    purple: "bg-purple-500"
  };

  const bgStyles = {
     blue: "from-blue-500 to-blue-600",
     orange: "from-orange-500 to-orange-600",
     green: "from-emerald-500 to-emerald-600",
     purple: "from-purple-500 to-purple-600"
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
          {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color]} text-white shadow-lg shadow-${color}-500/30`}>
           <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Decorative background blob */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5 bg-gradient-to-br ${bgStyles[color]} group-hover:scale-110 transition-transform duration-300`} />
    </div>
  );
};

export const DashboardStats = ({ quotations }) => {
  const totalQuotations = quotations.length;
  
  // Revenue logic: Only 'Converted' quotes count as revenue
  const totalRevenue = quotations
    .filter(q => q.status === 'Converted')
    .reduce((acc, q) => acc + (q.totalAmount || 0), 0);

  // Loss logic: 'Lost' quotes count as loss
  const totalLoss = quotations
    .filter(q => q.status === 'Lost')
    .reduce((acc, q) => acc + (q.totalAmount || 0), 0);

  const convertedCount = quotations.filter(q => q.status === 'Converted').length;
  const lostCount = quotations.filter(q => q.status === 'Lost').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard 
        title="Total Revenue" 
        value={`₹${totalRevenue.toLocaleString('en-IN')}`} 
        subtext="Value of converted deals"
        icon={IndianRupee}
        color="blue"
      />
      <StatCard 
        title="Total Quotations" 
        value={totalQuotations} 
        subtext="All generated quotes"
        icon={FileText}
        color="orange"
      />
       <StatCard 
        title="Converted" 
        value={convertedCount} 
        subtext="Successfully closed deals"
        icon={CheckCircle}
        color="green"
      />
      <StatCard 
        title="Total Loss" 
        value={`₹${totalLoss.toLocaleString('en-IN')}`} 
        subtext={`${lostCount} lost deals`}
        icon={ArrowDownRight} // Changed icon to represent loss/downward
        color="purple" // or red? Keeping purple for consistency or changing to red. usage of red might be too alarming, but accurate for loss. Let's stick to purple or use Red if defined.
      />
    </div>
  );
};
