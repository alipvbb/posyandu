import { KMS_REFERENCE_META, KMS_WHO_REFERENCE_TABLE } from './kms-who-reference.data.js';

const MAX_AGE_MONTHS = KMS_REFERENCE_META.maxAgeMonths;

const clampAge = (ageInMonths) => Math.max(0, Math.min(Number(ageInMonths) || 0, MAX_AGE_MONTHS));

export const normalizeGender = (gender) => {
  if (gender === 'FEMALE' || gender === 'PEREMPUAN') return 'FEMALE';
  return 'MALE';
};

export const getKmsReferenceByAge = ({ ageInMonths, gender }) => {
  const normalizedGender = normalizeGender(gender);
  const age = clampAge(ageInMonths);
  return KMS_WHO_REFERENCE_TABLE[normalizedGender][age];
};

export const getRiskThresholdByGender = (gender, ageInMonths) => {
  const reference = getKmsReferenceByAge({ ageInMonths, gender });
  return {
    severelyStuntedHeightCutoff: reference.heightMinus3Sd,
    stuntingHeightCutoff: reference.heightMinus2Sd,
    stuntingAttentionHeightCutoff: reference.heightMinus1Sd,
    veryLowWeightCutoff: reference.weightMinus3Sd,
    undernutritionWeightCutoff: reference.weightMinus2Sd,
    undernutritionAttentionWeightCutoff: reference.weightMinus1Sd,
    overweightAttentionWeightCutoff: reference.weightPlus1Sd,
    overweightWeightCutoff: reference.weightPlus2Sd,
    obesityWeightCutoff: reference.weightPlus3Sd,
    tallCutoff: reference.heightPlus3Sd,
    headCircumferenceMicroCutoff: reference.headCircumferenceMinus2Sd,
    headCircumferenceMacroCutoff: reference.headCircumferencePlus2Sd,
  };
};

export const listKmsReferenceByGender = (gender) => KMS_WHO_REFERENCE_TABLE[normalizeGender(gender)];
