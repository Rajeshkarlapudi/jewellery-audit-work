import {
  TransactionRow,
  AuditResultRow,
  AuditError,
  AuditSummary,
  ErrorType
} from './types';
import {
  getActiveGoldSilverRates,
  ACCOUNT_PRODUCT_MAPPING_RULES
} from './masterData';
import { RATE_MASTER_BASE } from './rateMasterData';

const RATE_MASTER_INDEX: Map<string, { min: number; max: number; fixed?: boolean }> = new Map(
  Object.entries(RATE_MASTER_BASE).map(([k, v]) => [normalizeProductKey(k), v])
);

function normalizeProductKey(name: string): string {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function rateResult(rate: number, minAllowed: number, maxAllowed: number) {
  if (rate < minAllowed) return { isValid: false, minAllowed, maxAllowed, message: 'Rate below allowed range' };
  if (rate > maxAllowed) return { isValid: false, minAllowed, maxAllowed, message: 'Rate above allowed range' };
  return { isValid: true, minAllowed, maxAllowed };
}

/**
 * Normalizes account names for consistent matching
 */
export function normalizeAccountName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  // Map common alternative labels from Excel sheets
  if (/gold.*14k/i.test(trimmed)) return 'Gold Account – G14';
  if (/gold.*18k/i.test(trimmed)) return 'Gold Account – G18';
  if (/gold.*22k/i.test(trimmed)) return 'Gold Account – G22';
  if (/gold.*jadau|gold.*gj/i.test(trimmed)) return 'Gold Account – GJ';
  if (/gold.*24k|std gold/i.test(trimmed)) return 'Gold Account – G24';
  if (/silver/i.test(trimmed)) return 'Silver Account – S1';
  if (/jewel.*diamond|jewel.*d1/i.test(trimmed)) return 'Jewel Account – D1';
  if (/jewel.*stone|jewel.*cs/i.test(trimmed)) return 'Jewel Account – CS';
  if (/jewel.*emerald|jewel.*em/i.test(trimmed)) return 'Jewel Account – EM';
  if (/jewel.*pearl|jewel.*p1/i.test(trimmed)) return 'Jewel Account – P1';
  if (/jewel.*ruby|jewel.*ru/i.test(trimmed)) return 'Jewel Account – RU';
  return trimmed;
}

/**
 * 1. ACCOUNT / PRODUCT VALIDATION
 */
export function validateAccountProduct(salesAccount: string, product: string): { isValid: boolean; message?: string } {
  if (!salesAccount || !product) {
    return { isValid: true };
  }

  const normalizedAccount = normalizeAccountName(salesAccount);
  const normalizedProd = product.trim();

  // Find mapping rule for the sales account
  const rule = ACCOUNT_PRODUCT_MAPPING_RULES.find(r => 
    r.accountName.toLowerCase() === normalizedAccount.toLowerCase() ||
    normalizedAccount.toLowerCase().includes(r.accountName.toLowerCase().replace('account – ', ''))
  );

  if (!rule) {
    // Unknown account mapping rule
    return { isValid: true };
  }

  // Check exact product match
  const exactMatch = rule.allowedProducts.some(p => p.toLowerCase() === normalizedProd.toLowerCase());
  if (exactMatch) {
    return { isValid: true };
  }

  // Check pattern match
  const patternMatch = rule.allowedPatterns.some(pat => {
    try {
      const regex = new RegExp(pat, 'i');
      return regex.test(normalizedProd);
    } catch {
      return false;
    }
  });

  if (patternMatch) {
    return { isValid: true };
  }

  return {
    isValid: false,
    message: 'Sales ledger mismatch'
  };
}

/**
 * 2. UOM VALIDATION
 */
