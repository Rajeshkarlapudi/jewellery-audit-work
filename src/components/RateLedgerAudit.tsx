import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Sliders,
  Play,
  Download,
  Search,
  X,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import {
  AuditSummary,
  AuditResultRow,
  uploadAuditWorkbook,
  runAuditValidation,
  fetchAuditSummary,
  fetchAuditResults
} from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface RateLedgerAuditProps {
  onNavigateToRates: () => void;
}

export const RateLedgerAudit: React.FC<RateLedgerAuditProps> = ({ onNavigateToRates }) => {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [hasValidated, setHasValidated] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  const [validationStep, setValidationStep] = useState<string>('loading workbook');

  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [results, setResults] = useState<AuditResultRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL'); // ALL, ERROR, VALID, RATE_DEVIATION, INVALID_UOM, INVALID_ACCOUNT_PRODUCT
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only load audit data from backend if user has validated a file
    if (hasValidated) {
      loadAuditData();
    }
  }, [hasValidated, activeFilter, searchQuery, currentPage]);

  const loadAuditData = async () => {
    try {
      const sumData = await fetchAuditSummary();
      setSummary(sumData);

      const resData = await fetchAuditResults(activeFilter, searchQuery, currentPage, 100);
      setResults(resData.data);
      setTotalPages(resData.totalPages);
      setTotalCount(resData.totalCount);
    } catch (err) {
      console.error('Failed to load audit data:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setFileName(selected.name);
      // Reset validation state until "Run Validation" is clicked
      setHasValidated(false);
      setSummary(null);
      setResults([]);
      setTotalCount(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setFileName(dropped.name);
      // Reset validation state until "Run Validation" is clicked
      setHasValidated(false);
      setSummary(null);
      setResults([]);
      setTotalCount(0);
    }
  };

  const handleClearFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFile(null);
    setFileName('');
    setHasValidated(false);
    setSummary(null);
    setResults([]);
    setTotalCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRunValidation = async () => {
    if (!file) {
      // Trigger file selection if no file uploaded
      fileInputRef.current?.click();
      return;
    }

    setValidating(true);

    const steps = [
      'loading workbook',
      'Detecting headers',
      'Reading records',
      'Validating audit rules',
      'Generating report'
    ];

    for (let i = 0; i < steps.length; i++) {
      setValidationStep(steps[i]);
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      const uploadRes = await uploadAuditWorkbook(file);
      setSummary(uploadRes.summary);
      setHasValidated(true);
      setCurrentPage(1);
      
      // Fetch audit results immediately
      const resData = await fetchAuditResults(activeFilter, searchQuery, 1, 100);
      setResults(resData.data);
      setTotalPages(resData.totalPages);
      setTotalCount(resData.totalCount);
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setValidating(false);
    }
  };

  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: 'excel' | 'csv' | 'pdf', reportFilter?: string) => {
    const filter = reportFilter ?? activeFilter;
    try {
      setExporting(reportFilter ? `${reportFilter}:${type}` : type);
      const queryParams = new URLSearchParams({
        filter,
        search: reportFilter ? '' : searchQuery
      });
      const url = `/api/audit/export/${type}?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const ext = type === 'excel' ? 'xlsx' : type;
      link.setAttribute('download', `Audit_Report_${filter}_${Date.now()}.${ext}`);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export download error:', err);
    } finally {
      setExporting(null);
    }
  };

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'ERROR': return 'Error rows';
      case 'VALID': return 'Valid rows';
      case 'RATE_DEVIATION': return 'Range deviations';
      case 'INVALID_UOM': return 'Invalid UOM';
      case 'INVALID_ACCOUNT_PRODUCT': return 'Sales ledger mismatch';
      default: return 'All rows';
    }
  };

  const formatSimpleAuditMessage = (rawMsg: string): string => {
    if (!rawMsg || rawMsg.trim().toLowerCase() === 'valid') return 'Valid';
    const lower = rawMsg.toLowerCase();
    if (lower.includes('below allowed range') || lower.includes('rate below') || lower.includes('below min')) {
      return 'Rate below allowed range';
    }
    if (lower.includes('above allowed range') || lower.includes('rate above') || lower.includes('above max')) {
      return 'Rate above allowed range';
    }
    if (lower.includes('account') || lower.includes('not allowed') || lower.includes('ledger') || lower.includes('mismatch')) {
      return 'Rate below allowed range';
    }
    if (lower.includes('uom') || lower.includes('expected uom')) {
      return 'Invalid UOM';
    }
    if (lower.includes('rate') || lower.includes('deviation')) {
      return 'Rate below allowed range';
    }
    return rawMsg;
  };

  return (
    <div className={`p-8 max-w-[1600px] mx-auto space-y-8 relative transition-colors ${
      isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
    }`}>
      {/* Validation Loading Overlay */}
      {validating && (
        <div className={`fixed inset-0 z-50 backdrop-blur-xs flex flex-col items-center justify-center p-6 ${
          isDarkMode ? 'bg-[#0F1115]/90 text-white' : 'bg-slate-900/80 text-white'
        }`}>
          <div className={`border rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6 ${
            isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <p className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">
              AUDIT INTELLIGENCE ENGINE
            </p>

            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#2D3139] border-t-blue-500 animate-spin" />
              <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-500 font-bold flex items-center justify-center text-xs">
                HAA
              </div>
            </div>

            <div>
              <p className={`text-xs font-medium capitalize animate-pulse ${
                isDarkMode ? 'text-[#94A3B8]' : 'text-slate-600'
              }`}>
                {validationStep}...
              </p>
              <div className="flex justify-center gap-1 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping delay-200" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className={`rounded-xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h2 className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
            Upload & Validate
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            Gold & silver benchmark rates are active. Upload your ledger spreadsheet and run validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToRates}
            className={`inline-flex items-center gap-2 border font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
              isDarkMode 
                ? 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-blue-500/20' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span>Gold & Silver Rates</span>
          </button>

          <button
            onClick={handleRunValidation}
            disabled={validating}
            className={`inline-flex items-center gap-2 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer ${
              file
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-600/60 hover:bg-blue-600 text-white'
            }`}
            title={!file ? 'Click to select a file and run validation' : 'Run validation on uploaded file'}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Validation</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDarkMode 
            ? 'bg-[#16191F] border-[#2D3139] hover:border-blue-500' 
            : 'bg-white border-slate-300 hover:border-blue-500 shadow-sm'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".xlsx,.xls,.xlsm,.csv"
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-6 h-6" />
        </div>

        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>
          Drag & Drop Excel File
        </h3>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
          Supported formats: .xlsx, .xls, .xlsm, .csv
        </p>

        {fileName && (
          <div className={`mt-3 inline-flex items-center gap-2 border px-3 py-1.5 rounded-md text-xs font-mono ${
            isDarkMode 
              ? 'bg-[#111419] border-[#2D3139] text-[#E2E8F0]' 
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">{fileName}</span>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              hasValidated 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {hasValidated ? 'Validated' : 'Pending Validation'}
            </span>
            <button
              onClick={handleClearFile}
              className="p-0.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-colors ml-1 cursor-pointer"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`inline-flex items-center gap-1.5 border font-medium text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode 
                ? 'bg-[#111419] hover:bg-[#1C2128] border-[#2D3139] text-[#E2E8F0]' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            Browse files
          </button>
        </div>
      </div>

      {/* Analytics Card */}
      <div className={`rounded-xl border p-5 transition-colors ${
        isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${
          isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
        }`}>
          ANALYTICS SUMMARY
        </p>
        <div className={`rounded-lg p-4 border flex items-start justify-between max-w-sm ${
          isDarkMode ? 'bg-[#111419] border-[#2D3139]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
            }`}>
              PRODUCT AVERAGE RATES
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
            }`}>
              {hasValidated && summary ? summary.productAverageRatesCount : 0}
            </p>
            <p className={`text-[11px] mt-0.5 ${
              isDarkMode ? 'text-[#64748B]' : 'text-slate-500'
            }`}>
              Products with gross/qty averages from this run
            </p>
          </div>
          <div className="p-2.5 rounded-md bg-blue-600/10 text-blue-500 border border-blue-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Audit Intelligence Summary KPI Grid */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${
          isDarkMode ? 'text-[#94A3B8]' : 'text-slate-500'
        }`}>
          AUDIT INTELLIGENCE SUMMARY
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Rows */}
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
              activeFilter === 'ALL'
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : isDarkMode ? 'bg-[#16191F] border-[#2D3139] hover:border-[#383E49]' : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
            }`}>
              TOTAL ROWS
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
            }`}>
              {hasValidated && summary ? summary.totalRows.toLocaleString() : '0'}
            </p>
          </button>

          {/* Error Rows */}
          <button
            onClick={() => setActiveFilter('ERROR')}
            className={`p-4 rounded-xl border transition-all text-left border-l-4 border-l-rose-500 cursor-pointer ${
              activeFilter === 'ERROR'
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5'
                : isDarkMode ? 'bg-[#16191F] border-[#2D3139] hover:border-rose-500/50' : 'bg-white border-slate-200 hover:border-rose-400 shadow-xs'
            }`}
          >
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>ERROR ROWS</span>
            </p>
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
              {hasValidated && summary ? summary.errorRows.toLocaleString() : '0'}
            </p>
          </button>

          {/* Sales Ledger Mismatch */}
          <button
            onClick={() => setActiveFilter('INVALID_ACCOUNT_PRODUCT')}
            className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
              activeFilter === 'INVALID_ACCOUNT_PRODUCT'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
                : isDarkMode ? 'bg-[#16191F] border-[#2D3139] hover:border-amber-500/50' : 'bg-white border-slate-200 hover:border-amber-400 shadow-xs'
            }`}
          >
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              SALES LEDGER MISMATCH
            </p>
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              {hasValidated && summary ? summary.salesLedgerMismatchCount.toLocaleString() : '0'}
            </p>
          </button>

          {/* Range Deviations */}
          <button
            onClick={() => setActiveFilter('RATE_DEVIATION')}
            className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
              activeFilter === 'RATE_DEVIATION'
                ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-500/5'
                : isDarkMode ? 'bg-[#16191F] border-[#2D3139] hover:border-orange-500/50' : 'bg-white border-slate-200 hover:border-orange-400 shadow-xs'
            }`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-[#64748B]' : 'text-slate-500'
            }`}>
              RANGE DEVIATIONS
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
            }`}>
              {hasValidated && summary ? summary.rangeDeviationsCount.toLocaleString() : '0'}
            </p>
          </button>

          {/* Invalid UOM */}
          <button
            onClick={() => setActiveFilter('INVALID_UOM')}
            className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
              activeFilter === 'INVALID_UOM'
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/5'
                : isDarkMode ? 'bg-[#16191F] border-[#2D3139] hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-400 shadow-xs'
            }`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-[#64748B]' : 'text-slate-500'
            }`}>
              INVALID UOM
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'
            }`}>
              {hasValidated && summary ? summary.invalidUomCount.toLocaleString() : '0'}
            </p>
          </button>

          {/* Compliance % */}
          <button
            onClick={() => setActiveFilter('VALID')}
            className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
              activeFilter === 'VALID'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                : isDarkMode ? 'bg-[#16191F] border-[#2D3139] hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-400 shadow-xs'
            }`}
          >
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
              COMPLIANCE
            </p>
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {hasValidated && summary ? summary.compliancePercentage : '0.0'}%
            </p>
          </button>
        </div>
      </div>

      {/* Downloadable Reports: one per error category + consolidated */}
      {hasValidated && (
        <div className={`rounded-xl border overflow-hidden transition-colors ${
          isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-[#2D3139] bg-[#111419]' : 'border-slate-200 bg-slate-50'}`}>
            <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>Download Reports</h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
              A separate report per error category plus a consolidated error report. Every failed record carries its error message.
            </p>
          </div>
          <div className="divide-y divide-slate-200/20">
            {([
              { filter: 'INVALID_ACCOUNT_PRODUCT', label: 'Sales Ledger Mismatch', count: summary?.salesLedgerMismatchCount },
              { filter: 'RATE_DEVIATION', label: 'Range Deviations', count: summary?.rangeDeviationsCount },
              { filter: 'INVALID_UOM', label: 'Invalid UOM', count: summary?.invalidUomCount },
              { filter: 'ERROR', label: 'Consolidated Error Report (all errors)', count: summary?.errorRows }
            ] as const).map(rep => (
              <div key={rep.filter} className="px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className={`text-sm ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>
                  <span className="font-medium">{rep.label}</span>
                  <span className={`ml-2 text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
                    {rep.count ?? 0} records
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(['excel', 'csv', 'pdf'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => handleExport(t, rep.filter)}
                      disabled={!!exporting || !(rep.count && rep.count > 0)}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isDarkMode ? 'bg-[#2D3139] hover:bg-[#383E49] text-[#E2E8F0]' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{exporting === `${rep.filter}:${t}` ? 'Exporting...' : t === 'excel' ? 'Excel' : t.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exception Report Table Section */}
      <div className={`rounded-xl border overflow-hidden flex flex-col transition-colors ${
        isDarkMode ? 'bg-[#16191F] border-[#2D3139]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Table Top Toolbar */}
        <div className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDarkMode ? 'border-[#2D3139] bg-[#111419]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-900'}`}>
              Live Exception Ledger
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
              Original upload columns preserved with audit messages appended.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport('excel')}
              disabled={!hasValidated || !!exporting || results.length === 0}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium text-xs px-4 py-2 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting === 'excel' ? 'Exporting...' : 'Export Excel'}</span>
            </button>

            <button
              onClick={() => handleExport('csv')}
              disabled={!hasValidated || !!exporting || results.length === 0}
              className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'bg-[#2D3139] hover:bg-[#383E49] text-[#E2E8F0]' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#94A3B8]' : 'text-slate-500'}`} />
              <span>{exporting === 'csv' ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={!hasValidated || !!exporting || results.length === 0}
              className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'bg-[#2D3139] hover:bg-[#383E49] text-[#E2E8F0]' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#94A3B8]' : 'text-slate-500'}`} />
              <span>{exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className={`px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDarkMode ? 'bg-[#111419] border-[#2D3139]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="relative max-w-sm w-full">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!hasValidated}
              placeholder="Filter by Party, Voucher, Product..."
              className={`pl-9 pr-3 py-1.5 text-xs rounded w-full focus:outline-none transition-all disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-[#0F1115] border border-[#2D3139] text-[#E2E8F0] placeholder-[#64748B] focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500' 
                  : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
            />
          </div>

          <div className={`flex items-center gap-3 text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-slate-500'}`}>
            <span>
              Showing <strong className={`font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>{getFilterLabel(activeFilter)}</strong>: {hasValidated ? totalCount : 0} records found
            </span>

            {activeFilter !== 'ALL' && (
              <button
                onClick={() => {
                  setActiveFilter('ALL');
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  isDarkMode 
                    ? 'text-[#94A3B8] hover:text-[#E2E8F0] bg-[#2D3139] hover:bg-[#383E49]' 
                    : 'text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300'
                }`}
              >
                <X className="w-3 h-3" />
                <span>Clear filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Exception Table */}
        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-left text-xs border-collapse min-w-[2000px]">
            <thead className={`sticky top-0 z-10 border-b uppercase font-semibold tracking-wider text-[11px] ${
              isDarkMode 
                ? 'bg-[#111419] border-[#2D3139] text-[#64748B]' 
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              <tr>
                <th className="py-3 px-4">SNO</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">VOUCHER NO</th>
                <th className="py-3 px-4">PARTY NAME</th>
                <th className="py-3 px-4">SALES ACCOUNT</th>
                <th className="py-3 px-4">OTHER ACCOUNT</th>
                <th className="py-3 px-4">PRODUCT</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4 text-right">QUANTITY</th>
                <th className="py-3 px-4 text-right">UNIT RATE</th>
                <th className="py-3 px-4 text-right">GROSS AMOUNT</th>
                <th className="py-3 px-4 text-right">GST AMOUNT</th>
                <th className="py-3 px-4 text-right">NET AMOUNT</th>
                <th className="py-3 px-4 text-right">MANUAL GROSS WT</th>
                <th className="py-3 px-4 text-right">AUTO GROSS WT</th>
                <th className="py-3 px-4 text-right">DIFF GROSS WT</th>
                <th className="py-3 px-4">PAN</th>
                <th className="py-3 px-4">ADDRESS PROOF</th>
                <th className="py-3 px-4">ADDRESS</th>
                <th 
                  style={{ width: '2119.75px' }}
                  className={`py-3 px-4 font-semibold ${
                    isDarkMode ? 'bg-[#0F1115] text-[#E2E8F0]' : 'bg-slate-200 text-slate-900'
                  }`}
                >
                  AUDIT MESSAGE
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-[#2D3139] bg-[#16191F]' : 'divide-slate-200 bg-white'
            }`}>
              {!hasValidated ? (
                <tr>
                  <td colSpan={20} className={`py-16 text-center ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-400/50 mb-1" />
                      <p className="font-semibold text-sm">No Audit Results Displayed</p>
                      <p className="text-xs text-slate-500 max-w-md">
                        {file 
                          ? "File loaded successfully. Click 'Run Validation' above to process the workbook and generate findings." 
                          : "Upload or drag & drop an Excel file (.xlsx, .csv) and click 'Run Validation' to execute the audit."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={20} className={`py-12 text-center ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>
                    No matching transaction exceptions found.
                  </td>
                </tr>
              ) : (
                results.map(row => {
                  const t = row.transaction;
                  const isErr = row.status === 'ERROR';
                  const simpleMsg = formatSimpleAuditMessage(row.primaryMessage);

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        isDarkMode 
                          ? `hover:bg-[#1C2128] ${isErr ? 'bg-rose-500/5' : ''}` 
                          : `hover:bg-slate-50 ${isErr ? 'bg-rose-50/50' : ''}`
                      }`}
                    >
                      <td className={`py-3.5 px-4 font-mono text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>{t.sNo}</td>
                      <td className={`py-3.5 px-4 whitespace-nowrap ${isDarkMode ? 'text-[#94A3B8]' : 'text-slate-600'}`}>{t.date?.split('T')[0]}</td>
                      <td className={`py-3.5 px-4 font-mono text-xs font-medium whitespace-nowrap ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>{t.voucherNo}</td>
                      <td className={`py-3.5 px-4 whitespace-nowrap ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>{t.partyName}</td>
                      <td className={`py-3.5 px-4 whitespace-nowrap ${isDarkMode ? 'text-[#94A3B8]' : 'text-slate-600'}`}>{t.salesAccount}</td>
                      <td className={`py-3.5 px-4 whitespace-nowrap ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>{t.otherAccount || '-'}</td>
                      <td className={`py-3.5 px-4 font-medium whitespace-nowrap ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>{t.product}</td>
                      <td className={`py-3.5 px-4 whitespace-nowrap ${isDarkMode ? 'text-[#94A3B8]' : 'text-slate-600'}`}>{t.uom}</td>
                      <td className={`py-3.5 px-4 text-right font-mono ${isDarkMode ? 'text-[#94A3B8]' : 'text-slate-600'}`}>{t.quantity}</td>
                      <td className={`py-3.5 px-4 text-right font-mono ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>₹{t.unitRate?.toLocaleString()}</td>
                      <td className={`py-3.5 px-4 text-right font-mono ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>₹{t.grossAmount?.toLocaleString()}</td>
                      <td className={`py-3.5 px-4 text-right font-mono ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>₹{t.gstAmount?.toLocaleString()}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>₹{t.netAmount?.toLocaleString()}</td>
                      <td className={`py-3.5 px-4 text-right font-mono ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>{t.manualGrossWt || '-'}</td>
                      <td className={`py-3.5 px-4 text-right font-mono ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>{t.autoGrossWt || '-'}</td>
                      <td className={`py-3.5 px-4 text-right font-mono ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>{t.diffGrossWt || 0}</td>
                      <td className={`py-3.5 px-4 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>{t.pan || '-'}</td>
                      <td className={`py-3.5 px-4 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>{t.addressProof || '-'}</td>
                      <td className={`py-3.5 px-4 truncate max-w-[120px] ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`}>{t.address || '-'}</td>
                      <td className={`py-3.5 px-4 font-medium ${
                        isDarkMode ? 'bg-[#0F1115]/60' : 'bg-slate-50'
                      }`}>
                        {isErr ? (
                          <span 
                            title={row.primaryMessage}
                            className={`px-2 py-0.5 rounded text-[11px] inline-block font-medium ${
                              isDarkMode 
                                ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' 
                                : 'text-rose-700 bg-rose-100 border border-rose-200'
                            }`}
                          >
                            {simpleMsg}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[11px] inline-block font-medium ${
                            isDarkMode 
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                              : 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                          }`}>
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={`px-6 py-4 border-t flex items-center justify-between text-xs ${
          isDarkMode 
            ? 'border-[#2D3139] text-[#64748B] bg-[#111419]' 
            : 'border-slate-200 text-slate-500 bg-slate-50'
        }`}>
          <div>
            Showing <span className={`font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-800'}`}>Page {hasValidated ? currentPage : 0} of {hasValidated ? totalPages : 0}</span> ({hasValidated ? totalCount : 0} total rows)
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!hasValidated || currentPage <= 1}
              className={`px-3 py-1 rounded border disabled:opacity-30 transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'border-[#2D3139] text-[#E2E8F0] hover:bg-[#2D3139]' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Prev
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={!hasValidated || currentPage >= totalPages}
              className={`px-3 py-1 rounded border disabled:opacity-30 transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'border-[#2D3139] text-[#E2E8F0] hover:bg-[#2D3139]' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

