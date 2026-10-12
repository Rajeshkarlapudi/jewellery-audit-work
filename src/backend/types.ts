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
  rawRow?: Record<string, any>;
}

export type ErrorType = 
  | 'INVALID_ACCOUNT_PRODUCT'
  | 'INVALID_UOM'
  | 'RATE_DEVIATION'
  | 'INVALID_PRODUCT'
  | 'MISSING_RATE_MASTER_DATA'
  | 'INVALID_TRANSACTION_DATA';

export interface AuditError {
  type: ErrorType;
  message: string;
}

export interface AuditResultRow {
  id: string;
  transaction: TransactionRow;
  status: 'VALID' | 'ERROR';
  errors: AuditError[];
  primaryMessage: string;
  categoryErrorType?: ErrorType;
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
  averageRatesByProduct: Record<string, { totalGross: number; totalQty: number; avgRate: number; count: number }>;
}

export interface GoldSilverRateRange {
  id: string;
  product: string;
  productKey: string;
  minRate: number;
  maxRate: number;
  allowedMinRate: number;
  allowedMaxRate: number;
}

export interface RateMasterEntry {
  product: string;
  category: 'GOLD' | 'SILVER' | 'DIAMOND' | 'GEMSTONE' | 'OTHER';
  baseMinRate: number;
  baseMaxRate: number;
  uom: 'GRAMS' | 'CARATS';
}

export interface AccountProductMappingRule {
  accountName: string;
  allowedProducts: string[];
  allowedPatterns: string[];
}
