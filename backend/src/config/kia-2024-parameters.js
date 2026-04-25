export const KIA_2024_CODES = {
  WEIGHT_FOR_AGE: {
    SEVERELY_UNDERWEIGHT: 'SK',
    UNDERWEIGHT: 'K',
    NORMAL: 'N',
    RISK_OVERWEIGHT: 'RBBL',
  },
  HEIGHT_FOR_AGE: {
    SEVERELY_STUNTED: 'SP',
    STUNTED: 'P',
    NORMAL: 'N',
    TALL: 'Ti',
  },
  WEIGHT_FOR_HEIGHT: {
    SEVERELY_WASTED: 'GB',
    WASTED: 'GK',
    NORMAL: 'GN',
    POSSIBLE_OVERWEIGHT: 'RGL',
    OVERWEIGHT: 'GL',
    OBESE: 'O',
  },
  HEAD_CIRCUMFERENCE_FOR_AGE: {
    MICROCEPHALY: 'Mi',
    NORMAL: 'N',
    MACROCEPHALY: 'Ma',
  },
  MUAC: {
    GROWTH_RISK: 'BHP',
    SEVERELY_WASTED: 'GB',
    WASTED: 'GK',
    NORMAL: 'N',
  },
};

export const KIA_2024_LABELS = {
  SK: 'Berat badan sangat kurang',
  K: 'Berat badan kurang',
  RBBL: 'Risiko berat badan lebih',
  SP: 'Sangat pendek',
  P: 'Pendek',
  Ti: 'Tinggi',
  GB: 'Gizi buruk',
  GK: 'Gizi kurang',
  GN: 'Gizi normal',
  RGL: 'Berisiko gizi lebih',
  GL: 'Gizi lebih',
  O: 'Obesitas',
  Mi: 'Mikrosefali',
  Ma: 'Makrosefali',
  BHP: 'Berisiko hambatan pertumbuhan',
  N: 'Normal',
};

export const KIA_2024_MUAC = {
  underSixMonths: {
    growthRiskMax: 10.99,
  },
  sixMonthsAndAbove: {
    severeMax: 11.49,
    moderateMax: 12.4,
  },
};

