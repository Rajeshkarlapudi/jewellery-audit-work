import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Receipt,
  UserCheck,
  Scale,
  FileCheck2,
  ShoppingCart,
  Percent,
  Banknote,
  Building2,
  FileSpreadsheet,
  Sliders,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [scrutinyOpen, setScrutinyOpen] = useState(true);
  const { isDarkMode } = useTheme();

  return (
    <aside className={`w-64 flex flex-col h-screen border-r shrink-0 select-none transition-colors ${
      isDarkMode 
        ? 'bg-[#16191F] text-[#E2E8F0] border-[#2D3139]' 
        : 'bg-white text-slate-800 border-slate-200'
    }`}>
      {/* Brand Header */}
      <div className={`p-6 flex items-center gap-3 border-b ${
        isDarkMode ? 'border-[#2D3139]' : 'border-slate-200'
      }`}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-600/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className={`font-bold text-base tracking-tight ${
            isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
          }`}>
            HAA <span className="text-blue-500">AUDIT</span>
          </span>
          <p className={`text-[10px] font-semibold tracking-wider uppercase mt-0.5 ${
            isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
          }`}>
            ENTERPRISE SUITE
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 text-xs">
        <div className={`text-[10px] uppercase tracking-widest px-3 mb-1 ${
          isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
        }`}>
          Core Modules
        </div>

        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors cursor-pointer ${
            activeTab === 'dashboard'
              ? isDarkMode ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-50 text-blue-600 font-semibold'
              : isDarkMode ? 'text-[#94A3B8] hover:bg-[#1C2128] hover:text-[#E2E8F0]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        {/* Scrutiny Section */}
        <div className="space-y-1">
          <button
            onClick={() => setScrutinyOpen(!scrutinyOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              isDarkMode ? 'text-[#94A3B8] hover:bg-[#1C2128] hover:text-[#E2E8F0]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <span className={`font-semibold ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>Scrutiny</span>
            </div>
            {scrutinyOpen ? (
              <ChevronDown className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`} />
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`} />
            )}
          </button>

          {scrutinyOpen && (
            <div className={`ml-4 pl-2 border-l mt-1 space-y-0.5 ${
              isDarkMode ? 'border-[#2D3139]' : 'border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('sales')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-left cursor-pointer ${
                  activeTab === 'sales'
                    ? isDarkMode ? 'bg-blue-600/10 text-blue-400 font-medium' : 'bg-blue-50 text-blue-600 font-semibold'
                    : isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Sales</span>
              </button>

              <button
                onClick={() => setActiveTab('id_proof')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-left cursor-pointer ${
                  activeTab === 'id_proof'
                    ? isDarkMode ? 'bg-blue-600/10 text-blue-400 font-medium' : 'bg-blue-50 text-blue-600 font-semibold'
                    : isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>ID Proof Audit</span>
              </button>

              <button
                onClick={() => setActiveTab('cross_weight')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-left cursor-pointer ${
                  activeTab === 'cross_weight'
                    ? isDarkMode ? 'bg-blue-600/10 text-blue-400 font-medium' : 'bg-blue-50 text-blue-600 font-semibold'
                    : isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Cross Weight Audit</span>
              </button>

              <button
                onClick={() => setActiveTab('rate_ledger')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-left cursor-pointer ${
                  activeTab === 'rate_ledger'
                    ? isDarkMode 
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500 pl-2.5' 
                      : 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 pl-2.5'
                    : isDarkMode 
                      ? 'text-[#E2E8F0] hover:text-white hover:bg-[#1C2128]' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Rate & Ledger Audit</span>
              </button>

              <button
                onClick={() => setActiveTab('sales_return')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-left cursor-pointer ${
                  activeTab === 'sales_return'
                    ? isDarkMode ? 'bg-blue-600/10 text-blue-400 font-medium' : 'bg-blue-50 text-blue-600 font-semibold'
                    : isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Sales Return Audit</span>
              </button>
            </div>
          )}
        </div>

        {/* Other Sections */}
        <button
          onClick={() => setActiveTab('purchase')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
            isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Purchase</span>
        </button>

        <button
          onClick={() => setActiveTab('tds_audit')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
            isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>TDS Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('cash')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
            isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Cash</span>
        </button>

        <button
          onClick={() => setActiveTab('negative_bank')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
            isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Negative Bank</span>
        </button>

        <button
          onClick={() => setActiveTab('section_44ab')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
            isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Section 44AB</span>
        </button>

        <div className={`pt-3 mt-3 border-t ${
          isDarkMode ? 'border-[#2D3139]' : 'border-slate-200'
        }`}>
          <p className={`px-3 text-[10px] font-semibold uppercase tracking-wider mb-2 ${
            isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
          }`}>
            Configurations
          </p>
          <button
            onClick={() => setActiveTab('gold_silver_rates')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'gold_silver_rates'
                ? isDarkMode ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-50 text-blue-600 font-semibold'
                : isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4 text-blue-500" />
            <span>Gold & Silver Rates</span>
          </button>

          <button
            onClick={() => setActiveTab('rate_master')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'rate_master'
                ? isDarkMode ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-50 text-blue-600 font-semibold'
                : isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Rate Master</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

