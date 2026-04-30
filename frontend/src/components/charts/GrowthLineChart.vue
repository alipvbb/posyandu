<script setup lang="ts">
import {
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { computed } from 'vue';
import { buildKiaGrowthReference, type GenderReference } from '../../utils/kia-growth-reference';

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ChartItem = {
  examDate: string;
  ageInMonths: number;
  weight: number;
  height: number;
  genderReference?: 'MALE' | 'FEMALE' | null;
};

const props = defineProps<{
  items: ChartItem[];
  gender?: string | null;
}>();

const normalizeGender = (value?: string | null): GenderReference => {
  if (!value) return 'MALE';
  const normalized = String(value).toUpperCase();
  if (['FEMALE', 'PEREMPUAN', 'P', 'L/P'].includes(normalized)) return 'FEMALE';
  return 'MALE';
};

const rows = computed(() =>
  [...props.items]
    .filter((item) => Number.isFinite(item.ageInMonths))
    .sort((a, b) => a.ageInMonths - b.ageInMonths || new Date(a.examDate).getTime() - new Date(b.examDate).getTime()),
);

const resolvedGender = computed<GenderReference>(() => {
  if (props.gender) return normalizeGender(props.gender);
  const itemGender = rows.value.find((item) => item.genderReference)?.genderReference;
  return normalizeGender(itemGender);
});

const chartMaxAge = computed(() => {
  const latestAge = rows.value.length ? rows.value[rows.value.length - 1].ageInMonths : 24;
  const rounded = Math.ceil(Math.max(24, latestAge) / 6) * 6;
  return Math.min(59, rounded);
});

const chartDisplayMaxAge = computed(() => {
  if (!rows.value.length) return chartMaxAge.value;
  const latestAge = Number(rows.value[rows.value.length - 1].ageInMonths || 0);
  const needExtraRightSpace = latestAge >= chartMaxAge.value - 0.15;
  if (!needExtraRightSpace) return chartMaxAge.value;
  return Math.min(59, chartMaxAge.value + 1);
});

const referenceRows = computed(() => buildKiaGrowthReference(resolvedGender.value, chartMaxAge.value));

const referenceLineColor = {
  minus3: '#2f343a',
  minus2: '#5b6168',
  minus1: '#f0b968',
  median: '#58a26f',
  plus1: '#de5f5f',
  plus2: '#5b6168',
  plus3: '#2f343a',
};

const mapPoints = (field: keyof ChartItem) =>
  rows.value.map((item) => ({
    x: Number(item.ageInMonths),
    y: Number(item[field] as number),
  }));

const mapReference = (field: keyof (typeof referenceRows.value)[number]) =>
  referenceRows.value.map((row) => ({
    x: row.ageInMonths,
    y: Number(row[field] as number),
  }));

const createReferenceDataset = (label: string, field: keyof (typeof referenceRows.value)[number], color: string, dash: number[] = []) => ({
  label,
  data: mapReference(field),
  borderColor: color,
  backgroundColor: color,
  borderWidth: 1.1,
  borderDash: dash,
  pointRadius: 0,
  tension: 0.22,
});

const calcBounds = (
  values: number[],
  fallback: { min: number; max: number },
  padding: { min: number; max: number },
) => {
  if (!values.length) return fallback;
  return {
    min: Math.max(0, Math.floor(Math.min(...values) - padding.min)),
    max: Math.ceil(Math.max(...values) + padding.max),
  };
};

const weightBounds = computed(() => {
  const referenceValues = referenceRows.value.flatMap((row) => [
    row.weightMinus3Sd,
    row.weightMinus2Sd,
    row.weightMinus1Sd,
    row.weightMedian,
    row.weightPlus1Sd,
    row.weightPlus2Sd,
    row.weightPlus3Sd,
  ]);
  const actualValues = rows.value.map((item) => Number(item.weight));
  return calcBounds([...referenceValues, ...actualValues], { min: 0, max: 20 }, { min: 0.8, max: 0.8 });
});

const heightBounds = computed(() => {
  const referenceValues = referenceRows.value.flatMap((row) => [
    row.heightMinus3Sd,
    row.heightMinus2Sd,
    row.heightMinus1Sd,
    row.heightMedian,
    row.heightPlus1Sd,
    row.heightPlus2Sd,
    row.heightPlus3Sd,
  ]);
  const actualValues = rows.value.map((item) => Number(item.height));
  return calcBounds([...referenceValues, ...actualValues], { min: 40, max: 120 }, { min: 2.5, max: 2.5 });
});

const buildCommonOptions = (yLabel: string, yBounds: { min: number; max: number }) =>
  ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 12,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 6,
          font: {
            size: 11,
          },
          filter(item: { text?: string }) {
            const allowed = [
              'Balita',
              'Median',
              '-2 SD',
              '+1 SD',
              '-3 SD',
              '-1 SD',
              '+2 SD',
              '+3 SD',
            ];
            return allowed.includes(item.text || '');
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        min: 0,
        max: chartDisplayMaxAge.value,
        title: {
          display: true,
          text: 'Umur (bulan)',
        },
        ticks: {
          stepSize: 1,
          callback(value: string | number) {
            const numericValue = Number(value);
            return numericValue % 2 === 0 ? numericValue : '';
          },
          maxRotation: 0,
          autoSkip: false,
        },
        grid: {
          color: (ctx: { tick: { value: number } }) =>
            Number(ctx.tick.value) % 6 === 0 ? 'rgba(112, 122, 128, 0.28)' : 'rgba(112, 122, 128, 0.12)',
        },
      },
      y: {
        min: yBounds.min,
        max: yBounds.max,
        title: {
          display: true,
          text: yLabel,
        },
        ticks: {
          callback(value: string | number) {
            return Number(value).toFixed(0);
          },
        },
        grid: {
          color: 'rgba(112, 122, 128, 0.2)',
        },
      },
    },
  }) as const;

