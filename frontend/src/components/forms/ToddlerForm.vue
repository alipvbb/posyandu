<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMasterDataStore } from '../../stores/master-data';
import { useAppStore } from '../../stores/app';
import { familiesService } from '../../services/families.service';
import AppDialog from '../ui/AppDialog.vue';
import AppButton from '../ui/AppButton.vue';
import AppInput from '../ui/AppInput.vue';
import AppSelect from '../ui/AppSelect.vue';

const props = defineProps<{
  initialValue?: Record<string, any> | null;
  loading?: boolean;
  isEdit?: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit', value: Record<string, any>): void;
}>();

const masterDataStore = useMasterDataStore();
const appStore = useAppStore();
const allowFamilyAutofill = ref(true);
const addChildDialogOpen = ref(false);
const addChildSaving = ref(false);
const CHILD_RELATIONS = new Set(['ANAK', 'CUCU', 'FAMILI LAIN', 'LAINNYA']);
const addChildForm = reactive({
  fullName: '',
  nik: '',
  gender: 'MALE',
  placeOfBirth: '',
  birthDate: '',
});

const calcAgeInMonths = (birthDate: string | Date | null | undefined) => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) months -= 1;
  return months;
};

const form = reactive({
  familyMemberId: '',
  fullName: '',
  nik: '',
  noKk: '',
  placeOfBirth: 'Kabupaten Sehat',
  birthDate: '',
  gender: '',
  motherName: '',
  fatherName: '',
  familyId: '',
  posyanduId: '',
  address: '',
  hamletId: '',
  rwId: '',
  rtId: '',
  parentPhone: '',
  status: 'ACTIVE',
  photoUrl: '',
});

const normalizeRelation = (value: string | undefined | null) => String(value || '').trim().toUpperCase();

const findMemberByRelations = (
  family: any,
  relations: string[],
  gender?: 'MALE' | 'FEMALE',
) => {
  if (!Array.isArray(family?.members)) return null;
  for (const relation of relations) {
    const found = family.members.find((item: any) => {
      const sameRelation = normalizeRelation(item.relationType) === relation;
      const sameGender = gender ? item.gender === gender : true;
      return sameRelation && sameGender;
    });
    if (found) return found;
  }
  return null;
};

const fillFromFamily = (family: any) => {
  if (!family) return;
  const fatherMember =
    findMemberByRelations(family, ['AYAH', 'SUAMI'], 'MALE') ||
    findMemberByRelations(family, ['KEPALA KELUARGA'], 'MALE');
  const motherMember =
    findMemberByRelations(family, ['IBU', 'ISTRI'], 'FEMALE') ||
    findMemberByRelations(family, ['KEPALA KELUARGA'], 'FEMALE');

  form.noKk = family.familyNumber || form.noKk;
  form.address = family.address || form.address;
  form.parentPhone = family.phone || form.parentPhone;
  form.hamletId = family.hamletId ? String(family.hamletId) : form.hamletId;
  form.rwId = family.rwId ? String(family.rwId) : form.rwId;
  form.rtId = family.rtId ? String(family.rtId) : form.rtId;
  form.fatherName = fatherMember?.fullName || form.fatherName || family.headName || '';
  form.motherName = motherMember?.fullName || form.motherName;
};

const fillFromChildMember = (member: any) => {
  if (!member) return;
  form.fullName = member.fullName || form.fullName;
  form.nik = member.nik || form.nik;
  form.gender = member.gender || form.gender;
  form.placeOfBirth = member.placeOfBirth || form.placeOfBirth;
  form.birthDate = member.birthDate ? String(member.birthDate).slice(0, 10) : form.birthDate;
};

watch(
  () => props.initialValue,
  (value) => {
    if (!value) return;
    allowFamilyAutofill.value = false;
    form.fullName = value.nama_lengkap || '';
    form.nik = value.nik || '';
    form.noKk = value.no_kk || value.family?.familyNumber || '';
    form.placeOfBirth = value.tempat_lahir || 'Kabupaten Sehat';
    form.birthDate = value.tanggal_lahir?.slice?.(0, 10) || '';
    form.gender = value.jenis_kelamin || '';
    form.motherName = value.nama_ibu || '';
    form.fatherName = value.nama_ayah || '';
    form.familyId = String(value.id_keluarga || value.family?.id || '');
    form.familyMemberId = '';
    form.posyanduId = String(value.id_posyandu || value.posyandu?.id || '');
    form.address = value.alamat || '';
    form.hamletId = String(value.dusun_id || value.hamlet?.id || '');
    form.rwId = String(value.rw_id || value.rw?.id || '');
    form.rtId = String(value.rt_id || value.rt?.id || '');
    form.parentPhone = value.no_hp_orangtua || '';
    form.status = value.status_aktif === false ? 'INACTIVE' : 'ACTIVE';
    form.photoUrl = value.photo_url || '';
    queueMicrotask(() => {
      allowFamilyAutofill.value = true;
    });
  },
  { immediate: true },
);

