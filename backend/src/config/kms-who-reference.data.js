const MAX_AGE_MONTHS = 59;

const round = (value, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const interpolateFromAnchors = (anchors, ageInMonths) => {
  if (ageInMonths <= anchors[0][0]) return anchors[0][1];
  if (ageInMonths >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const [startMonth, startValue] = anchors[index];
    const [endMonth, endValue] = anchors[index + 1];

    if (ageInMonths >= startMonth && ageInMonths <= endMonth) {
      const ratio = (ageInMonths - startMonth) / (endMonth - startMonth);
      return startValue + ratio * (endValue - startValue);
    }
  }

  return anchors[anchors.length - 1][1];
};

const scaleAnchors = {
  MALE: {
    weightMedian: [
      [0, 3.3],
      [6, 7.9],
      [12, 9.6],
      [24, 12.2],
      [36, 14.3],
      [48, 16.3],
      [59, 18.2],
    ],
    weightMinus2Sd: [
      [0, 2.5],
      [6, 6.4],
      [12, 7.8],
      [24, 10.3],
      [36, 12.0],
      [48, 13.5],
      [59, 14.9],
    ],
    heightMedian: [
      [0, 49.9],
      [6, 67.6],
      [12, 75.7],
      [24, 87.1],
      [36, 95.2],
      [48, 102.9],
      [59, 109.7],
    ],
    heightMinus2Sd: [
      [0, 46.1],
      [6, 63.3],
      [12, 71.0],
      [24, 81.7],
      [36, 89.6],
      [48, 96.9],
      [59, 103.8],
    ],
    headCircumferenceMedian: [
      [0, 34.6],
      [6, 42.5],
      [12, 45.4],
      [24, 48.3],
      [36, 49.7],
      [48, 50.5],
      [59, 51.2],
    ],
    muacMedian: [
      [0, 11.7],
      [6, 13.2],
      [12, 13.8],
      [24, 14.7],
      [36, 15.3],
      [48, 15.7],
      [59, 16.0],
    ],
  },
  FEMALE: {
    weightMedian: [
      [0, 3.1],
      [6, 7.3],
      [12, 8.9],
      [24, 11.5],
      [36, 13.9],
      [48, 15.8],
      [59, 17.5],
    ],
    weightMinus2Sd: [
      [0, 2.4],
      [6, 5.8],
      [12, 7.1],
      [24, 9.5],
      [36, 11.3],
      [48, 12.8],
      [59, 14.1],
    ],
    heightMedian: [
      [0, 49.1],
      [6, 65.7],
      [12, 74.0],
      [24, 85.7],
      [36, 94.0],
      [48, 101.8],
      [59, 108.8],
    ],
    heightMinus2Sd: [
      [0, 45.4],
      [6, 61.2],
      [12, 68.9],
      [24, 80.0],
      [36, 87.4],
      [48, 94.8],
      [59, 101.7],
    ],
    headCircumferenceMedian: [
      [0, 34.0],
      [6, 41.5],
      [12, 44.2],
      [24, 47.3],
      [36, 48.7],
      [48, 49.6],
      [59, 50.4],
    ],
    muacMedian: [
      [0, 11.5],
      [6, 12.9],
      [12, 13.4],
      [24, 14.4],
      [36, 15.0],
      [48, 15.4],
      [59, 15.8],
    ],
  },
};

const KIA_2024_IDEAL_RANGES_0_24 = {
  MALE: {
    weightMin: [2.5, 3.4, 4.3, 5.0, 5.6, 6.0, 6.4, 6.7, 6.9, 7.1, 7.4, 7.6, 7.7, 7.9, 8.1, 8.3, 8.4, 8.6, 8.8, 8.9, 9.1, 9.2, 9.4, 9.5, 9.7],
    weightMax: [3.9, 5.1, 6.3, 7.2, 7.8, 8.4, 8.8, 9.2, 9.6, 9.9, 10.2, 10.5, 10.8, 11.0, 11.3, 11.5, 11.7, 12.0, 12.2, 12.5, 12.7, 12.9, 13.2, 13.4, 13.6],
    heightMin: [46.1, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3, 64.8, 66.2, 67.5, 68.7, 69.9, 71.0, 72.1, 73.1, 74.1, 75.0, 76.0, 76.9, 77.7, 78.6, 79.4, 80.2, 81.0, 81.7],
    heightMax: [51.8, 56.7, 60.4, 63.5, 66.0, 68.0, 69.8, 71.3, 72.8, 74.2, 75.6, 76.9, 78.1, 79.3, 80.5, 81.7, 82.8, 83.9, 85.0, 86.0, 87.0, 88.0, 89.0, 89.9, 90.9],
  },
  FEMALE: {
    weightMin: [2.4, 3.2, 3.9, 4.5, 5.0, 5.4, 5.7, 6.0, 6.3, 6.5, 6.7, 6.9, 7.0, 7.2, 7.4, 7.6, 7.7, 7.9, 8.1, 8.2, 8.4, 8.6, 8.7, 8.9, 9.0],
    weightMax: [3.7, 4.8, 5.8, 6.6, 7.3, 7.8, 8.2, 8.6, 9.0, 9.3, 9.6, 9.9, 10.1, 10.4, 10.6, 10.9, 11.1, 11.4, 11.6, 11.8, 12.1, 12.3, 12.5, 12.8, 13.0],
    heightMin: [45.4, 49.8, 53.0, 55.6, 57.8, 59.6, 61.2, 62.7, 64.0, 65.3, 66.5, 67.7, 68.9, 70.0, 71.0, 72.0, 73.0, 74.0, 74.9, 75.8, 76.7, 77.5, 78.4, 79.2, 80.0],
    heightMax: [51.0, 55.6, 59.1, 61.9, 64.3, 66.2, 68.0, 69.6, 71.1, 72.6, 73.9, 75.3, 76.6, 77.8, 79.1, 80.2, 81.4, 82.5, 83.6, 84.7, 85.7, 86.7, 87.7, 88.7, 89.6],
  },
};

const buildRowsByGender = (gender) =>
  Array.from({ length: MAX_AGE_MONTHS + 1 }).map((_, ageInMonths) => {
    const monthlyRange = KIA_2024_IDEAL_RANGES_0_24[gender];
    const useKiaMonthlyRange = ageInMonths <= 24;

    const fallbackWeightMedian = interpolateFromAnchors(scaleAnchors[gender].weightMedian, ageInMonths);
    const fallbackWeightMinus2Sd = interpolateFromAnchors(scaleAnchors[gender].weightMinus2Sd, ageInMonths);
    const weightMinus2Sd = useKiaMonthlyRange ? monthlyRange.weightMin[ageInMonths] : fallbackWeightMinus2Sd;
    const weightPlus1FromKia = useKiaMonthlyRange ? monthlyRange.weightMax[ageInMonths] : null;
    const weightMedian = useKiaMonthlyRange
      ? weightMinus2Sd + (2 * (weightPlus1FromKia - weightMinus2Sd)) / 3
      : fallbackWeightMedian;

    const weightSpread = weightMedian - weightMinus2Sd;
    const weightSd = weightSpread / 2;
    const weightMinus3Sd = weightMedian - 3 * weightSd;
    const weightMinus1Sd = weightMedian - (weightMedian - weightMinus2Sd) / 2;
    const weightPlus1Sd = useKiaMonthlyRange ? weightPlus1FromKia : weightMedian + weightSd;
    const weightPlus2Sd = weightMedian + 2 * weightSd;
    const weightPlus3Sd = weightMedian + 3 * weightSd;

    const fallbackHeightMedian = interpolateFromAnchors(scaleAnchors[gender].heightMedian, ageInMonths);
    const fallbackHeightMinus2Sd = interpolateFromAnchors(scaleAnchors[gender].heightMinus2Sd, ageInMonths);
    const heightMinus2Sd = useKiaMonthlyRange ? monthlyRange.heightMin[ageInMonths] : fallbackHeightMinus2Sd;
    const heightPlus1FromKia = useKiaMonthlyRange ? monthlyRange.heightMax[ageInMonths] : null;
    const heightMedian = useKiaMonthlyRange
      ? heightMinus2Sd + (2 * (heightPlus1FromKia - heightMinus2Sd)) / 3
      : fallbackHeightMedian;

    const heightSpread = heightMedian - heightMinus2Sd;
    const heightSd = heightSpread / 2;
    const heightMinus3Sd = heightMedian - 3 * heightSd;
    const heightMinus1Sd = heightMedian - (heightMedian - heightMinus2Sd) / 2;
    const heightPlus1Sd = useKiaMonthlyRange ? heightPlus1FromKia : heightMedian + heightSd;
    const heightPlus2Sd = heightMedian + 2 * heightSd;
    const heightPlus3Sd = heightMedian + 3 * heightSd;

    const headCircumferenceMedian = interpolateFromAnchors(scaleAnchors[gender].headCircumferenceMedian, ageInMonths);
    const headCircumferenceSd = ageInMonths <= 12 ? 1.15 : ageInMonths <= 24 ? 1.1 : 1.05;
    const headCircumferenceMinus2Sd = headCircumferenceMedian - 2 * headCircumferenceSd;
    const headCircumferencePlus2Sd = headCircumferenceMedian + 2 * headCircumferenceSd;

    return {
      ageInMonths,
      weightMedian: round(weightMedian),
      weightMinus3Sd: round(weightMinus3Sd),
      weightMinus1Sd: round(weightMinus1Sd),
      weightMinus2Sd: round(weightMinus2Sd),
      weightPlus1Sd: round(weightPlus1Sd),
      weightPlus2Sd: round(weightPlus2Sd),
      weightPlus3Sd: round(weightPlus3Sd),
      heightMedian: round(heightMedian),
      heightMinus3Sd: round(heightMinus3Sd),
      heightMinus1Sd: round(heightMinus1Sd),
      heightMinus2Sd: round(heightMinus2Sd),
      heightPlus1Sd: round(heightPlus1Sd),
      heightPlus2Sd: round(heightPlus2Sd),
      heightPlus3Sd: round(heightPlus3Sd),
      headCircumferenceMedian: round(headCircumferenceMedian),
      headCircumferenceMinus2Sd: round(headCircumferenceMinus2Sd),
      headCircumferencePlus2Sd: round(headCircumferencePlus2Sd),
      muacMedian: round(interpolateFromAnchors(scaleAnchors[gender].muacMedian, ageInMonths)),
    };
  });

export const KMS_WHO_REFERENCE_TABLE = {
  MALE: buildRowsByGender('MALE'),
  FEMALE: buildRowsByGender('FEMALE'),
};

export const KMS_REFERENCE_META = {
  source: 'WHO/KMS-inspired monthly reference (0-59 bulan), maintainable anchor interpolation',
  maxAgeMonths: MAX_AGE_MONTHS,
};
