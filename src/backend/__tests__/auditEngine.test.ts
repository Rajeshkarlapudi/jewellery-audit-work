import assert from 'node:assert/strict';
import { auditRow, validateUOM, validateRate, validateAccountProduct } from '../auditEngine';
import { TransactionRow } from '../types';

const row = (o: Partial<TransactionRow>): TransactionRow => ({
  sNo: 1, date: '2025-07-23', voucherNo: 'V1', partyName: 'P', salesAccount: 'Gold Account – G22',
  product: 'Ornament G22', uom: 'Grams', quantity: 10, unitRate: 14800, grossAmount: 148000, ...o,
});

const tests: [string, () => void][] = [
  ['1. valid gold transaction', () => {
    assert.equal(auditRow(row({}), '1').status, 'VALID');
  }],
  ['2. gold rate deviation detected', () => {
    const r = auditRow(row({ unitRate: 9000 }), '1');
    assert.equal(r.status, 'ERROR');
    assert.equal(r.errors[0].message, 'Rate below allowed range');
    assert.equal(auditRow(row({ unitRate: 17251 }), '1').errors[0].message, 'Rate above allowed range');
  }],
  ['3. valid silver transaction', () => {
    const r = auditRow(row({ salesAccount: 'Silver Account – S1', product: 'Articles S1', unitRate: 180 }), '1');
    assert.equal(r.status, 'VALID');
  }],
  ['4. invalid UOM detected', () => {
    const r = auditRow(row({ uom: 'Carats' }), '1');
    assert.ok(r.errors.some(e => e.type === 'INVALID_UOM'));
  }],
  ['5. invalid sales account / product mismatch', () => {
    assert.equal(validateAccountProduct('Gold Account – G14', 'Ornament G22').isValid, false);
    assert.equal(validateAccountProduct('Gold Account – G22', 'Beads B1').isValid, true);
  }],
  ['6. emerald rate validation (master base ±15%)', () => {
    // Emerald EM1500 base 1500 -> 1275..1725
    assert.equal(validateRate('Ruby RU1500', 1300, 'Jewel Account – RU').isValid, true);
    assert.equal(validateRate('Ruby RU1500', 1200, 'Jewel Account – RU').isValid, false);
  }],
  ['7. ruby UOM classification is CARATS', () => {
    assert.equal(validateUOM('Ruby RU1500', 'Carats').isValid, true);
    assert.equal(validateUOM('Ruby RU1500', 'Grams').expectedUom, 'CARATS');
  }],
  ['8. diamond 25% uplift from rate master', () => {
    // DX. R10 base 10000–15000 -> min 10000*1.25*0.85=10625, max 15000*1.25*1.15=21562.5
    const lo = validateRate('DX. R10', 10000, 'Jewel Account – D1');
    assert.equal(lo.isValid, false);
    assert.equal(lo.minAllowed, 10625);
    assert.equal(validateRate('DX. R10', 10700, 'Jewel Account – D1').isValid, true);
    assert.equal(validateRate('DX. R10', 21563, 'Jewel Account – D1').isValid, false);
  }],
  ['9. multiple errors per transaction', () => {
    const r = auditRow(row({ salesAccount: 'Gold Account – G14', uom: 'Carats', unitRate: 5000 }), '1');
    assert.equal(r.errors.length, 3);
  }],
  ['10. fixed-range products (Beads B1 0–1)', () => {
    assert.equal(validateRate('Dori D1', 0.5, 'Gold Account – G22').isValid, true);
    assert.equal(validateRate('Dori D1', 5, 'Gold Account – G22').isValid, false);
  }],
];

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log('PASS', name); } catch (e: any) { failed++; console.log('FAIL', name, '-', e.message); }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
