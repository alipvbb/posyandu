<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import QrCodeCardPreview from '../components/qr/QrCodeCardPreview.vue';
import { APP_NAME, APP_SHORT_NAME } from '../app/branding';
import { toddlersService } from '../services/toddlers.service';
import { useAppStore } from '../stores/app';
import { formatDate, genderLabel } from '../utils/format';

const route = useRoute();
const appStore = useAppStore();
const card = ref<any>(null);
const qr = ref<any>(null);
const loading = ref(true);
const loadFailed = ref(false);

const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const printPage = () => {
  if (!card.value || !qr.value) return;

  const toddler = card.value.toddler;
  const ttl = formatDate(toddler.tanggal_lahir);
  const gender = genderLabel(toddler.jenis_kelamin);
  const issuedAt = formatDate(card.value.updatedAt || card.value.createdAt || new Date().toISOString());

  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cetak Kartu Posyandu - ${esc(card.value.cardNumber)}</title>
    <style>
      @page { size: A5 landscape; margin: 7mm; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body {
        margin: 0;
        font-family: "Nunito Sans", "Segoe UI", sans-serif;
        color: #14352a;
        background: #ffffff;
      }
      .sheet {
        width: 100%;
        min-height: calc(148mm - 14mm);
      }
      .id-card {
        height: 100%;
        border-radius: 5mm;
        border: 0.35mm solid #c9ded4;
        overflow: hidden;
        background:
          radial-gradient(circle at 92% 12%, rgba(90, 163, 143, 0.12), transparent 40%),
          radial-gradient(circle at 8% 88%, rgba(240, 185, 104, 0.1), transparent 34%),
          linear-gradient(180deg, #ffffff 0%, #f7fcf9 100%);
        display: grid;
        grid-template-rows: auto 1fr auto;
      }
      .header {
        background: linear-gradient(135deg, #2f6f61, #5aa38f);
        color: #ffffff;
        padding: 6.5mm 7.5mm 5.5mm;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 6mm;
      }
      .brand-wrap {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 3mm;
      }
      .brand-mark {
        width: 10.5mm;
        height: 10.5mm;
        border-radius: 2.2mm;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.5);
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 10pt;
        letter-spacing: 0.4px;
      }
      .org-name {
        margin: 0;
        font-size: 8.3pt;
        opacity: 0.9;
        letter-spacing: 0.2px;
      }
      .main-title {
        margin: 1mm 0 0;
        font-size: 14.5pt;
        letter-spacing: 0.25px;
      }
      .subtitle {
        margin: 0.8mm 0 0;
        font-size: 8.2pt;
        opacity: 0.92;
      }
      .header-right {
        display: grid;
        justify-items: end;
        gap: 1.2mm;
      }
      .header-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 1.4mm 2.6mm;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.45);
        font-size: 8pt;
        font-weight: 700;
      }
      .header-card-number {
        font-size: 12pt;
        letter-spacing: 0.2px;
        font-weight: 700;
      }
      .body {
        padding: 6mm 7.5mm;
        display: grid;
        grid-template-columns: 1.18fr 0.82fr;
        gap: 5.5mm;
      }
      .identity {
        display: grid;
        align-content: start;
        gap: 4mm;
      }
      .name-label {
        margin: 0;
        font-size: 8pt;
        color: #58796c;
      }
      .child-name {
        margin: 0;
        font-size: 19pt;
        line-height: 1.1;
        color: #123629;
      }
      .child-code {
        margin: 0.8mm 0 0;
        color: #4f6f63;
        font-size: 9.3pt;
        font-weight: 700;
      }
      .meta-box {
        border: 0.35mm solid #d6e6df;
        border-radius: 3mm;
        background: #ffffff;
        padding: 3.2mm 3.4mm;
      }
      .meta-grid {
        display: grid;
        gap: 2.6mm;
        font-size: 9.6pt;
      }
      .meta-row {
        display: grid;
        grid-template-columns: 30mm 1fr;
        gap: 2mm;
      }
      .meta-row span {
        color: #5b7a6e;
      }
      .meta-row b {
        color: #123629;
        font-weight: 700;
      }
      .note {
        margin: 0;
        color: #5b7a6e;
        font-size: 8.1pt;
      }
      .qr-side {
        border: 0.35mm solid #d6e6df;
        border-radius: 3mm;
        background: #ffffff;
        padding: 3.3mm;
        display: grid;
        align-content: start;
        justify-items: center;
        gap: 2.6mm;
        text-align: center;
      }
      .qr-title {
        margin: 0;
        font-size: 8.8pt;
        color: #204f42;
        font-weight: 700;
      }
      .qr-side img {
        width: 43mm;
        height: 43mm;
        background: #fff;
        border-radius: 1.8mm;
        border: 0.35mm solid #deebe5;
        padding: 1.1mm;
      }
      .qr-url {
        font-size: 6.8pt;
        color: #617f72;
        word-break: break-all;
      }
      .footer {
        margin-top: auto;
        border-top: 0.35mm dashed #d7e5de;
        background: #f5fbf8;
        color: #45685c;
        padding: 3.6mm 7.5mm 4mm;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 4mm;
        align-items: center;
        font-size: 8.1pt;
      }
      @media print {
        .id-card {
          break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <section class="id-card">
        <header class="header">
          <div class="brand-wrap">
            <div class="brand-mark">PA</div>
            <div>
              <p class="org-name">${esc(APP_NAME)}</p>
              <h1 class="main-title">KARTU IDENTITAS POSYANDU</h1>
              <p class="subtitle">Kartu resmi pemantauan tumbuh kembang anak usia 0–59 bulan</p>
            </div>
          </div>
          <div class="header-right">
            <div class="header-chip">Nomor Kartu</div>
            <div class="header-card-number">${esc(card.value.cardNumber)}</div>
          </div>
        </header>

        <section class="body">
          <div class="identity">
            <p class="name-label">Nama Balita</p>
            <h2 class="child-name">${esc(toddler.nama_lengkap)}</h2>
            <p class="child-code">${esc(toddler.kode_balita)}</p>
            <div class="meta-box">
              <div class="meta-grid">
                <div class="meta-row"><span>TTL</span><b>${esc(ttl)}</b></div>
                <div class="meta-row"><span>Jenis Kelamin</span><b>${esc(gender)}</b></div>
                <div class="meta-row"><span>Nama Ibu</span><b>${esc(toddler.nama_ibu)}</b></div>
                <div class="meta-row"><span>Nama Ayah</span><b>${esc(toddler.nama_ayah || '-')}</b></div>
                <div class="meta-row"><span>Posyandu</span><b>${esc(toddler.posyandu?.name || '-')}</b></div>
                <div class="meta-row"><span>Dusun</span><b>${esc(toddler.hamlet?.name || '-')}</b></div>
              </div>
            </div>
            <p class="note">Kartu ini dibawa saat kegiatan posyandu dan pemeriksaan rutin balita.</p>
          </div>
          <aside class="qr-side">
            <p class="qr-title">Scan untuk melihat riwayat tumbuh kembang</p>
            <img src="${esc(qr.value.dataUrl)}" alt="QR Kartu Posyandu" />
            <div class="qr-url">${esc(card.value.publicUrl)}</div>
          </aside>
        </section>

        <footer class="footer">
          <div>Diterbitkan: ${esc(issuedAt)} • Jika kartu hilang, hubungi petugas desa untuk cetak ulang.</div>
          <div>${esc(APP_SHORT_NAME)}</div>
        </footer>
      </section>
    </div>
  </body>
</html>`;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};

onMounted(async () => {
  loading.value = true;
  loadFailed.value = false;
  try {
    const [cardData, qrData] = await Promise.all([
      toddlersService.getCard(String(route.params.id)),
      toddlersService.getQr(String(route.params.id)),
    ]);
    card.value = cardData;
    qr.value = qrData;
  } catch (_error) {
    loadFailed.value = true;
    appStore.pushToast('Gagal memuat kartu posyandu.', 'error');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="loading" class="form-grid">
    <AppCard>
      <AppLoadingBlock text="Memuat kartu posyandu..." />
    </AppCard>
  </div>

  <div v-else-if="loadFailed" class="form-grid">
    <AppCard>
      <div class="empty-state">Kartu posyandu gagal dimuat. Coba refresh halaman.</div>
    </AppCard>
  </div>

  <div v-else-if="card && qr" class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Kartu Posyandu</h2>
        <p class="muted-text" style="margin: 6px 0 0">Versi printable dengan QR unik untuk petugas dan akses publik orang tua.</p>
      </div>
      <AppButton @click="printPage">Cetak kartu</AppButton>
    </div>

    <AppCard class="card-print-panel">
      <div class="print-card card-print-sheet idcard-preview">
        <div class="idcard-preview-head">
          <div class="idcard-preview-brand">
            <div class="idcard-preview-mark">PA</div>
            <div>
              <small class="muted-text">{{ APP_NAME }}</small>
              <h3>Kartu Identitas Posyandu</h3>
            </div>
          </div>
          <div class="idcard-preview-number">
            <small class="muted-text">Nomor Kartu</small>
            <div class="status-badge" data-tone="green">{{ card.cardNumber }}</div>
          </div>
        </div>

        <div class="idcard-preview-body">
          <div class="form-grid">
            <small class="muted-text">Nama Balita</small>
            <h3 style="margin: 0">{{ card.toddler.nama_lengkap }}</h3>
            <p class="muted-text" style="margin: 0">{{ card.toddler.kode_balita }}</p>
            <div class="idcard-preview-meta">
              <div>TTL: <strong>{{ formatDate(card.toddler.tanggal_lahir) }}</strong></div>
              <div>JK: <strong>{{ genderLabel(card.toddler.jenis_kelamin) }}</strong></div>
              <div>Ibu: <strong>{{ card.toddler.nama_ibu }}</strong></div>
              <div>Ayah: <strong>{{ card.toddler.nama_ayah || '-' }}</strong></div>
              <div>Posyandu: <strong>{{ card.toddler.posyandu?.name }}</strong></div>
              <div>Dusun: <strong>{{ card.toddler.hamlet?.name }}</strong></div>
            </div>
          </div>
          <QrCodeCardPreview :image="qr.dataUrl" :value="card.publicUrl" :show-value="false" title="Scan data tumbuh kembang" />
        </div>

        <small class="muted-text">Format cetak: A5 landscape, proporsional untuk kartu identitas posyandu.</small>
      </div>
    </AppCard>
  </div>
</template>
