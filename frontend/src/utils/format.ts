export const formatDate = (value?: string | Date | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatNumber = (value?: number | null, fractionDigits = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value);
};

export const genderLabel = (value?: string) => (value === 'MALE' ? 'Laki-laki' : value === 'FEMALE' ? 'Perempuan' : '-');

export const riskLabel = (value?: string) =>
  ({
    NORMAL: 'Normal',
    ATTENTION: 'Normal (indikator risiko awal KIA)',
    STUNTING_RISK: 'Risiko stunting',
    UNDERNUTRITION: 'Gizi kurang',
    OVERWEIGHT: 'Kelebihan berat badan',
  })[value || ''] || '-';

export const formatAgeFromBirthDate = (value?: string | Date | null, referenceDate: Date = new Date()) => {
  if (!value) return '-';
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return '-';

  let totalMonths =
    (referenceDate.getFullYear() - birthDate.getFullYear()) * 12 +
    (referenceDate.getMonth() - birthDate.getMonth());

  if (referenceDate.getDate() < birthDate.getDate()) totalMonths -= 1;
  if (totalMonths < 0) totalMonths = 0;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) return `${months} bulan`;
  if (months === 0) return `${years} tahun`;
  return `${years} tahun ${months} bulan`;
};
