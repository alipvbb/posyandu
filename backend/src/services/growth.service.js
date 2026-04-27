import dayjs from 'dayjs';
import {
  getKmsReferenceByAge,
  getRiskThresholdByGender,
  listKmsReferenceByGender,
  normalizeGender,
} from '../config/kms-reference.js';
import { KIA_2024_CODES, KIA_2024_LABELS, KIA_2024_MUAC } from '../config/kia-2024-parameters.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const calculateAgeInMonths = (birthDate, examDate = new Date()) => {
  const start = dayjs(birthDate);
  const end = dayjs(examDate);
  const raw = end.diff(start, 'month', true);
  return clamp(Math.round(raw), 0, 59);
};

export const expectedWeightByAge = (ageInMonths, gender = 'MALE') =>
  getKmsReferenceByAge({ ageInMonths, gender }).weightMedian;

export const expectedHeightByAge = (ageInMonths, gender = 'MALE') =>
  getKmsReferenceByAge({ ageInMonths, gender }).heightMedian;

export const expectedHeadCircumferenceByAge = (ageInMonths, gender = 'MALE') =>
  getKmsReferenceByAge({ ageInMonths, gender }).headCircumferenceMedian;

export const expectedMuacByAge = (ageInMonths, gender = 'MALE') => getKmsReferenceByAge({ ageInMonths, gender }).muacMedian;

const toOneDecimal = (value) => Number(value.toFixed(1));

const zScoreFromCustomBands = (value, median, minus2, plus1) => {
  if (!Number.isFinite(value) || !Number.isFinite(median) || !Number.isFinite(minus2) || !Number.isFinite(plus1)) return 0;
  const belowSd = Math.max((median - minus2) / 2, 0.01);
  const aboveSd = Math.max(plus1 - median, 0.01);
  if (value < median) return (value - median) / belowSd;
  return (value - median) / aboveSd;
};

const interpolateByHeight = (gender, heightCm) => {
  const rows = listKmsReferenceByGender(gender);
  if (!rows.length) {
    return { median: 0, minus2: 0, plus1: 0 };
  }

  if (heightCm <= rows[0].heightMedian) {
    return {
      median: rows[0].weightMedian,
      minus2: rows[0].weightMinus2Sd,
      plus1: rows[0].weightPlus1Sd,
    };
  }

  const last = rows[rows.length - 1];
  if (heightCm >= last.heightMedian) {
    return {
      median: last.weightMedian,
      minus2: last.weightMinus2Sd,
      plus1: last.weightPlus1Sd,
    };
  }

  for (let index = 0; index < rows.length - 1; index += 1) {
    const start = rows[index];
    const end = rows[index + 1];
    if (heightCm >= start.heightMedian && heightCm <= end.heightMedian) {
      const ratio = (heightCm - start.heightMedian) / Math.max(end.heightMedian - start.heightMedian, 0.0001);
      const lerp = (a, b) => a + ratio * (b - a);
      return {
        median: lerp(start.weightMedian, end.weightMedian),
        minus2: lerp(start.weightMinus2Sd, end.weightMinus2Sd),
        plus1: lerp(start.weightPlus1Sd, end.weightPlus1Sd),
      };
    }
  }

  return {
    median: last.weightMedian,
    minus2: last.weightMinus2Sd,
    plus1: last.weightPlus1Sd,
  };
};

const classifyWeightForAge = (z) => {
  if (z < -3) return KIA_2024_CODES.WEIGHT_FOR_AGE.SEVERELY_UNDERWEIGHT;
  if (z < -2) return KIA_2024_CODES.WEIGHT_FOR_AGE.UNDERWEIGHT;
  if (z <= 1) return KIA_2024_CODES.WEIGHT_FOR_AGE.NORMAL;
  return KIA_2024_CODES.WEIGHT_FOR_AGE.RISK_OVERWEIGHT;
};

const classifyHeightForAge = (z) => {
  if (z < -3) return KIA_2024_CODES.HEIGHT_FOR_AGE.SEVERELY_STUNTED;
  if (z < -2) return KIA_2024_CODES.HEIGHT_FOR_AGE.STUNTED;
  if (z <= 3) return KIA_2024_CODES.HEIGHT_FOR_AGE.NORMAL;
  return KIA_2024_CODES.HEIGHT_FOR_AGE.TALL;
};

const classifyWeightForHeight = (z) => {
  if (z < -3) return KIA_2024_CODES.WEIGHT_FOR_HEIGHT.SEVERELY_WASTED;
  if (z < -2) return KIA_2024_CODES.WEIGHT_FOR_HEIGHT.WASTED;
  if (z <= 1) return KIA_2024_CODES.WEIGHT_FOR_HEIGHT.NORMAL;
  if (z <= 2) return KIA_2024_CODES.WEIGHT_FOR_HEIGHT.POSSIBLE_OVERWEIGHT;
  if (z <= 3) return KIA_2024_CODES.WEIGHT_FOR_HEIGHT.OVERWEIGHT;
  return KIA_2024_CODES.WEIGHT_FOR_HEIGHT.OBESE;
};