const selectedFamily = computed(() =>
  masterDataStore.families.find((item: any) => String(item.id) === String(form.familyId)) || null,
);

const childMemberOptions = computed(() => {
  if (!selectedFamily.value?.members?.length) return [];
  return selectedFamily.value.members
    .filter((item: any) => {
      if (!CHILD_RELATIONS.has(normalizeRelation(item.relationType))) return false;
      const ageInMonths = calcAgeInMonths(item.birthDate);
      return ageInMonths !== null && ageInMonths >= 0 && ageInMonths <= 59;
    })
    .map((item: any) => ({
      label: `${item.fullName}${item.nik ? ` • ${item.nik}` : ''}`,
      value: String(item.id),
    }));
});

const selectedChildMember = computed(() => {
  if (!selectedFamily.value || !form.familyMemberId) return null;
  return (
    selectedFamily.value.members?.find((item: any) => String(item.id) === String(form.familyMemberId)) ||
    null
  );
});

const selectedFamilyParentSummary = computed(() => {
  if (!selectedFamily.value) return '-';
  const members = selectedFamily.value.members || [];
  const father =
    members.find((item: any) => ['AYAH', 'SUAMI', 'KEPALA KELUARGA'].includes(normalizeRelation(item.relationType)) && item.gender === 'MALE')
      ?.fullName || selectedFamily.value.headName;
  const mother =
    members.find((item: any) => ['IBU', 'ISTRI', 'KEPALA KELUARGA'].includes(normalizeRelation(item.relationType)) && item.gender === 'FEMALE')
      ?.fullName || '-';
  return `${father} / ${mother}`;
});

watch(
  () => [selectedFamily.value, form.nik, form.fullName] as const,
  () => {
    if (form.familyMemberId || !selectedFamily.value?.members?.length) return;
    const byNik =
      form.nik &&
      selectedFamily.value.members.find(
        (item: any) =>
          CHILD_RELATIONS.has(normalizeRelation(item.relationType)) && item.nik && item.nik === form.nik,
      );
    const byName =
      !byNik &&
      selectedFamily.value.members.find(
        (item: any) =>
          CHILD_RELATIONS.has(normalizeRelation(item.relationType)) &&
          String(item.fullName || '').trim().toLowerCase() === String(form.fullName || '').trim().toLowerCase(),
      );
    const candidate = byNik || byName;
    if (candidate) {
      form.familyMemberId = String(candidate.id);
    }
  },
);

watch(
  () => form.familyId,
  (value) => {
    form.familyMemberId = '';
    if (!allowFamilyAutofill.value || !value) return;
    const family = masterDataStore.families.find((item: any) => String(item.id) === String(value));
    if (!family) return;
    fillFromFamily(family);
  },
);

watch(
  () => form.familyMemberId,
  () => {
    if (!allowFamilyAutofill.value) return;
    fillFromChildMember(selectedChildMember.value);
  },
);

watch(
  () => form.hamletId,
  (next, prev) => {
    if (next === prev) return;
    form.rwId = '';
    form.rtId = '';
  },
);

watch(
  () => form.rwId,
  (next, prev) => {
    if (next === prev) return;
    form.rtId = '';
  },
);

const filteredRws = computed(() => masterDataStore.rws.filter((item) => String(item.hamletId) === form.hamletId));
const filteredRts = computed(() => masterDataStore.rts.filter((item) => String(item.rwId) === form.rwId));

const familyOptions = computed(() =>
  masterDataStore.families.map((item: any) => ({
    label: `${item.familyNumber} • ${item.headName}`,
    value: String(item.id),
  })),
);

const applySelectedFamily = () => {
  if (!form.familyId) return;
  const family = masterDataStore.families.find((item: any) => String(item.id) === String(form.familyId));
  if (!family) return;
  fillFromFamily(family);
};

