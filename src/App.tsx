import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RateLedgerAudit } from './components/RateLedgerAudit';
import { GoldSilverRatesConfig } from './components/GoldSilverRatesConfig';
import { RateMasterView } from './components/RateMasterView';
import { DashboardOverview } from './components/DashboardOverview';
import { Construction } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('rate_ledger');
  const { isDarkMode } = useTheme();

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'rate_ledger': return 'Rate and Ledger Audit';
      case 'gold_silver_rates': return 'Gold & Silver Rates Configuration';
      case 'rate_master': return 'Rate Master & Mappings';
      case 'sales': return 'Sales Audit';
      case 'id_proof': return 'ID Proof Audit';
      case 'cross_weight': return 'Cross Weight Audit';
      case 'sales_return': return 'Sales Return Audit';
      case 'purchase': return 'Purchase Audit';
      case 'tds_audit': return 'TDS Audit';
      case 'cash': return 'Cash Scrutiny';
      case 'negative_bank': return 'Negative Bank Audit';
      case 'section_44ab': return 'Section 44AB Tax Audit';
      default: return 'Rate and Ledger Audit';
    }
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors ${
      isDarkMode ? 'bg-[#0F1115] text-[#E2E8F0]' : 'bg-slate-100 text-slate-800'
    }`}>
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-colors ${
        isDarkMode ? 'bg-[#0F1115]' : 'bg-slate-100'
      }`}>
        {/* Top Header */}
        <Header title={getPageTitle(activeTab)} />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'rate_ledger' && (
            <RateLedgerAudit onNavigateToRates={() => setActiveTab('gold_silver_rates')} />
          )}

          {activeTab === 'gold_silver_rates' && (
            <GoldSilverRatesConfig onBackToAudit={() => setActiveTab('rate_ledger')} />
          )}

          {activeTab === 'rate_master' && (
            <RateMasterView />
          )}

          {activeTab === 'dashboard' && (
            <DashboardOverview onStartAudit={() => setActiveTab('rate_ledger')} />
          )}

          {!['rate_ledger', 'gold_silver_rates', 'rate_master', 'dashboard'].includes(activeTab) && (
            <div className={`p-12 text-center max-w-lg mx-auto space-y-4 my-12 border rounded-2xl shadow-xl transition-colors ${
              isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20">
                <Construction className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
                {getPageTitle(activeTab)} Module
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
                This audit section is currently configured in standard view mode. The primary focus of this assessment suite is the <strong className={isDarkMode ? 'text-[#94A3B8]' : 'text-slate-700'}>Rate & Ledger Audit</strong> workflow.
              </p>
              <button
                onClick={() => setActiveTab('rate_ledger')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Go to Rate & Ledger Audit →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