const classifyHeadCircumferenceForAge = (value, threshold) => {
  if (!Number.isFinite(value)) return null;
  if (value < threshold.headCircumferenceMicroCutoff) return KIA_2024_CODES.HEAD_CIRCUMFERENCE_FOR_AGE.MICROCEPHALY;
  if (value > threshold.headCircumferenceMacroCutoff) return KIA_2024_CODES.HEAD_CIRCUMFERENCE_FOR_AGE.MACROCEPHALY;
  return KIA_2024_CODES.HEAD_CIRCUMFERENCE_FOR_AGE.NORMAL;
};

const classifyMuac = (ageInMonths, muac) => {
  if (!Number.isFinite(muac)) return null;
  if (ageInMonths < 6) {
    return muac <= KIA_2024_MUAC.underSixMonths.growthRiskMax ? KIA_2024_CODES.MUAC.GROWTH_RISK : KIA_2024_CODES.MUAC.NORMAL;
  }
  if (muac < KIA_2024_MUAC.sixMonthsAndAbove.severeMax) return KIA_2024_CODES.MUAC.SEVERELY_WASTED;
  if (muac <= KIA_2024_MUAC.sixMonthsAndAbove.moderateMax) return KIA_2024_CODES.MUAC.WASTED;
  return KIA_2024_CODES.MUAC.NORMAL;
};

const resolveRiskFromIndicatorCodes = ({
  weightForAgeCode,
  heightForAgeCode,
  weightForHeightCode,
  headCircumferenceForAgeCode,
  muacCode,
}) => {
  const stuntingCodes = new Set([KIA_2024_CODES.HEIGHT_FOR_AGE.SEVERELY_STUNTED, KIA_2024_CODES.HEIGHT_FOR_AGE.STUNTED]);
  const overweightCodes = new Set([KIA_2024_CODES.WEIGHT_FOR_HEIGHT.OVERWEIGHT, KIA_2024_CODES.WEIGHT_FOR_HEIGHT.OBESE]);
  const undernutritionCodes = new Set([
    KIA_2024_CODES.WEIGHT_FOR_HEIGHT.SEVERELY_WASTED,
    KIA_2024_CODES.WEIGHT_FOR_HEIGHT.WASTED,
    KIA_2024_CODES.WEIGHT_FOR_AGE.SEVERELY_UNDERWEIGHT,
    KIA_2024_CODES.WEIGHT_FOR_AGE.UNDERWEIGHT,
    KIA_2024_CODES.MUAC.SEVERELY_WASTED,
    KIA_2024_CODES.MUAC.WASTED,
    KIA_2024_CODES.MUAC.GROWTH_RISK,
  ]);
  const attentionCodes = new Set([
    KIA_2024_CODES.WEIGHT_FOR_HEIGHT.POSSIBLE_OVERWEIGHT,
    KIA_2024_CODES.WEIGHT_FOR_AGE.RISK_OVERWEIGHT,
    KIA_2024_CODES.HEAD_CIRCUMFERENCE_FOR_AGE.MICROCEPHALY,
    KIA_2024_CODES.HEAD_CIRCUMFERENCE_FOR_AGE.MACROCEPHALY,
  ]);

  const allCodes = [weightForAgeCode, heightForAgeCode, weightForHeightCode, headCircumferenceForAgeCode, muacCode].filter(Boolean);

  if (allCodes.some((code) => stuntingCodes.has(code))) {
    return { riskLevel: 'STUNTING_RISK', earlyWarningCodes: [] };
  }
  if (allCodes.some((code) => overweightCodes.has(code))) {
    return { riskLevel: 'OVERWEIGHT', earlyWarningCodes: [] };
  }
  if (allCodes.some((code) => undernutritionCodes.has(code))) {
    return { riskLevel: 'UNDERNUTRITION', earlyWarningCodes: [] };
  }
  const earlyWarningCodes = allCodes.filter((code) => attentionCodes.has(code));
  return { riskLevel: 'NORMAL', earlyWarningCodes };
};

