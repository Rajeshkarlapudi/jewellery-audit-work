import React from 'react';
import { ACCOUNT_PRODUCT_MAPPING_RULES } from '../backend/masterData';
import { Database, ShieldCheck, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const RateMasterView: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-8 max-w-6xl mx-auto space-y-8 transition-colors ${
      isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${
            isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
          }`}>
            CONFIGURATIONS & RULES
          </p>
          <h2 className={`text-xl font-bold tracking-tight mt-0.5 ${
            isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'
          }`}>
            Rate Master & Account Mappings
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            Authoritative reference guide for Sales Account vs Product combinations and UOM classification rules.
          </p>
        </div>

        <div className={`border px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
          isDarkMode 
            ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' 
            : 'bg-blue-50 border-blue-200 text-blue-600'
        }`}>
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Active Reference Engine</span>
        </div>
      </div>

      {/* Account vs Product Mapping Table */}
      <div className={`rounded-xl border overflow-hidden transition-colors ${
        isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-[#2D3139] bg-[#111419]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
              Sales Account vs Product Mapping Rules
            </h3>
          </div>
          <span className={`text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            {ACCOUNT_PRODUCT_MAPPING_RULES.length} Account rules loaded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase tracking-wider font-semibold text-[10px] ${
                isDarkMode 
                  ? 'bg-[#111419] border-[#2D3139] text-[#64748B]' 
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                <th className="py-3 px-6">SALES ACCOUNT</th>
                <th className="py-3 px-6">ALLOWED PRODUCTS</th>
                <th className="py-3 px-6">PATTERN MATCHING REGEX</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-[#2D3139] bg-[#16191F]' : 'divide-slate-200 bg-white'
            }`}>
              {ACCOUNT_PRODUCT_MAPPING_RULES.map((rule, idx) => (
                <tr key={idx} className={`transition-colors ${
                  isDarkMode ? 'hover:bg-[#1C2128]' : 'hover:bg-slate-50'
                }`}>
                  <td className={`py-3.5 px-6 font-semibold whitespace-nowrap ${
                    isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
                  }`}>
                    {rule.accountName}
                  </td>
                  <td className={`py-3.5 px-6 ${isDarkMode ? 'text-[#94A3B8]' : 'text-slate-600'}`}>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.allowedProducts.map((prod, pIdx) => (
                        <span
                          key={pIdx}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-medium border ${
                            isDarkMode 
                              ? 'bg-[#111419] border-[#2D3139] text-[#94A3B8]' 
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {prod}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`py-3.5 px-6 font-mono text-[11px] ${
                    isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
                  }`}>
                    {rule.allowedPatterns.join(' | ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UOM Classification Reference Card */}
      <div className={`rounded-xl border p-6 space-y-4 transition-colors ${
        isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex items-center gap-2 border-b pb-3 ${
          isDarkMode ? 'border-[#2D3139]' : 'border-slate-200'
        }`}>
          <FileText className="w-4 h-4 text-blue-500" />
          <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
            UOM Classification Reference Rules
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className={`p-4 rounded-lg border space-y-2 ${
            isDarkMode ? 'bg-[#111419] border-[#2D3139]' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-bold text-emerald-500 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              GRAMS Classification
            </h4>
            <ul className={`space-y-1.5 list-disc list-inside text-[11px] ${
              isDarkMode ? 'text-[#94A3B8]' : 'text-slate-600'
            }`}>
              <li>Ornament G14 / Ornament G18 / Ornament G22 / Ornament GJ</li>
              <li>Cust Ornament G18 / Cust Ornament G22</li>
              <li>Std Gold G24 & Articles S1</li>
              <li>Beads B1, Kundan K1, Nail N1, Dori D1, Lac L1, Wax W1</li>
              <li>Products matching Ornament G...</li>
              <li>Products containing Kundan K1 or Pearls P&lt;number&gt;</li>
            </ul>
          </div>

          <div className={`p-4 rounded-lg border space-y-2 ${
            isDarkMode ? 'bg-[#111419] border-[#2D3139]' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-bold text-blue-500 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              CARATS Classification
            </h4>
            <ul className={`space-y-1.5 list-disc list-inside text-[11px] ${
              isDarkMode ? 'text-[#94A3B8]' : 'text-slate-600'
            }`}>
              <li>All other products by default</li>
              <li>Diamonds (Chakri C1, Cust Diamond D1, DL RA/RC...)</li>
              <li>Gemstones: Emerald EM&lt;number&gt;, Emeralds JEM</li>
              <li>Gemstones: Ruby RU&lt;number&gt;, Loose Ruby</li>
              <li>Stones: Cust Stone S1, Synth S100/S300</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

