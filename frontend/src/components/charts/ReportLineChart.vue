<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { computed } from 'vue';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Dataset = {
  label: string;
  values: number[];
  borderColor: string;
  backgroundColor: string;
};

const props = defineProps<{
  labels: string[];
  datasets: Dataset[];
}>();

const data = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((item) => ({
    label: item.label,
    data: item.values,
    borderColor: item.borderColor,
    backgroundColor: item.backgroundColor,
    tension: 0.35,
    fill: false,
  })),
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
  },
};
</script>

<template>
  <div style="height: 300px">
    <Line :data="data" :options="options" />
  </div>
</template>

