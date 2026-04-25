<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const emit = defineEmits<{
  (event: 'scan', value: string): void;
  (event: 'error', value: string): void;
}>();

const containerId = `qr-reader-${Math.round(Math.random() * 100000)}`;
const scanner = ref<Html5Qrcode | null>(null);
const lastEmittedAt = ref(0);

const preferBackCamera = (cameras: Array<{ id: string; label: string }>) => {
  const byLabel = cameras.find((camera) => /back|rear|environment|belakang|utama/i.test(camera.label || ''));
  return byLabel || cameras[cameras.length - 1] || cameras[0] || null;
};

onMounted(async () => {
  try {
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      emit('error', 'Kamera butuh HTTPS. Gunakan link https://... atau akses via localhost.');
      return;
    }

    scanner.value = new Html5Qrcode(containerId);
    const scanConfig = { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 };

    let started = false;
    try {
      const cameras = await Html5Qrcode.getCameras();
      const camera = preferBackCamera(cameras || []);
      if (camera?.id) {
        await scanner.value.start(
          { deviceId: { exact: camera.id } },
          scanConfig,
          (decodedText) => {
            const now = Date.now();
            if (now - lastEmittedAt.value < 1200) return;
            lastEmittedAt.value = now;
            emit('scan', decodedText);
          },
          () => undefined,
        );
        started = true;
      }
    } catch (_error) {
      started = false;
    }

    if (!started) {
      await scanner.value.start(
        { facingMode: 'environment' },
        scanConfig,
        (decodedText) => {
          const now = Date.now();
          if (now - lastEmittedAt.value < 1200) return;
          lastEmittedAt.value = now;
          emit('scan', decodedText);
        },
        () => undefined,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kamera tidak dapat diakses.';
    emit('error', `${message} Coba beri izin kamera atau pakai input manual QR.`);
  }
});

onBeforeUnmount(async () => {
  try {
    if (scanner.value?.isScanning) {
      await scanner.value.stop();
    }
    await scanner.value?.clear();
  } catch (_error) {
    // Ignore teardown errors when component unmounts quickly.
  }
});
</script>

<template>
  <div :id="containerId" class="qr-reader"></div>
</template>
