<script setup lang="ts">
import AppCard from '../components/ui/AppCard.vue';
import AppBadge from '../components/ui/AppBadge.vue';
import DataTable from '../components/DataTable.vue';

const classificationRows = [
  { indikator: 'BB/U', kode: 'SK', kategori: 'Berat badan sangat kurang', ambang: '< -3 SD' },
  { indikator: 'BB/U', kode: 'K', kategori: 'Berat badan kurang', ambang: '-3 SD s/d < -2 SD' },
  { indikator: 'BB/U', kode: 'N', kategori: 'Berat badan normal', ambang: '-2 SD s/d +1 SD' },
  { indikator: 'BB/U', kode: 'RBBL', kategori: 'Risiko berat badan lebih', ambang: '> +1 SD' },
  { indikator: 'TB/U atau PB/U', kode: 'SP', kategori: 'Sangat pendek', ambang: '< -3 SD' },
  { indikator: 'TB/U atau PB/U', kode: 'P', kategori: 'Pendek', ambang: '-3 SD s/d < -2 SD' },
  { indikator: 'TB/U atau PB/U', kode: 'N', kategori: 'Normal', ambang: '-2 SD s/d +3 SD' },
  { indikator: 'TB/U atau PB/U', kode: 'Ti', kategori: 'Tinggi', ambang: '> +3 SD' },
  { indikator: 'BB/TB atau BB/PB atau IMT/U', kode: 'GB', kategori: 'Gizi buruk', ambang: '< -3 SD' },
  { indikator: 'BB/TB atau BB/PB atau IMT/U', kode: 'GK', kategori: 'Gizi kurang', ambang: '-3 SD s/d < -2 SD' },
  { indikator: 'BB/TB atau BB/PB atau IMT/U', kode: 'GN', kategori: 'Gizi baik (normal)', ambang: '-2 SD s/d +1 SD' },
  { indikator: 'BB/TB atau BB/PB atau IMT/U', kode: 'RGL', kategori: 'Berisiko gizi lebih', ambang: '> +1 SD s/d +2 SD' },
  { indikator: 'BB/TB atau BB/PB atau IMT/U', kode: 'GL', kategori: 'Gizi lebih', ambang: '> +2 SD s/d +3 SD' },
  { indikator: 'BB/TB atau BB/PB atau IMT/U', kode: 'O', kategori: 'Obesitas', ambang: '> +3 SD' },
  { indikator: 'LK/U', kode: 'Mi', kategori: 'Mikrosefali', ambang: '< -2 SD' },
  { indikator: 'LK/U', kode: 'N', kategori: 'Normal', ambang: '-2 SD s/d +2 SD' },
  { indikator: 'LK/U', kode: 'Ma', kategori: 'Makrosefali', ambang: '> +2 SD' },
  { indikator: 'LiLA (< 6 bulan)', kode: 'BHP', kategori: 'Berisiko hambatan pertumbuhan', ambang: '< 11.0 cm' },
  { indikator: 'LiLA (< 6 bulan)', kode: 'N', kategori: 'Pertumbuhan baik', ambang: '>= 11.0 cm' },
  { indikator: 'LiLA (>= 6 bulan)', kode: 'GB', kategori: 'Gizi buruk', ambang: '< 11.5 cm' },
  { indikator: 'LiLA (>= 6 bulan)', kode: 'GK', kategori: 'Gizi kurang', ambang: '11.5 - 12.4 cm' },
  { indikator: 'LiLA (>= 6 bulan)', kode: 'N', kategori: 'Gizi baik', ambang: '>= 12.5 cm' },
];

const toRange = (min: number, max: number) => `${min.toFixed(1)} - ${max.toFixed(1)}`;

const maleWeightMin = [2.5, 3.4, 4.3, 5.0, 5.6, 6.0, 6.4, 6.7, 6.9, 7.1, 7.4, 7.6, 7.7, 7.9, 8.1, 8.3, 8.4, 8.6, 8.8, 8.9, 9.1, 9.2, 9.4, 9.5, 9.7];
const maleWeightMax = [3.9, 5.1, 6.3, 7.2, 7.8, 8.4, 8.8, 9.2, 9.6, 9.9, 10.2, 10.5, 10.8, 11.0, 11.3, 11.5, 11.7, 12.0, 12.2, 12.5, 12.7, 12.9, 13.2, 13.4, 13.6];
const maleHeightMin = [46.1, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3, 64.8, 66.2, 67.5, 68.7, 69.9, 71.0, 72.1, 73.1, 74.1, 75.0, 76.0, 76.9, 77.7, 78.6, 79.4, 80.2, 81.0, 81.7];
const maleHeightMax = [51.8, 56.7, 60.4, 63.5, 66.0, 68.0, 69.8, 71.3, 72.8, 74.2, 75.6, 76.9, 78.1, 79.3, 80.5, 81.7, 82.8, 83.9, 85.0, 86.0, 87.0, 88.0, 89.0, 89.9, 90.9];