const weightData = computed(() => ({
  datasets: [
    createReferenceDataset('-3 SD', 'weightMinus3Sd', referenceLineColor.minus3),
    createReferenceDataset('-2 SD', 'weightMinus2Sd', referenceLineColor.minus2),
    createReferenceDataset('-1 SD', 'weightMinus1Sd', referenceLineColor.minus1),
    createReferenceDataset('Median', 'weightMedian', referenceLineColor.median),
    createReferenceDataset('+1 SD', 'weightPlus1Sd', referenceLineColor.plus1),
    createReferenceDataset('+2 SD', 'weightPlus2Sd', referenceLineColor.plus2),
    createReferenceDataset('+3 SD', 'weightPlus3Sd', referenceLineColor.plus3),
    {
      label: 'Balita',
      data: mapPoints('weight'),
      borderColor: '#3f74c9',
      backgroundColor: '#3f74c9',
      borderWidth: 2,
      clip: false as const,
      pointRadius(context: { dataIndex: number; dataset: { data: unknown[] } }) {
        const isLatest = context.dataIndex === context.dataset.data.length - 1;
        return isLatest ? 5 : 3;
      },
      pointHoverRadius(context: { dataIndex: number; dataset: { data: unknown[] } }) {
        const isLatest = context.dataIndex === context.dataset.data.length - 1;
        return isLatest ? 6 : 4;
      },
      pointBorderColor(context: { dataIndex: number; dataset: { data: unknown[] } }) {
        const isLatest = context.dataIndex === context.dataset.data.length - 1;
        return isLatest ? '#ffffff' : '#3f74c9';
      },
      pointBorderWidth(context: { dataIndex: number; dataset: { data: unknown[] } }) {
        const isLatest = context.dataIndex === context.dataset.data.length - 1;
        return isLatest ? 2 : 1;
      },
      tension: 0.28,
    },
  ],
}));

