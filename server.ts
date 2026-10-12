import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';

import { TransactionRow, AuditResultRow, AuditSummary } from './src/backend/types';
import {
  getActiveGoldSilverRates,
  setActiveGoldSilverRates,
  DEFAULT_GOLD_SILVER_RATES
} from './src/backend/masterData';
import { runBatchAudit } from './src/backend/auditEngine';
import { generateSampleJewelleryData } from './src/backend/sampleData';
import {

  generateExcelReport,
  generateCsvReport,
  generatePdfReport
} from './src/backend/exportService';

// Saved gold & silver ranges survive server restarts (data/gold-silver-rates.json)
const RATES_FILE = path.join(process.cwd(), 'data', 'gold-silver-rates.json');
function persistRates() {
  try {
    fs.mkdirSync(path.dirname(RATES_FILE), { recursive: true });
    fs.writeFileSync(RATES_FILE, JSON.stringify(getActiveGoldSilverRates(), null, 2));
  } catch (err) {
    console.error('Could not persist gold & silver rates:', err);
  }
}
function loadPersistedRates() {
  try {
    const saved = JSON.parse(fs.readFileSync(RATES_FILE, 'utf-8'));
    if (Array.isArray(saved) && saved.length > 0) setActiveGoldSilverRates(saved);
  } catch { /* no saved file yet: keep defaults */ }
}
loadPersistedRates();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// State store for active audit session
let currentTransactions: TransactionRow[] = generateSampleJewelleryData(1097);
let currentResults: AuditResultRow[] = [];
let currentSummary: AuditSummary | null = null;

