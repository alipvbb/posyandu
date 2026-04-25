<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'vue-chartjs';
import { computed } from 'vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  labels: string[];
  values: number[];
  title?: string;
  uniformColor?: boolean;
  color?: string;
}>();

const palette = ['#5aa38f', '#76baa8', '#9acec0', '#f0b968', '#d9a155', '#8dd5c3'];
const baseColor = computed(() => props.color || '#5aa38f');

const data = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.title || 'Jumlah',
      data: props.values,
      borderRadius: 12,
      backgroundColor: props.uniformColor ? baseColor.value : palette,
    },
  ],
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
};
</script>

<template>
  <div style="height: 280px">
    <Bar :data="data" :options="options" />
  </div>
</template>