const openAddChildDialog = () => {
  if (!selectedFamily.value) {
    appStore.pushToast('Pilih Master KK dulu sebelum menambah anak.', 'error');
    return;
  }
  addChildForm.fullName = '';
  addChildForm.nik = '';
  addChildForm.gender = 'MALE';
  addChildForm.placeOfBirth = '';
  addChildForm.birthDate = '';
  addChildDialogOpen.value = true;
};

const addChildToFamily = async () => {
  if (!selectedFamily.value) {
    appStore.pushToast('Master KK belum dipilih.', 'error');
    return;
  }
  if (!addChildForm.fullName.trim()) {
    appStore.pushToast('Nama anak wajib diisi.', 'error');
    return;
  }
  if (!addChildForm.birthDate) {
    appStore.pushToast('Tanggal lahir anak wajib diisi agar valid sebagai balita.', 'error');
    return;
  }
  const ageInMonths = calcAgeInMonths(addChildForm.birthDate);
  if (ageInMonths === null || ageInMonths < 0) {
    appStore.pushToast('Tanggal lahir anak tidak valid.', 'error');
    return;
  }
  if (ageInMonths > 59) {
    appStore.pushToast('Usia di atas 59 bulan bukan kategori balita.', 'error');
    return;
  }
  addChildSaving.value = true;
  try {
    const family = selectedFamily.value;
    const members = (family.members || []).map((item: any) => ({
      relationType: item.relationType || 'ANAK',
      fullName: item.fullName || '',
      nik: item.nik || null,
      gender: item.gender || 'MALE',
      placeOfBirth: item.placeOfBirth || null,
      birthDate: item.birthDate ? String(item.birthDate).slice(0, 10) : null,
      religion: item.religion || null,
      education: item.education || null,
      occupation: item.occupation || null,
      maritalStatus: item.maritalStatus || null,
      citizenship: item.citizenship || 'WNI',
      fatherName: item.fatherName || null,
      motherName: item.motherName || null,
      relationshipStatus: item.relationshipStatus || null,
    }));
    members.push({
      relationType: 'ANAK',
      fullName: addChildForm.fullName.trim(),
      nik: addChildForm.nik.trim() || null,
      gender: addChildForm.gender,
      placeOfBirth: addChildForm.placeOfBirth.trim() || null,
      birthDate: addChildForm.birthDate || null,
      religion: null,
      education: null,
      occupation: null,
      maritalStatus: null,
      citizenship: 'WNI',
      fatherName: null,
      motherName: null,
      relationshipStatus: null,
    });

    const updated = await familiesService.update(family.id, {
      villageId: family.villageId,
      hamletId: family.hamletId,
      rwId: family.rwId,
      rtId: family.rtId,
      familyNumber: family.familyNumber,
      headName: family.headName,
      address: family.address,
      phone: family.phone || null,
      members,
    });

    await masterDataStore.fetchAll(true);
    form.familyId = String(updated.id);
    fillFromFamily(updated);
    const newestMember = Array.isArray(updated.members) ? updated.members[updated.members.length - 1] : null;
    if (newestMember?.id) {
      form.familyMemberId = String(newestMember.id);
      fillFromChildMember(newestMember);
    }
    addChildDialogOpen.value = false;
    appStore.pushToast('Anak berhasil ditambahkan ke Master KK.', 'success');
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Gagal menambah anak ke Master KK.', 'error');
  } finally {
    addChildSaving.value = false;
  }
};