export const evaluateGrowthStatus = ({ toddler, currentCheckup, previousCheckup = null }) => {
  const gender = normalizeGender(toddler.gender || toddler.jenis_kelamin);
  const genderLabel = gender === 'MALE' ? 'laki-laki' : 'perempuan';
  const ageInMonths =
    currentCheckup.ageInMonths ?? calculateAgeInMonths(toddler.birthDate, currentCheckup.examDate);
  const weight = Number(currentCheckup.weight);
  const height = Number(currentCheckup.height);
  const headCircumference =
    currentCheckup.headCircumference === null || currentCheckup.headCircumference === undefined
      ? null
      : Number(currentCheckup.headCircumference);
  const muac =
    currentCheckup.muac === null || currentCheckup.muac === undefined ? null : Number(currentCheckup.muac);
  const reference = getKmsReferenceByAge({ ageInMonths, gender });
  const threshold = getRiskThresholdByGender(gender, ageInMonths);

  const expectedWeight = reference.weightMedian;
  const expectedHeight = reference.heightMedian;
  const weightGap = Number((weight - expectedWeight).toFixed(2));
  const heightGap = Number((height - expectedHeight).toFixed(2));
  const weightDelta = previousCheckup ? Number((weight - Number(previousCheckup.weight)).toFixed(2)) : null;

  const zWeightForAge = zScoreFromCustomBands(weight, reference.weightMedian, reference.weightMinus2Sd, reference.weightPlus1Sd);
  const zHeightForAge = zScoreFromCustomBands(height, reference.heightMedian, reference.heightMinus2Sd, reference.heightPlus1Sd);

  const weightByHeightBands = interpolateByHeight(gender, height);
  const zWeightForHeight = zScoreFromCustomBands(weight, weightByHeightBands.median, weightByHeightBands.minus2, weightByHeightBands.plus1);

  let trend = 'UP';
  if (previousCheckup) {
    if (weightDelta < -0.1) trend = 'DOWN';
    else if (Math.abs(weightDelta) <= 0.1) trend = 'STABLE';
  }

  const weightForAgeCode = classifyWeightForAge(zWeightForAge);
  const heightForAgeCode = classifyHeightForAge(zHeightForAge);
  const weightForHeightCode = classifyWeightForHeight(zWeightForHeight);
  const headCircumferenceForAgeCode = classifyHeadCircumferenceForAge(headCircumference, threshold);
  const muacCode = classifyMuac(ageInMonths, muac);

  const { riskLevel, earlyWarningCodes } = resolveRiskFromIndicatorCodes({
    weightForAgeCode,
    heightForAgeCode,
    weightForHeightCode,
    headCircumferenceForAgeCode,
    muacCode,
  });

  const trendLabel = trend === 'UP' ? 'Berat badan naik' : trend === 'STABLE' ? 'Berat badan tetap' : 'Berat badan turun';
  const riskLabelMap = {
    NORMAL: 'Normal',
    STUNTING_RISK: 'Risiko stunting',
    UNDERNUTRITION: 'Gizi kurang',
    OVERWEIGHT: 'Kelebihan berat badan',
  };
  const hasEarlyWarning = earlyWarningCodes.length > 0;
  const earlyWarningNote = hasEarlyWarning ? ` (indikator risiko awal KIA: ${earlyWarningCodes.join(', ')})` : '';

  const indicators = {
    weightForAge: {
      code: weightForAgeCode,
      label: KIA_2024_LABELS[weightForAgeCode],
    },
    heightForAge: {
      code: heightForAgeCode,
      label: KIA_2024_LABELS[heightForAgeCode],
    },
    weightForHeight: {
      code: weightForHeightCode,
      label: KIA_2024_LABELS[weightForHeightCode],
    },
    headCircumferenceForAge: headCircumferenceForAgeCode
      ? {
          code: headCircumferenceForAgeCode,
          label: KIA_2024_LABELS[headCircumferenceForAgeCode],
        }
      : null,
    muac: muacCode
      ? {
          code: muacCode,
          label: KIA_2024_LABELS[muacCode],
        }
      : null,
  };

  const lengthHeightLabel = ageInMonths < 24 ? 'PB/U' : 'TB/U';
  const weightByLengthHeightLabel = ageInMonths < 24 ? 'BB/PB' : 'BB/TB';

  const indicatorSummary = [
    `BB/U ${indicators.weightForAge.code}`,
    `${lengthHeightLabel} ${indicators.heightForAge.code}`,
    `${weightByLengthHeightLabel} ${indicators.weightForHeight.code}`,
    indicators.headCircumferenceForAge ? `LK/U ${indicators.headCircumferenceForAge.code}` : null,
    indicators.muac ? `LiLA ${indicators.muac.code}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    ageInMonths,
    genderReference: gender,
    genderReferenceLabel: genderLabel,
    trend,
    riskLevel,
    hasEarlyWarning,
    earlyWarningCodes,
    statusLabel: `${trendLabel}, ${riskLabelMap[riskLevel]}${earlyWarningNote} (${indicatorSummary}; acuan ${genderLabel})`,
    summary: `Acuan KIA 2024 (${genderLabel}): ${indicatorSummary}. Kesimpulan ${riskLabelMap[riskLevel].toLowerCase()}${hasEarlyWarning ? ' dengan indikator risiko awal' : ''} dan tren ${trendLabel.toLowerCase()}.`,
    weightDelta,
    weightGap,
    heightGap,
    indicators,
    zScores: {
      weightForAge: toOneDecimal(zWeightForAge),
      heightForAge: toOneDecimal(zHeightForAge),
      weightForHeight: toOneDecimal(zWeightForHeight),
    },
    weightByHeightReference: {
      median: toOneDecimal(weightByHeightBands.median),
      minus2Sd: toOneDecimal(weightByHeightBands.minus2),
      plus1Sd: toOneDecimal(weightByHeightBands.plus1),
    },
  };
};

export const buildGrowthHistorySummary = (checkups = []) => {
  if (!checkups.length) {
    return {
      latestRisk: 'NORMAL',
      latestTrend: 'STABLE',
      totalCheckups: 0,
    };
  }

  const latest = checkups[0];
  return {
    latestRisk: latest.riskLevel,
    latestTrend: latest.growthTrend,
    totalCheckups: checkups.length,
  };
};
