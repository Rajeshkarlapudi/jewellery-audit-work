import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import { GoldSilverRateRange, fetchGoldSilverRates, saveGoldSilverRates, resetGoldSilverRates } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface GoldSilverRatesConfigProps {
  onBackToAudit: () => void;
}

export const GoldSilverRatesConfig: React.FC<GoldSilverRatesConfigProps> = ({ onBackToAudit }) => {
  const { isDarkMode } = useTheme();
  const [rates, setRates] = useState<GoldSilverRateRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await fetchGoldSilverRates();
      setRates(data);
      setLastSavedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (id: string, field: 'minRate' | 'maxRate', value: string) => {
    const num = parseFloat(value) || 0;
    setRates(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updatedMin = field === 'minRate' ? num : r.minRate;
          const updatedMax = field === 'maxRate' ? num : r.maxRate;
          return {
            ...r,
            [field]: num,
            allowedMinRate: Math.round(updatedMin * 0.85),
            allowedMaxRate: Math.round(updatedMax * 1.15)
          };
        }
        return r;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveGoldSilverRates(rates);
      setSaveSuccess(true);
      setLastSavedTime(new Date().toLocaleTimeString());
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    try {
      const defaultRates = await resetGoldSilverRates();
      setRates(defaultRates);
      setSaveSuccess(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`p-8 max-w-5xl mx-auto space-y-6 transition-colors ${
      isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
    }`}>
      {/* Back Button */}
      <button
        onClick={onBackToAudit}
        className={`inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-colors cursor-pointer ${
          isDarkMode 
            ? 'text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/20' 
            : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Audit</span>
      </button>

      {/* Header Banner */}
      <div className="flex items-start justify-between">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
          }`}>
            SCRUTINY CONFIGURATION
          </span>
          <h2 className={`text-xl font-bold tracking-tight mt-0.5 ${
            isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'
          }`}>
            Gold & Silver Rates Master
          </h2>
          <p className={`text-xs mt-1 leading-relaxed max-w-2xl ${
            isDarkMode ? 'text-[#64748B]' : 'text-slate-500'
          }`}>
            Configure min and max benchmark rates for gold and silver categories.
          </p>
        </div>

        <div className={`text-right text-[11px] ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>
          Last saved: {lastSavedTime ? `${new Date().toLocaleDateString()} - ${lastSavedTime}` : 'Not saved'}
        </div>
      </div>

      {/* Save Alert Notification */}
      {saveSuccess && (
        <div className={`flex items-center justify-between border px-4 py-3 rounded-lg text-xs font-medium ${
          isDarkMode 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Gold & Silver rates successfully saved to the active rule book.</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
            isDarkMode 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}>
            Rules Active
          </span>
        </div>
      )}

      {/* Main Table Card */}
      <div className={`rounded-xl border overflow-hidden transition-colors ${
        isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-[#2D3139] bg-[#111419]' : 'border-slate-200 bg-slate-50'
        }`}>
          <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
            Rule Book Benchmark Ranges
          </h3>
          <span className={`text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            {rates.length} Product rules configured
          </span>
        </div>

        {loading ? (
          <div className={`p-12 text-center text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>
            Loading rate rules...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b uppercase tracking-wider font-semibold text-[10px] ${
                  isDarkMode 
                    ? 'bg-[#111419] border-[#2D3139] text-[#64748B]' 
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                  <th className="py-3 px-6">PRODUCT</th>
                  <th className="py-3 px-6 text-right w-44">MIN RATE (₹)</th>
                  <th className="py-3 px-6 text-right w-44">MAX RATE (₹)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode ? 'divide-[#2D3139] bg-[#16191F]' : 'divide-slate-200 bg-white'
              }`}>
                {rates.map(rate => (
                  <tr key={rate.id} className={`transition-colors ${
                    isDarkMode ? 'hover:bg-[#1C2128]' : 'hover:bg-slate-50'
                  }`}>
                    <td className={`py-3 px-6 font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>
                      {rate.product}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <input
                        type="number"
                        value={rate.minRate}
                        onChange={e => handleRateChange(rate.id, 'minRate', e.target.value)}
                        className={`w-32 px-2.5 py-1 text-xs text-right font-mono border rounded focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-[#0F1115] border-[#2D3139] text-[#E2E8F0] focus:border-blue-500' 
                            : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
                        }`}
                      />
                    </td>
                    <td className="py-3 px-6 text-right">
                      <input
                        type="number"
                        value={rate.maxRate}
                        onChange={e => handleRateChange(rate.id, 'maxRate', e.target.value)}
                        className={`w-32 px-2.5 py-1 text-xs text-right font-mono border rounded focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-[#0F1115] border-[#2D3139] text-[#E2E8F0] focus:border-blue-500' 
                            : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`p-4 border-t flex items-center gap-3 ${
          isDarkMode ? 'border-[#2D3139] bg-[#111419]' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <button
            onClick={handleReload}
            className={`inline-flex items-center gap-2 font-medium text-xs px-4 py-2 rounded transition-colors cursor-pointer ${
              isDarkMode 
                ? 'bg-[#2D3139] hover:bg-[#383E49] text-[#E2E8F0]' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#94A3B8]' : 'text-slate-500'}`} />
            <span>Reload Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};