export function validateUOM(product: string, actualUom: string): { isValid: boolean; expectedUom: 'GRAMS' | 'CARATS'; message?: string } {
  const prod = (product || '').trim();
  const uom = (actualUom || '').trim().toUpperCase();

  let expectedUom: 'GRAMS' | 'CARATS' = 'CARATS';

  // GRAMS Rules
  const exactGramsProducts = [
    'Ornament G14', 'Ornament G18', 'Ornament G22', 'Ornament GJ',
    'Cust Ornament G18', 'Cust Ornament G22',
    'Std Gold G24', 'Articles S1',
    'Beads B1', 'Kundan K1', 'Nail N1', 'Dori D1', 'Lac L1', 'Wax W1'
  ];

  const isExactGrams = exactGramsProducts.some(p => p.toLowerCase() === prod.toLowerCase());
  const isOrnamentG = /^Ornament G/i.test(prod) || /^Cust Ornament G/i.test(prod);
  const isKundanK1 = /Kundan K1/i.test(prod);
  const isPearlsPNumber = /^Pearls P\d+/i.test(prod) || /^Cust Pearl P/i.test(prod);

  if (isExactGrams || isOrnamentG || isKundanK1 || isPearlsPNumber) {
    expectedUom = 'GRAMS';
  } else {
    expectedUom = 'CARATS';
  }

  // Normalize actual UOM string
  let normalizedActual = uom;
  if (['G', 'GM', 'GMS', 'GRAM', 'GRAMS'].includes(uom)) {
    normalizedActual = 'GRAMS';
  } else if (['C', 'CT', 'CTS', 'CARAT', 'CARATS'].includes(uom)) {
    normalizedActual = 'CARATS';
  }

  if (normalizedActual === expectedUom) {
    return { isValid: true, expectedUom };
  }

  return {
    isValid: false,
    expectedUom,
    message: 'Invalid UOM'
  };
}

/**
 * 3. RATE DEVIATION VALIDATION
 */
export function validateRate(
  product: string,
  unitRate: number,
  salesAccount: string
): { isValid: boolean; message?: string; minAllowed?: number; maxAllowed?: number } {
  const prod = (product || '').trim();
  const rate = Number(unitRate) || 0;
  if (rate <= 0) return { isValid: true };

  const goldSilverRates = getActiveGoldSilverRates();

  // A. Check Gold & Silver Rate Ranges
  const matchedGoldSilver = goldSilverRates.find(r => 
    r.productKey.toLowerCase() === prod.toLowerCase() ||
    prod.toLowerCase().includes(r.productKey.toLowerCase()) ||
    (r.productKey === 'Ornament G14' && /^Ornament G14/i.test(prod)) ||
    (r.productKey === 'Ornament G18' && /^Ornament G18/i.test(prod)) ||
    (r.productKey === 'Ornament G22' && /^Ornament G22/i.test(prod)) ||
    (r.productKey === 'Ornament GJ' && /^Ornament GJ/i.test(prod)) ||
    (r.productKey === 'Cust Ornament G18' && /^Cust Ornament G18/i.test(prod)) ||
    (r.productKey === 'Cust Ornament G22' && /^Cust Ornament G22/i.test(prod)) ||
    (r.productKey === 'Std Gold G24' && /^Std Gold G24/i.test(prod)) ||
    (r.productKey === 'Articles S1' && (/^Articles S1/i.test(prod) || /Silver/i.test(salesAccount)))
  );

  if (matchedGoldSilver) {
    const minAllowed = matchedGoldSilver.allowedMinRate;
    const maxAllowed = matchedGoldSilver.allowedMaxRate;

    if (rate < minAllowed) {
      return {
        isValid: false,
        minAllowed,
        maxAllowed,
        message: 'Rate below allowed range'
      };
    }
    if (rate > maxAllowed) {
      return {
        isValid: false,
        minAllowed,
        maxAllowed,
        message: 'Rate above allowed range'
      };
    }
    return { isValid: true, minAllowed, maxAllowed };
  }

  // B. Rate Master lookup (exact product, case/space-insensitive)
  const master = RATE_MASTER_INDEX.get(normalizeProductKey(prod));
  if (master) {
    // "fixed allowed range" products (Beads, Dori, Kundan...) have no % deviation
    if (master.fixed) return rateResult(rate, master.min, master.max);

    const isDiamond = /^(Loose )?S?DX\.|^Polki|^Chakri/i.test(prod);
    // Diamonds: uplift base by 25%, then allow -15% / +15%. Gemstones: -15% / +15%.
    const factor = isDiamond ? 1.25 : 1;
    return rateResult(rate, master.min * factor * 0.85, master.max * factor * 1.15);
  }

  // C. Fallback for products not in the Rate Master: base rate encoded in the product code
  // (e.g. "DL RA 20", "Ruby RU1500"). Diamonds are uplifted by 25%.
  const isDiamond = /Diamond|Chakri|Polki|DX\.|SDX\.|DL R|DL C/i.test(prod) || /Diamond/i.test(salesAccount);
  const isGemstone = /Emerald|Ruby|Stone|\bJEM|\bEM\d|\bRU\d|\bSP\d|\bSY\d/i.test(prod) || /Emerald|Ruby|Stone/i.test(salesAccount);
  if (isDiamond || isGemstone) {
    const matchNumber = prod.match(/(\d+)/);
    const baseRate = matchNumber ? parseFloat(matchNumber[1]) : 0;
    if (baseRate > 0) {
      const factor = isDiamond ? 1.25 : 1;
      return rateResult(rate, baseRate * factor * 0.85, baseRate * factor * 1.15);
    }
  }

  return { isValid: true };
}

