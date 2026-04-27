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
