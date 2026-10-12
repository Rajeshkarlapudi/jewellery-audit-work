export interface GoldSilverRateRange {
  id: string;
  product: string;
  productKey: string;
  minRate: number;
  maxRate: number;
  allowedMinRate: number;
  allowedMaxRate: number;
}

export interface TransactionRow {
  sNo: number | string;
  date: string;
  voucherNo: string;
  partyName: string;
  salesAccount: string;
  otherAccount?: string;
  product: string;
  uom: string;
  quantity: number;
  freeQuantity?: number;
  unitRate: number;
  grossAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gstAmount?: number;
  netAmount?: number;
  manualGrossWt?: number;
  autoGrossWt?: number;
  diffGrossWt?: number;
  pan?: string;
  addressProof?: string;
  address?: string;
}

export interface AuditError {
  type: 'INVALID_ACCOUNT_PRODUCT' | 'INVALID_UOM' | 'RATE_DEVIATION' | 'INVALID_PRODUCT' | 'MISSING_RATE_MASTER_DATA' | 'INVALID_TRANSACTION_DATA';
  message: string;
}

export interface AuditResultRow {
  id: string;
  transaction: TransactionRow;
  status: 'VALID' | 'ERROR';
  errors: AuditError[];
  primaryMessage: string;
  categoryErrorType?: string;
}

export interface AuditSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  salesLedgerMismatchCount: number;
  rangeDeviationsCount: number;
  invalidUomCount: number;
  compliancePercentage: number;
  productAverageRatesCount: number;
}

export async function fetchGoldSilverRates(): Promise<GoldSilverRateRange[]> {
  const res = await fetch('/api/gold-silver-rates');
  if (!res.ok) throw new Error('Failed to fetch rate ranges');
  return res.json();
}

export async function saveGoldSilverRates(rates: GoldSilverRateRange[]): Promise<void> {
  const res = await fetch('/api/gold-silver-rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rates)
  });
  if (!res.ok) throw new Error('Failed to save rate ranges');
}

export async function resetGoldSilverRates(): Promise<GoldSilverRateRange[]> {
  const res = await fetch('/api/gold-silver-rates/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset rate ranges');
  const data = await res.json();
  return data.rates;
}

export async function uploadAuditWorkbook(file?: File, sampleSize?: number): Promise<{ summary: AuditSummary }> {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/audit/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload workbook');
    }
    return res.json();
  } else {
    const res = await fetch('/api/audit/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleSize: sampleSize || 1097 })
    });
    if (!res.ok) throw new Error('Failed to run benchmark data');
    return res.json();
  }
}

export async function runAuditValidation(): Promise<{ summary: AuditSummary }> {
  const res = await fetch('/api/audit/run', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run audit validation');
  return res.json();
}

export async function fetchAuditSummary(): Promise<AuditSummary> {
  const res = await fetch('/api/audit/summary');
  if (!res.ok) throw new Error('Failed to fetch audit summary');
  return res.json();
}

export async function fetchAuditResults(
  filter: string = 'ALL',
  search: string = '',
  page: number = 1,
  limit: number = 1000
): Promise<{ data: AuditResultRow[]; totalCount: number; totalPages: number }> {
  const params = new URLSearchParams({
    filter,
    search,
    page: page.toString(),
    limit: limit.toString()
  });
  const res = await fetch(`/api/audit/results?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch audit results');
  return res.json();
}