// Perform initial run
const initial = runBatchAudit(currentTransactions);
currentResults = initial.results;
currentSummary = initial.summary;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API HEALTH CHECK
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GET GOLD & SILVER RATE RANGES
  app.get('/api/gold-silver-rates', (req, res) => {
    res.json(getActiveGoldSilverRates());
  });

  // UPDATE GOLD & SILVER RATE RANGES
  app.post('/api/gold-silver-rates', (req, res) => {
    const rates = req.body;
    if (Array.isArray(rates)) {
      setActiveGoldSilverRates(rates);
      persistRates();
      // Re-run current audit with updated rate ranges
      if (currentTransactions.length > 0) {
        const audited = runBatchAudit(currentTransactions);
        currentResults = audited.results;
        currentSummary = audited.summary;
      }
      res.json({ success: true, rates: getActiveGoldSilverRates() });
    } else {
      res.status(400).json({ error: 'Expected array of rate rules' });
    }
  });

  // RESET GOLD & SILVER RATES
  app.post('/api/gold-silver-rates/reset', (req, res) => {
    setActiveGoldSilverRates(DEFAULT_GOLD_SILVER_RATES);
    persistRates();
    if (currentTransactions.length > 0) {
      const audited = runBatchAudit(currentTransactions);
      currentResults = audited.results;
      currentSummary = audited.summary;
    }
    res.json({ success: true, rates: getActiveGoldSilverRates() });
  });

  // UPLOAD & PARSE EXCEL LEDGER FILE
  app.post('/api/audit/upload', upload.single('file'), (req, res) => {
    try {
      let rows: TransactionRow[] = [];

      if (req.file) {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // The ledger export has company/title rows above the header; find the header row
        // (first row containing both "Product" and "Unit Rate"/"Sales Account") instead of assuming row 1.
        const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
        const norm = (v: any) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
        let headerIdx = matrix.findIndex(r => {
          const cells = r.map(norm);
          return cells.includes('product') && (cells.includes('unitrate') || cells.includes('salesaccount'));
        });
        if (headerIdx < 0) headerIdx = 0;
        const headers: string[] = matrix[headerIdx].map((h: any) => String(h ?? '').trim());
        const rawJson: Record<string, any>[] = matrix
          .slice(headerIdx + 1)
          .filter(r => r.some(c => String(c ?? '').trim() !== ''))
          .map(r => {
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? ''; });
            return obj;
          });

        if (!rawJson || rawJson.length === 0) {
          return res.status(400).json({ error: 'Uploaded file contains no readable rows.' });
        }

        // Map flexible headers to standard TransactionRow model
        rows = rawJson.map((r, idx) => {
          const findVal = (...keys: string[]) => {
            for (const k of Object.keys(r)) {
              for (const searchKey of keys) {
                if (k.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === searchKey.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                  return r[k];
                }
              }
            }
            return '';
          };

          const sNo = findVal('sno', 's.no', 's.no.', 'srno', 'slno') || (idx + 1);
          const date = findVal('date', 'voucherdate', 'txndate') || new Date().toISOString();
          const voucherNo = findVal('voucherno', 'vouchernumber', 'voucher', 'vch no') || `VCH/${idx + 1}`;
          const partyName = findVal('nameoftheparty', 'party', 'partyname', 'customername') || 'Cash Party';
          const salesAccount = findVal('salesaccount', 'salesacc', 'account') || '';
          const otherAccount = findVal('otheraccount', 'account2', 'paymentaccount') || 'Cash';
          const product = findVal('product', 'productname', 'item', 'itemname') || '';
          const uom = findVal('uom', 'unit', 'unitofmeasure') || '';
          const quantity = parseFloat(findVal('quantity', 'qty', 'weight') || '0');
          const freeQuantity = parseFloat(findVal('freequantity', 'freeqty') || '0');
          const unitRate = parseFloat(findVal('unitrate', 'rate', 'price') || '0');
          const grossAmount = parseFloat(findVal('grossamount', 'gross', 'amount') || '0') || (quantity * unitRate);
          const cgst = parseFloat(findVal('cgst') || '0');
          const sgst = parseFloat(findVal('sgst') || '0');
          const igst = parseFloat(findVal('igst') || '0');
          const gstAmount = parseFloat(findVal('gstamount', 'gst') || '0') || (cgst + sgst + igst);
          const netAmount = parseFloat(findVal('netamount', 'net') || '0') || (grossAmount + gstAmount);

          return {
            sNo,
            date: String(date),
            voucherNo: String(voucherNo),
            partyName: String(partyName),
            salesAccount: String(salesAccount),
            otherAccount: String(otherAccount),
            product: String(product),
            uom: String(uom),
            quantity: Number.isNaN(quantity) ? 0 : quantity,
            freeQuantity: Number.isNaN(freeQuantity) ? 0 : freeQuantity,
            unitRate: Number.isNaN(unitRate) ? 0 : unitRate,
            grossAmount: Number.isNaN(grossAmount) ? 0 : grossAmount,
            cgst: Number.isNaN(cgst) ? 0 : cgst,
            sgst: Number.isNaN(sgst) ? 0 : sgst,
            igst: Number.isNaN(igst) ? 0 : igst,
            gstAmount: Number.isNaN(gstAmount) ? 0 : gstAmount,
            netAmount: Number.isNaN(netAmount) ? 0 : netAmount,
            manualGrossWt: parseFloat(findVal('manualgrosswt', 'manualwt') || '0') || quantity,
            autoGrossWt: parseFloat(findVal('autogrosswt', 'autowt') || '0') || quantity,
            diffGrossWt: parseFloat(findVal('differenceingrosswt', 'diffwt') || '0') || 0,
            pan: String(findVal('pan') || ''),
            addressProof: String(findVal('addressproof') || ''),
            address: String(findVal('address') || ''),
            rawRow: r
          };
        });
      } else if (req.body.sampleSize) {
        // Run sample data set with specified size
        rows = generateSampleJewelleryData(Number(req.body.sampleSize) || 1097);
      } else {
        return res.status(400).json({ error: 'No file uploaded or sample size specified' });
      }

      currentTransactions = rows;
      const audited = runBatchAudit(rows);
      currentResults = audited.results;
      currentSummary = audited.summary;

      res.json({
        success: true,
        message: `Successfully processed ${rows.length} records`,
        summary: currentSummary
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      res.status(500).json({ error: 'Failed to process workbook', details: err.message });
    }
  });

  // RUN / RE-RUN AUDIT VALIDATION
  app.post('/api/audit/run', (req, res) => {
    if (!currentTransactions || currentTransactions.length === 0) {
      currentTransactions = generateSampleJewelleryData(1097);
    }

    const audited = runBatchAudit(currentTransactions);
    currentResults = audited.results;
    currentSummary = audited.summary;

    res.json({
      success: true,
      summary: currentSummary,
      totalResults: currentResults.length
    });
  });

  // GET AUDIT SUMMARY
  app.get('/api/audit/summary', (req, res) => {
    if (!currentSummary) {
      const audited = runBatchAudit(currentTransactions);
      currentResults = audited.results;
      currentSummary = audited.summary;
    }
    res.json(currentSummary);
  });

  // GET PAGINATED & FILTERED EXCEPTION RESULTS
  app.get('/api/audit/results', (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000; // Large page size support
    const filter = (req.query.filter as string) || 'ALL'; // ALL, ERROR, VALID, INVALID_ACCOUNT_PRODUCT, RATE_DEVIATION, INVALID_UOM
    const search = (req.query.search as string || '').toLowerCase().trim();

    let filtered = currentResults;

    if (filter === 'ERROR') {
      filtered = filtered.filter(r => r.status === 'ERROR');
    } else if (filter === 'VALID') {
      filtered = filtered.filter(r => r.status === 'VALID');
    } else if (filter === 'INVALID_ACCOUNT_PRODUCT') {
      filtered = filtered.filter(r => r.errors.some(e => e.type === 'INVALID_ACCOUNT_PRODUCT'));
    } else if (filter === 'RATE_DEVIATION') {
      filtered = filtered.filter(r => r.errors.some(e => e.type === 'RATE_DEVIATION'));
    } else if (filter === 'INVALID_UOM') {
      filtered = filtered.filter(r => r.errors.some(e => e.type === 'INVALID_UOM'));
    }

    if (search) {
      filtered = filtered.filter(r => {
        const t = r.transaction;
        return (
          t.voucherNo?.toLowerCase().includes(search) ||
          t.partyName?.toLowerCase().includes(search) ||
          t.product?.toLowerCase().includes(search) ||
          t.salesAccount?.toLowerCase().includes(search) ||
          r.primaryMessage?.toLowerCase().includes(search)
        );
      });
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.json({
      page,
      limit,
      totalCount,
      totalPages,
      filter,
      search,
      data: paginated
    });
  });

  // Helper to filter results for export
  const filterExportRows = (filter: string, search: string) => {
    let filtered = currentResults;
    if (filter === 'ERROR') {
      filtered = filtered.filter(r => r.status === 'ERROR');
    } else if (filter === 'VALID') {
      filtered = filtered.filter(r => r.status === 'VALID');
    } else if (filter === 'INVALID_ACCOUNT_PRODUCT') {
      filtered = filtered.filter(r => r.errors.some(e => e.type === 'INVALID_ACCOUNT_PRODUCT'));
    } else if (filter === 'RATE_DEVIATION') {
      filtered = filtered.filter(r => r.errors.some(e => e.type === 'RATE_DEVIATION'));
    } else if (filter === 'INVALID_UOM') {
      filtered = filtered.filter(r => r.errors.some(e => e.type === 'INVALID_UOM'));
    }

    if (search) {
      filtered = filtered.filter(r => {
        const t = r.transaction;
        return (
          t.voucherNo?.toLowerCase().includes(search) ||
          t.partyName?.toLowerCase().includes(search) ||
          t.product?.toLowerCase().includes(search) ||
          t.salesAccount?.toLowerCase().includes(search) ||
          r.primaryMessage?.toLowerCase().includes(search)
        );
      });
    }

    // Category reports show only that category's reason; consolidated keeps every reason.
    if (['INVALID_ACCOUNT_PRODUCT', 'RATE_DEVIATION', 'INVALID_UOM'].includes(filter)) {
      filtered = filtered.map(r => ({
        ...r,
        primaryMessage: r.errors.filter(e => e.type === filter).map(e => e.message).join('; ')
      }));
    }

    return filtered;
  };

  const REPORT_NAMES: Record<string, string> = {
    INVALID_ACCOUNT_PRODUCT: 'Sales_Ledger_Mismatch_Report',
    RATE_DEVIATION: 'Range_Deviations_Report',
    INVALID_UOM: 'Invalid_UOM_Report',
    ERROR: 'Consolidated_Error_Report',
    VALID: 'Valid_Rows_Report',
    ALL: 'All_Rows_Report'
  };
  const reportName = (filter: string) => REPORT_NAMES[filter] || `Audit_Report_${filter}`;

  // EXPORT EXCEL
  app.get('/api/audit/export/excel', async (req, res) => {
    try {
      const filter = (req.query.filter as string) || 'ALL';
      const search = (req.query.search as string || '').toLowerCase().trim();
      const exportRows = filterExportRows(filter, search);

      const buffer = await generateExcelReport(exportRows, filter);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportName(filter)}_${Date.now()}.xlsx"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(buffer);
    } catch (err: any) {
      console.error('Excel export error:', err);
      res.status(500).json({ error: 'Failed to generate Excel report', details: err.message });
    }
  });

  // EXPORT CSV
  app.get('/api/audit/export/csv', (req, res) => {
    try {
      const filter = (req.query.filter as string) || 'ALL';
      const search = (req.query.search as string || '').toLowerCase().trim();
      const exportRows = filterExportRows(filter, search);

      const csvContent = generateCsvReport(exportRows);
      const buffer = Buffer.from(csvContent, 'utf-8');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${reportName(filter)}_${Date.now()}.csv"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(buffer);
    } catch (err: any) {
      console.error('CSV export error:', err);
      res.status(500).json({ error: 'Failed to generate CSV report', details: err.message });
    }
  });

  // EXPORT PDF
  app.get('/api/audit/export/pdf', (req, res) => {
    try {
      const filter = (req.query.filter as string) || 'ALL';
      const search = (req.query.search as string || '').toLowerCase().trim();
      const exportRows = filterExportRows(filter, search);

      const currentAuditSummary = currentSummary || runBatchAudit(currentTransactions).summary;
      const buffer = generatePdfReport(exportRows, currentAuditSummary);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportName(filter)}_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(buffer);
    } catch (err: any) {
      console.error('PDF export error:', err);
      res.status(500).json({ error: 'Failed to generate PDF report', details: err.message });
    }
  });

  // VITE MIDDLEWARE / PRODUCTION STATIC FALLBACK
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Jewellery Audit Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