const heightData = computed(() => ({
  datasets: [
    createReferenceDataset('-3 SD', 'heightMinus3Sd', referenceLineColor.minus3),
    createReferenceDataset('-2 SD', 'heightMinus2Sd', referenceLineColor.minus2),
    createReferenceDataset('-1 SD', 'heightMinus1Sd', referenceLineColor.minus1),
    createReferenceDataset('Median', 'heightMedian', referenceLineColor.median),
    createReferenceDataset('+1 SD', 'heightPlus1Sd', referenceLineColor.plus1),
    createReferenceDataset('+2 SD', 'heightPlus2Sd', referenceLineColor.plus2, [5, 3]),
    createReferenceDataset('+3 SD', 'heightPlus3Sd', referenceLineColor.plus3, [2, 2]),
    {
      label: 'Balita',
      data: mapPoints('height'),
      borderColor: '#3f74c9',
      backgroundColor: '#3f74c9',
      borderWidth: 2,
      clip: false as const,
      pointRadius(context: { dataIndex: number; dataset: { data: unknown[] } }) {
        const isLatest = context.dataIndex === context.dataset.data.length - 1;
        return isLatest ? 5 : 3;
      },
      pointHoverRadius(context: { dataIndex: number; dataset: { data: unknown[] } }) {
        const isLatest = context.dataIndex === context.dataset.data.length - 1;
        return isLatest ? 6 : 4;
      },
      pointBorderColor(context: { dataIndex: number; dataset: { data: unknown[] } }) {
        const isLatest = context.dataIndex === context.dataset.data.length - 1;
        return isLatest ? '#ffffff' : '#3f74c9';
      },
      pointBorderWidth(context: { dataIndex: number; dataset: { data: unknown[] } }) {
        const isLatest = context.dataIndex === context.dataset.data.length - 1;
        return isLatest ? 2 : 1;
      },
      tension: 0.28,
    },
  ],
}));

const weightOptions = computed(() => buildCommonOptions('Berat badan (kg)', weightBounds.value));
const heightOptions = computed(() => buildCommonOptions('Tinggi/Panjang badan (cm)', heightBounds.value));

const latest = computed(() => (rows.value.length ? rows.value[rows.value.length - 1] : null));
</script>

<template>
  <div class="kia-growth-chart">
    <div class="kia-growth-meta">
      <small class="muted-text">
        Acuan KIA per gender: {{ resolvedGender === 'MALE' ? 'Laki-laki' : 'Perempuan' }} • rentang umur 0-{{ chartMaxAge }} bulan
      </small>
    </div>

    <div class="kia-chart-card">
      <strong>Grafik BB/U (KIA)</strong>
      <div class="kia-chart-canvas">
        <Line :data="weightData" :options="weightOptions" />
      </div>
    </div>

    <div class="kia-chart-card">
      <strong>Grafik TB/PB/U (KIA)</strong>
      <div class="kia-chart-canvas">
        <Line :data="heightData" :options="heightOptions" />
      </div>
    </div>

    <p v-if="latest" class="muted-text kia-growth-note">
      Data terakhir: umur {{ latest.ageInMonths }} bulan, BB {{ Number(latest.weight).toFixed(1) }} kg, TB/PB
      {{ Number(latest.height).toFixed(1) }} cm.
    </p>
  </div>
</template>

<style scoped>
.kia-growth-chart {
  display: grid;
  gap: 10px;
}

.kia-growth-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kia-chart-card {
  border: 1px solid rgba(80, 96, 106, 0.2);
  border-radius: 14px;
  padding: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 251, 249, 0.96));
}

.kia-chart-canvas {
  margin-top: 8px;
  height: 290px;
}

.kia-growth-note {
  margin: 0;
}

@media (max-width: 480px) {
  .kia-chart-card {
    border-radius: 12px;
    padding: 8px;
  }

  .kia-chart-canvas {
    height: 260px;
  }
}
</style>
