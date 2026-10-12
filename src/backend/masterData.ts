import { GoldSilverRateRange, AccountProductMappingRule, RateMasterEntry } from './types';

// Default Gold & Silver Rates (As shown on Gold & Silver Rates configuration screen)
export const DEFAULT_GOLD_SILVER_RATES: GoldSilverRateRange[] = [
  {
    id: 'g14',
    product: 'Gold Ornaments 14K',
    productKey: 'Ornament G14',
    minRate: 8740,
    maxRate: 10000,
    allowedMinRate: Math.round(8740 * 0.85), // 7429
    allowedMaxRate: Math.round(10000 * 1.15) // 11500
  },
  {
    id: 'g18',
    product: 'Gold Ornaments 18K',
    productKey: 'Ornament G18',
    minRate: 11800,
    maxRate: 12000,
    allowedMinRate: Math.round(11800 * 0.85), // 10030
    allowedMaxRate: Math.round(12000 * 1.15) // 13800
  },
  {
    id: 'cg18',
    product: 'Customer Gold Ornaments 18K',
    productKey: 'Cust Ornament G18',
    minRate: 11800,
    maxRate: 12000,
    allowedMinRate: Math.round(11800 * 0.85),
    allowedMaxRate: Math.round(12000 * 1.15)
  },
  {
    id: 'cg22',
    product: 'Customer Gold Ornaments 22K',
    productKey: 'Cust Ornament G22',
    minRate: 14500,
    maxRate: 15000,
    allowedMinRate: Math.round(14500 * 0.85), // 12325
    allowedMaxRate: Math.round(15000 * 1.15) // 17250
  },
  {
    id: 'g22',
    product: 'Gold Ornaments 22K',
    productKey: 'Ornament G22',
    minRate: 14500,
    maxRate: 15000,
    allowedMinRate: Math.round(14500 * 0.85),
    allowedMaxRate: Math.round(15000 * 1.15)
  },
  {
    id: 'gj',
    product: 'Gold Ornaments Jadau',
    productKey: 'Ornament GJ',
    minRate: 14500,
    maxRate: 14999,
    allowedMinRate: Math.round(14500 * 0.85),
    allowedMaxRate: Math.round(14999 * 1.15)
  },
  {
    id: 'g24',
    product: 'Standard Gold 24K',
    productKey: 'Std Gold G24',
    minRate: 15700,
    maxRate: 16000,
    allowedMinRate: Math.round(15700 * 0.85), // 13345
    allowedMaxRate: Math.round(16000 * 1.15) // 18400
  },
  {
    id: 's1',
    product: 'Silver articles',
    productKey: 'Articles S1',
    minRate: 170,
    maxRate: 200,
    allowedMinRate: Math.round(170 * 0.85), // 145
    allowedMaxRate: Math.round(200 * 1.15) // 230
  }
];

let activeGoldSilverRates: GoldSilverRateRange[] = [...DEFAULT_GOLD_SILVER_RATES];

export function getActiveGoldSilverRates(): GoldSilverRateRange[] {
  return activeGoldSilverRates;
}

export function setActiveGoldSilverRates(rates: GoldSilverRateRange[]) {
  activeGoldSilverRates = rates.map(r => {
    const min = Number(r.minRate) || 0;
    const max = Number(r.maxRate) || 0;
    return {
      ...r,
      minRate: min,
      maxRate: max,
      allowedMinRate: Math.round(min * 0.85),
      allowedMaxRate: Math.round(max * 1.15)
    };
  });
}

// Account vs Product Master Mapping (from master mapping account vs product.csv)
export const ACCOUNT_PRODUCT_MAPPING_RULES: AccountProductMappingRule[] = [
  {
    accountName: 'Gold Account – G14',
    allowedProducts: ['Ornament G14'],
    allowedPatterns: ['^Ornament G14', '^Ornament G14.*']
  },
  {
    accountName: 'Gold Account – G18',
    allowedProducts: ['Ornament G18', 'Cust Ornament G18'],
    allowedPatterns: ['^Ornament G18', '^Cust Ornament G18']
  },
  {
    accountName: 'Gold Account – G22',
    allowedProducts: [
      'Ornament G22',
      'Cust Ornament G22',
      'Beads B1',
      'Dori D1',
      'Lac L1',
      'Wax W1',
      'Kundan K1',
      'Nail N1'
    ],
    allowedPatterns: ['^Ornament G22', '^Cust Ornament G22', 'Kundan K1']
  },
  {
    accountName: 'Gold Account – GJ',
    allowedProducts: ['Ornament GJ'],
    allowedPatterns: ['^Ornament GJ']
  },
  {
    accountName: 'Gold Account – G24',
    allowedProducts: ['Std Gold G24'],
    allowedPatterns: ['^Std Gold G24']
  },
  {
    accountName: 'Silver Account – S1',
    allowedProducts: ['Articles S1'],
    allowedPatterns: ['^Articles S1', '^Silver.*']
  },
  {
    accountName: 'Jewel Account – D1',
    allowedProducts: [
      'Chakri C1',
      'Cust Diamond D1',
      'Cust Polki P1',
      'SDX. MIX',
      'Loose SDX. MIX',
      'Polki PA'
    ],
    allowedPatterns: [
      '^Chakri C1',
      '^Cust Diamond',
      '^Cust Polki',
      '^DX\\.',
      '^SDX\\.',
      '^Loose DX\\.',
      '^Loose SDX\\.',
      '^Polki',
      '^DL R[AC]',
      '^DL '
    ]
  },
  {
    accountName: 'Jewel Account – CS',
    allowedProducts: [
      'Cust Stone S1',
      'Synth S100',
      'Synth S300'
    ],
    allowedPatterns: [
      '^Cust Stone',
      '^Stone PS\\d+',
      '^Loose PS\\d+',
      '^Semi SP\\d+',
      '^Synth SY\\d+',
      '^Synth S\\d+'
    ]
  },
  {
    accountName: 'Jewel Account – EM',
    allowedProducts: [
      'Cust Emerald EM1',
      'Emerald EMX',
      'Emerald EM5900'
    ],
    allowedPatterns: [
      '^Cust Emerald',
      '^Emerald EM\\d+',
      '^Emeralds JEM\\d+',
      '^Emeralds JEM',
      '^Loose EM\\d+',
      '^Emerald '
    ]
  },
  {
    accountName: 'Jewel Account – P1',
    allowedProducts: ['Cust Pearl P1'],
    allowedPatterns: ['^Cust Pearl', '^Pearls P\\d+', '^Pearls ']
  },
  {
    accountName: 'Jewel Account – RU',
    allowedProducts: [
      'Cust Ruby RU1',
      'Ruby RUX',
      'Ruby RU7700'
    ],
    allowedPatterns: [
      '^Cust Ruby',
      '^Ruby RU\\d+',
      '^Loose RU\\d+',
      '^Ruby '
    ]
  }
];
