<script setup lang="ts">
import {
  CategoryScale,
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
import { formatDate } from '../../utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps<{
  items: Array<{
    examDate: string;
    ageInMonths: number;
    weight: number;
    height: number;
    idealWeight?: number | null;
    idealWeightMin?: number | null;
    idealWeightMax?: number | null;
    idealHeight?: number | null;
    idealHeightMin?: number | null;
    idealHeightMax?: number | null;
  }>;
}>();

const rows = computed(() => [...props.items].reverse());
const formatValue = (value?: number | null) => (typeof value === 'number' ? value.toFixed(1) : '-');

const data = computed(() => {
  const labels = rows.value.map((item) => `${formatDate(item.examDate)} • ${item.ageInMonths} bln`);
  return {
    labels,
    datasets: [
      {
        label: 'BB aktual (kg)',
        data: rows.value.map((item) => item.weight),
        yAxisID: 'yWeight',
        borderColor: '#4f9b86',
        backgroundColor: 'rgba(79, 155, 134, 0.15)',
        pointRadius: 2.5,
        tension: 0.3,
      },
      {
        label: 'BB ideal median (kg)',
        data: rows.value.map((item) => item.idealWeight ?? null),
        yAxisID: 'yWeight',
        borderColor: '#8cc6b5',
        backgroundColor: 'rgba(140, 198, 181, 0.1)',
        borderDash: [6, 4],
        pointRadius: 1.8,
        tension: 0.3,
      },
      {
        label: 'TB/PB aktual (cm)',
        data: rows.value.map((item) => item.height),
        yAxisID: 'yHeight',
        borderColor: '#e7a84f',
        backgroundColor: 'rgba(231, 168, 79, 0.16)',
        pointRadius: 2.5,
        tension: 0.3,
      },
      {
        label: 'TB/PB ideal median (cm)',
        data: rows.value.map((item) => item.idealHeight ?? null),
        yAxisID: 'yHeight',
        borderColor: '#f3c988',
        backgroundColor: 'rgba(243, 201, 136, 0.1)',
        borderDash: [6, 4],
        pointRadius: 1.8,
        tension: 0.3,
      },
    ],
  };
});

const options = computed(
  () =>
    ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        tooltip: {
          callbacks: {
            afterBody(context: Array<{ dataIndex: number }>) {
              const row = rows.value[context[0]?.dataIndex ?? -1];
              if (!row) return [];
              return [
                `Umur: ${row.ageInMonths} bulan`,
                `BB ideal: ${formatValue(row.idealWeight)} kg (rentang ${formatValue(row.idealWeightMin)} - ${formatValue(row.idealWeightMax)})`,
                `TB/PB ideal: ${formatValue(row.idealHeight)} cm (rentang ${formatValue(row.idealHeightMin)} - ${formatValue(row.idealHeightMax)})`,
              ];
            },
          },
        },
      },
      scales: {
        yWeight: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Berat badan (kg)',
          },
        },
        yHeight: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Tinggi/Panjang badan (cm)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    }) as const,
);

const latest = computed(() => {
  if (!rows.value.length) return null;
  return rows.value[rows.value.length - 1];
});
</script>

<template>
  <div style="height: 290px">
    <Line :data="data" :options="options" />
  </div>
  <p v-if="latest" class="muted-text" style="margin-top: 10px">
    Umur terakhir {{ latest.ageInMonths }} bulan.
    BB {{ formatValue(latest.weight) }} kg (ideal {{ formatValue(latest.idealWeight) }} kg),
    TB/PB {{ formatValue(latest.height) }} cm (ideal {{ formatValue(latest.idealHeight) }} cm).
  </p>
</template>

