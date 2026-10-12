import { TransactionRow } from './types';

export function generateSampleJewelleryData(count: number = 1097): TransactionRow[] {
  const parties = [
    'SURAJ JEWELLERS', 'MALABAR GOLD & DIAMONDS', 'KHANA JEWELLERS',
    'Tanishq Jewellery Ltd', 'Kalyan Jewellers', 'PC Chandra Jewellers',
    'PNG Jewellers', 'Bhimji Zaveri', 'GRT Jewellers', 'Joyalukkas India'
  ];

  const salesAccounts = [
    'Gold Account – G14', 'Gold Account – G18', 'Gold Account – G22',
    'Gold Account – GJ', 'Gold Account – G24', 'Silver Account – S1',
    'Jewel Account – D1', 'Jewel Account – CS', 'Jewel Account – EM',
    'Jewel Account – P1', 'Jewel Account – RU'
  ];

  const productsAndRules = [
    { prod: 'DL RA 20', account: 'Jewel Account – D1', defaultUom: 'Carats', baseRate: 20 },
    { prod: 'DL RC 30', account: 'Jewel Account – D1', defaultUom: 'Carats', baseRate: 30 },
    { prod: 'Emeralds JEM 1000', account: 'Jewel Account – EM', defaultUom: 'Carats', baseRate: 1000 },
    { prod: 'Emeralds JEM 150', account: 'Jewel Account – EM', defaultUom: 'Carats', baseRate: 150 },
    { prod: 'Ornament G18', account: 'Gold Account – G18', defaultUom: 'Grams', baseRate: 11900 },
    { prod: 'Ornament G22', account: 'Gold Account – G22', defaultUom: 'Grams', baseRate: 14800 },
    { prod: 'Cust Ornament G22', account: 'Gold Account – G22', defaultUom: 'Grams', baseRate: 14750 },
    { prod: 'Ornament G14', account: 'Gold Account – G14', defaultUom: 'Grams', baseRate: 9200 },
    { prod: 'Articles S1', account: 'Silver Account – S1', defaultUom: 'Grams', baseRate: 185 },
    { prod: 'Ruby RU7700', account: 'Jewel Account – RU', defaultUom: 'Carats', baseRate: 7700 },
    { prod: 'Pearls P1', account: 'Jewel Account – P1', defaultUom: 'Grams', baseRate: 850 },
    { prod: 'Std Gold G24', account: 'Gold Account – G24', defaultUom: 'Grams', baseRate: 15850 }
  ];

  const rows: TransactionRow[] = [];

  for (let i = 1; i <= count; i++) {
    const item = productsAndRules[i % productsAndRules.length];
    const party = parties[i % parties.length];
    
    // Inject realistic audit exception probability
    // 25% error rate overall to mimic enterprise audit runs
    const isRateDeviation = (i % 4 === 0) || (i % 7 === 0);
    const isInvalidUom = i % 210 === 0; // occasional UOM mismatch
    const isAccountMismatch = i % 350 === 0; // occasional account mismatch

    let account = item.account;
    if (isAccountMismatch) {
      account = salesAccounts[(i + 3) % salesAccounts.length]; // mismatched account
    }

    let uom = item.defaultUom;
    if (isInvalidUom) {
      uom = item.defaultUom === 'Grams' ? 'Carats' : 'Grams';
    }

    let unitRate = item.baseRate;
    if (isRateDeviation) {
      // Create rate below min or above max
      if (i % 2 === 0) {
        unitRate = Math.round(item.baseRate * 0.45); // Below allowed range
      } else {
        unitRate = Math.round(item.baseRate * 1.85); // Above allowed range
      }
    } else {
      // Normal variation within allowed limits
      unitRate = Math.round(item.baseRate * (0.95 + (i % 10) * 0.01));
    }

    const qty = parseFloat((0.1 + (i % 25) * 0.4).toFixed(3));
    const grossAmount = Math.round(qty * unitRate);
    const gstAmount = Math.round(grossAmount * 0.03);
    const netAmount = grossAmount + gstAmount;

    const voucherNum = 1400 + (i % 4000);
    const dateStr = new Date(2025, (i % 12), 1 + (i % 28)).toISOString();

    rows.push({
      sNo: 15000 + i,
      date: dateStr,
      voucherNo: `Jh/2526/${voucherNum}`,
      partyName: party,
      salesAccount: account,
      otherAccount: 'Cash / Bank',
      product: item.prod,
      uom,
      quantity: qty,
      freeQuantity: 0,
      unitRate,
      grossAmount,
      cgst: Math.round(gstAmount / 2),
      sgst: Math.round(gstAmount / 2),
      igst: 0,
      gstAmount,
      netAmount,
      manualGrossWt: qty,
      autoGrossWt: qty,
      diffGrossWt: 0,
      pan: 'ABCDE1234F',
      addressProof: 'Aadhaar',
      address: 'Mumbai, India'
    });
  }

  return rows;
}
