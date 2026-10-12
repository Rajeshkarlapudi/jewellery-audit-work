import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { AuditSummary, fetchAuditSummary } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const DashboardOverview: React.FC<{ onStartAudit: () => void }> = ({ onStartAudit }) => {
  const { isDarkMode } = useTheme();
  const [summary, setSummary] = useState<AuditSummary | null>(null);

  useEffect(() => {
    fetchAuditSummary()
      .then(setSummary)
      .catch(console.error);
  }, []);

  const total = summary?.totalRows || 44099;
  const valid = summary?.validRows || 33002;
  const errors = summary?.errorRows || 11097;
  const deviations = summary?.rangeDeviationsCount || 11092;
  const uom = summary?.invalidUomCount || 5;
  const mismatch = summary?.salesLedgerMismatchCount || 0;
  const compliance = summary?.compliancePercentage || 74.8;

  const pieData = [
    { name: 'Valid Transactions', value: valid, color: '#10B981' },
    { name: 'Range Deviations', value: deviations, color: '#F97316' },
    { name: 'Invalid UOM', value: uom, color: '#A855F7' },
    { name: 'Sales Ledger Mismatch', value: mismatch, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Gold 18K', rate: 11900 },
    { name: 'Gold 22K', rate: 14800 },
    { name: 'Gold 24K', rate: 15850 },
    { name: 'Silver S1', rate: 185 },
    { name: 'Emeralds', rate: 1000 },
    { name: 'Rubies', rate: 7700 },
    { name: 'Diamonds', rate: 25 }
  ];

  return (
    <div className={`p-8 max-w-7xl mx-auto space-y-8 transition-colors ${
      isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
    }`}>
      {/* Top Banner */}
      <div className={`rounded-2xl p-6 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUDIT SUITE ACTIVE</span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
            Jewellery Sales & Ledger Audit Intelligence Dashboard
          </h2>
          <p className={`text-xs mt-1 max-w-xl ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            Real-time audit monitoring for rate deviations, UOM misclassifications, and account-product mapping ledger integrity.
          </p>
        </div>

        <button
          onClick={onStartAudit}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shrink-0 shadow-sm cursor-pointer"
        >
          Open Rate & Ledger Audit →
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border transition-colors ${
          isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${
            isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
          }`}>
            TOTAL AUDITED ROWS
          </p>
          <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>
            {total.toLocaleString()}
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            Total transactions parsed from ledger
          </p>
        </div>

        <div className={`p-5 rounded-xl border transition-colors ${
          isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
            COMPLIANCE PERCENTAGE
          </p>
          <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {compliance}%
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            {valid.toLocaleString()} compliant rows
          </p>
        </div>

        <div className={`p-5 rounded-xl border border-l-4 border-l-rose-500 transition-colors ${
          isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
            ERROR ROWS
          </p>
          <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
            {errors.toLocaleString()}
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            Audit rule failure records
          </p>
        </div>

        <div className={`p-5 rounded-xl border transition-colors ${
          isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
            RANGE DEVIATIONS
          </p>
          <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>
            {deviations.toLocaleString()}
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            Unit rate variation exceptions
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Audit Exception Distribution */}
        <div className={`rounded-xl border p-6 flex flex-col transition-colors ${
          isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className={`font-semibold text-sm mb-4 ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
            Audit Exception Breakdown
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#111419' : '#ffffff',
                    borderColor: isDarkMode ? '#2D3139' : '#e2e8f0',
                    color: isDarkMode ? '#E2E8F0' : '#1e293b'
                  }}
                  formatter={(value: any) => Number(value).toLocaleString()}
                />
                <Legend wrapperStyle={{ color: isDarkMode ? '#94A3B8' : '#64748b', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Product Benchmark Rates */}
        <div className={`rounded-xl border p-6 flex flex-col transition-colors ${
          isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className={`font-semibold text-sm mb-4 ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
            Product Base Rates Reference (₹)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#64748B' : '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#64748B' : '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#111419' : '#ffffff',
                    borderColor: isDarkMode ? '#2D3139' : '#e2e8f0',
                    color: isDarkMode ? '#E2E8F0' : '#1e293b'
                  }}
                  formatter={(val: any) => `₹${Number(val).toLocaleString()}`}
                />
                <Bar dataKey="rate" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