const submit = () => {
  if (!props.isEdit && !form.familyMemberId) {
    appStore.pushToast('Pilih anak dari Master KK terlebih dahulu.', 'error');
    return;
  }

  emit('submit', {
    familyMemberId: form.familyMemberId ? Number(form.familyMemberId) : null,
    fullName: form.fullName,
    nik: form.nik || null,
    noKk: form.noKk || null,
    placeOfBirth: form.placeOfBirth,
    birthDate: form.birthDate,
    gender: form.gender,
    motherName: form.motherName,
    fatherName: form.fatherName,
    familyId: Number(form.familyId),
    posyanduId: Number(form.posyanduId),
    address: form.address,
    hamletId: Number(form.hamletId),
    rwId: Number(form.rwId),
    rtId: Number(form.rtId),
    parentPhone: form.parentPhone || null,
    status: form.status,
    photoUrl: form.photoUrl || null,
  });
};
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <div class="grid-cards" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
      <AppSelect v-model="form.familyId" label="Master KK (wajib)" :options="familyOptions" />
      <AppSelect v-model="form.familyMemberId" label="Pilih Anak Dari KK (wajib)" :options="childMemberOptions" />
      <AppButton type="button" variant="secondary" @click="openAddChildDialog">Tambah Anak Baru ke KK</AppButton>
      <AppButton type="button" variant="secondary" @click="applySelectedFamily">Isi otomatis dari KK</AppButton>
      <small class="muted-text" style="margin-top: -2px">
        {{
          childMemberOptions.length
            ? `Anak dari keluarga: ${selectedFamilyParentSummary} (hanya usia 0-59 bulan).`
            : 'Belum ada anggota anak usia balita (0-59 bulan) di KK ini. Tambahkan di form ini.'
        }}
      </small>
      <AppInput v-model="form.fullName" label="Nama lengkap balita" />
      <AppInput v-model="form.nik" label="NIK" />
      <AppInput v-model="form.noKk" label="No KK" />
      <AppInput v-model="form.placeOfBirth" label="Tempat lahir" />
      <AppInput v-model="form.birthDate" label="Tanggal lahir" type="date" />
      <AppSelect
        v-model="form.gender"
        label="Jenis kelamin"
        :options="[
          { label: 'Laki-laki', value: 'MALE' },
          { label: 'Perempuan', value: 'FEMALE' },
        ]"
      />
      <AppInput v-model="form.motherName" label="Nama ibu" />
      <AppInput v-model="form.fatherName" label="Nama ayah" />
      <AppSelect
        v-model="form.hamletId"
        label="Dusun"
        :options="masterDataStore.hamlets.map((item) => ({ label: item.name, value: item.id }))"
      />
      <AppSelect
        v-model="form.rwId"
        label="RW"
        :options="filteredRws.map((item) => ({ label: item.name, value: item.id }))"
      />
      <AppSelect
        v-model="form.rtId"
        label="RT"
        :options="filteredRts.map((item) => ({ label: item.name, value: item.id }))"
      />
      <AppSelect
        v-model="form.posyanduId"
        label="Posyandu"
        :options="masterDataStore.posyandus.map((item) => ({ label: item.name, value: item.id }))"
      />
      <AppInput v-model="form.parentPhone" label="No HP orang tua" />
      <AppInput v-model="form.photoUrl" label="URL foto (opsional)" />
      <AppSelect
        v-model="form.status"
        label="Status aktif"
        :options="[
          { label: 'Aktif', value: 'ACTIVE' },
          { label: 'Tidak aktif', value: 'INACTIVE' },
        ]"
      />
    </div>

    <label class="form-field">
      <span>Alamat</span>
      <textarea v-model="form.address" class="form-input" rows="3" />
    </label>

    <div class="inline-actions">
      <AppButton type="submit" :disabled="loading">{{ loading ? 'Menyimpan...' : 'Simpan balita' }}</AppButton>
      <slot name="actions" />
    </div>
  </form>

  <AppDialog :open="addChildDialogOpen" title="Tambah Anak ke Master KK" @close="addChildDialogOpen = false">
    <form class="form-grid" @submit.prevent="addChildToFamily">
      <p class="muted-text" style="margin: 0">
        KK: <strong>{{ selectedFamily?.familyNumber || '-' }}</strong> • Kepala KK: <strong>{{ selectedFamily?.headName || '-' }}</strong>
      </p>
      <AppInput v-model="addChildForm.fullName" label="Nama anak" />
      <AppInput v-model="addChildForm.nik" label="NIK anak (opsional)" />
      <AppSelect
        v-model="addChildForm.gender"
        label="Jenis kelamin"
        :options="[
          { label: 'Laki-laki', value: 'MALE' },
          { label: 'Perempuan', value: 'FEMALE' },
        ]"
      />
      <AppInput v-model="addChildForm.placeOfBirth" label="Tempat lahir (opsional)" />
      <AppInput v-model="addChildForm.birthDate" type="date" label="Tanggal lahir (wajib, 0-59 bulan)" />
      <div class="inline-actions">
        <AppButton type="submit" :disabled="addChildSaving">{{ addChildSaving ? 'Menyimpan...' : 'Simpan Anak' }}</AppButton>
        <AppButton type="button" variant="secondary" @click="addChildDialogOpen = false">Batal</AppButton>
      </div>
    </form>
  </AppDialog>
</template>