const femaleWeightMin = [2.4, 3.2, 3.9, 4.5, 5.0, 5.4, 5.7, 6.0, 6.3, 6.5, 6.7, 6.9, 7.0, 7.2, 7.4, 7.6, 7.7, 7.9, 8.1, 8.2, 8.4, 8.6, 8.7, 8.9, 9.0];
const femaleWeightMax = [3.7, 4.8, 5.8, 6.6, 7.3, 7.8, 8.2, 8.6, 9.0, 9.3, 9.6, 9.9, 10.1, 10.4, 10.6, 10.9, 11.1, 11.4, 11.6, 11.8, 12.1, 12.3, 12.5, 12.8, 13.0];
const femaleHeightMin = [45.4, 49.8, 53.0, 55.6, 57.8, 59.6, 61.2, 62.7, 64.0, 65.3, 66.5, 67.7, 68.9, 70.0, 71.0, 72.0, 73.0, 74.0, 74.9, 75.8, 76.7, 77.5, 78.4, 79.2, 80.0];
const femaleHeightMax = [51.0, 55.6, 59.1, 61.9, 64.3, 66.2, 68.0, 69.6, 71.1, 72.6, 73.9, 75.3, 76.6, 77.8, 79.1, 80.2, 81.4, 82.5, 83.6, 84.7, 85.7, 86.7, 87.7, 88.7, 89.6];

const growthRowsMale = Array.from({ length: 25 }).map((_, month) => ({
  month,
  weightRange: toRange(maleWeightMin[month], maleWeightMax[month]),
  heightRange: toRange(maleHeightMin[month], maleHeightMax[month]),
}));

const growthRowsFemale = Array.from({ length: 25 }).map((_, month) => ({
  month,
  weightRange: toRange(femaleWeightMin[month], femaleWeightMax[month]),
  heightRange: toRange(femaleHeightMin[month], femaleHeightMax[month]),
}));

const codeTone = (code: string) => {
  if (['SK', 'SP', 'GB', 'Mi'].includes(code)) return 'red';
  if (['K', 'P', 'GK', 'BHP'].includes(code)) return 'orange';
  if (['RBBL', 'RGL', 'Ma', 'Ti'].includes(code)) return 'yellow';
  if (['GL', 'O'].includes(code)) return 'blue';
  return 'green';
};
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Acuan KIA Hal. 67-79</h2>
        <p class="muted-text" style="margin: 6px 0 0">
          Ringkasan informasi KMS dan standar antropometri anak (Permenkes No. 2 Tahun 2020) sesuai Buku KIA Revisi 2024.
        </p>
      </div>
    </div>

    <AppCard>
      <div class="kia-summary-grid">
        <div class="card-panel kia-inner-card">
          <strong>KMS (Naik / Tidak Naik)</strong>
          <p class="muted-text">Naik (N): kurva BB mengikuti garis pertumbuhan atau kenaikan BB memenuhi KBM.</p>
          <p class="muted-text">Tidak Naik (T): kurva mendatar/menurun, memotong garis di bawahnya, atau kenaikan BB kurang dari KBM.</p>
          <p class="muted-text">Rujuk bila berat badan tidak naik, di bawah garis merah, atau di atas garis oranye.</p>
        </div>
        <div class="card-panel kia-inner-card">
          <strong>Catatan Penerapan di Aplikasi</strong>
          <p class="muted-text">
            Sistem menampilkan kode indikator BB/U, TB/U, BB/TB, LK/U, dan LiLA pada setiap hasil pemeriksaan agar konsisten dengan format Buku KIA.
          </p>
          <p class="muted-text">
            Keputusan klinis tetap oleh tenaga kesehatan sesuai tatalaksana SDIDTK/MTBS.
          </p>
        </div>
      </div>
    </AppCard>

    <AppCard>
      <div class="section-head">
        <div>
          <strong>Kode & Ambang Status Antropometri</strong>
          <p class="muted-text">Rujukan tampilan kode dari halaman 67-79 Buku KIA.</p>
        </div>
      </div>
      <DataTable
        :columns="[
          { key: 'indikator', label: 'Indikator' },
          { key: 'kode', label: 'Kode' },
          { key: 'kategori', label: 'Kategori' },
          { key: 'ambang', label: 'Ambang' },
        ]"
        :rows="classificationRows"
      >
        <template #kode="{ row }">
          <AppBadge :tone="codeTone(row.kode)">{{ row.kode }}</AppBadge>
        </template>
      </DataTable>
    </AppCard>

    <div class="grid-cards kia-table-grid">
      <AppCard>
        <div class="section-head">
          <div>
            <strong>Tabel Pertumbuhan 0-24 Bulan (Laki-laki)</strong>
            <p class="muted-text">Sumber Buku KIA hal. 67 (rentang ideal BB dan PB).</p>
          </div>
        </div>
        <DataTable
          :columns="[
            { key: 'month', label: 'Umur (bln)' },
            { key: 'weightRange', label: 'BB ideal (kg)' },
            { key: 'heightRange', label: 'PB ideal (cm)' },
          ]"
          :rows="growthRowsMale"
        />
      </AppCard>

      <AppCard>
        <div class="section-head">
          <div>
            <strong>Tabel Pertumbuhan 0-24 Bulan (Perempuan)</strong>
            <p class="muted-text">Sumber Buku KIA hal. 67 (rentang ideal BB dan PB).</p>
          </div>
        </div>
        <DataTable
          :columns="[
            { key: 'month', label: 'Umur (bln)' },
            { key: 'weightRange', label: 'BB ideal (kg)' },
            { key: 'heightRange', label: 'PB ideal (cm)' },
          ]"
          :rows="growthRowsFemale"
        />
      </AppCard>
    </div>

    <AppCard>
      <strong>Cakupan Halaman 67-79 yang Ditampilkan</strong>
      <div class="form-grid" style="margin-top: 10px">
        <p class="muted-text">KMS 0-2 tahun dan 2-5 tahun (L/P), klasifikasi BB/U, PB/U-TB/U, BB/PB-BB/TB, IMT/U, LK/U, serta LiLA.</p>
        <p class="muted-text">Format kode status sudah disamakan agar petugas dan kader mudah membaca hasil seperti di buku KIA.</p>
      </div>
    </AppCard>
  </div>
</template>