/**
 * RUN AUDIT ON SINGLE TRANSACTION ROW
 */
export function auditRow(row: TransactionRow, id: string): AuditResultRow {
  const errors: AuditError[] = [];

  // 1. Account / Product Mapping Check
  const accountCheck = validateAccountProduct(row.salesAccount, row.product);
  if (!accountCheck.isValid && accountCheck.message) {
    errors.push({
      type: 'INVALID_ACCOUNT_PRODUCT',
      message: accountCheck.message
    });
  }

  // 2. UOM Check
  const uomCheck = validateUOM(row.product, row.uom);
  if (!uomCheck.isValid && uomCheck.message) {
    errors.push({
      type: 'INVALID_UOM',
      message: uomCheck.message
    });
  }

  // 3. Rate Deviation Check
  const rateCheck = validateRate(row.product, row.unitRate, row.salesAccount);
  if (!rateCheck.isValid && rateCheck.message) {
    errors.push({
      type: 'RATE_DEVIATION',
      message: rateCheck.message
    });
  }

  const isError = errors.length > 0;
  const primaryMessage = isError 
    ? errors.map(e => e.message).join('; ')
    : 'Valid';

  let categoryErrorType: ErrorType | undefined;
  if (errors.some(e => e.type === 'INVALID_ACCOUNT_PRODUCT')) {
    categoryErrorType = 'INVALID_ACCOUNT_PRODUCT';
  } else if (errors.some(e => e.type === 'RATE_DEVIATION')) {
    categoryErrorType = 'RATE_DEVIATION';
  } else if (errors.some(e => e.type === 'INVALID_UOM')) {
    categoryErrorType = 'INVALID_UOM';
  } else if (errors.length > 0) {
    categoryErrorType = errors[0].type;
  }

  return {
    id,
    transaction: row,
    status: isError ? 'ERROR' : 'VALID',
    errors,
    primaryMessage,
    categoryErrorType
  };
}

/**
 * BATCH AUDIT ENGINE
 */
export function runBatchAudit(rows: TransactionRow[]): { results: AuditResultRow[]; summary: AuditSummary } {
  let validRowsCount = 0;
  let errorRowsCount = 0;
  let salesLedgerMismatchCount = 0;
  let rangeDeviationsCount = 0;
  let invalidUomCount = 0;

  const averageRatesByProduct: Record<string, { totalGross: number; totalQty: number; avgRate: number; count: number }> = {};

  const results: AuditResultRow[] = rows.map((row, index) => {
    const id = (index + 1).toString();
    const result = auditRow(row, id);

    if (result.status === 'VALID') {
      validRowsCount++;
    } else {
      errorRowsCount++;
      if (result.errors.some(e => e.type === 'INVALID_ACCOUNT_PRODUCT')) {
        salesLedgerMismatchCount++;
      }
      if (result.errors.some(e => e.type === 'RATE_DEVIATION')) {
        rangeDeviationsCount++;
      }
      if (result.errors.some(e => e.type === 'INVALID_UOM')) {
        invalidUomCount++;
      }
    }

    // Accumulate product average rates analytics
    if (row.product) {
      const prodKey = row.product.trim();
      if (!averageRatesByProduct[prodKey]) {
        averageRatesByProduct[prodKey] = { totalGross: 0, totalQty: 0, avgRate: 0, count: 0 };
      }
      const gross = Number(row.grossAmount) || (Number(row.quantity) * Number(row.unitRate)) || 0;
      const qty = Number(row.quantity) || 1;
      averageRatesByProduct[prodKey].totalGross += gross;
      averageRatesByProduct[prodKey].totalQty += qty;
      averageRatesByProduct[prodKey].count++;
      averageRatesByProduct[prodKey].avgRate = averageRatesByProduct[prodKey].totalGross / (averageRatesByProduct[prodKey].totalQty || 1);
    }

    return result;
  });

  const totalRows = rows.length;
  const compliancePercentage = totalRows > 0 
    ? Number((((totalRows - errorRowsCount) / totalRows) * 100).toFixed(1))
    : 100;

  const productAverageRatesCount = Object.keys(averageRatesByProduct).length;

  const summary: AuditSummary = {
    totalRows,
    validRows: validRowsCount,
    errorRows: errorRowsCount,
    salesLedgerMismatchCount,
    rangeDeviationsCount,
    invalidUomCount,
    compliancePercentage,
    productAverageRatesCount,
    averageRatesByProduct
  };

  return { results, summary };
}
