type ApiErrorLike = {
  response?: {
    data?: {
      message?: string;
      details?: {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      } | null;
    };
  };
  message?: string;
};

const fieldLabelMap: Record<string, string> = {
  villageName: 'Nama desa',
  adminName: 'Nama admin',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Konfirmasi password',
  familyNumber: 'No KK',
  headName: 'Nama kepala keluarga',
  address: 'Alamat',
  villageId: 'Desa',
  hamletId: 'Dusun',
  rwId: 'RW',
  rtId: 'RT',
  familyId: 'Master KK',
  familyMemberId: 'Anak dari KK',
  members: 'Anggota keluarga',
  nik: 'NIK',
  fullName: 'Nama lengkap',
  birthDate: 'Tanggal lahir',
  gender: 'Jenis kelamin',
  posyanduId: 'Posyandu',
  examDate: 'Tanggal pemeriksaan',
  weight: 'Berat badan',
  height: 'Tinggi/panjang badan',
  officerName: 'Nama petugas',
  roleIds: 'Role',
  roleCodes: 'Role',
  customPermissionCodes: 'Hak akses kustom',
};

const normalizeFieldName = (field: string) => {
  const clean = field.replace(/^body\./, '').replace(/^query\./, '').replace(/^params\./, '');
  return fieldLabelMap[clean] || clean.replace(/[._]/g, ' ');
};

export const extractApiErrorMessage = (error: ApiErrorLike, fallback = 'Terjadi kesalahan. Silakan coba lagi.') => {
  const data = error?.response?.data;
  const details = data?.details;
  const fieldErrors = details?.fieldErrors || {};
  const fieldMessages = Object.entries(fieldErrors)
    .flatMap(([field, messages]) => messages.map((message) => `${normalizeFieldName(field)}: ${message}`))
    .filter(Boolean);
  const formMessages = details?.formErrors || [];
  const detailMessages = [...formMessages, ...fieldMessages];

  if (detailMessages.length) {
    return detailMessages.slice(0, 4).join(' • ');
  }

  return data?.message || error?.message || fallback;
};

export const missingMasterDataMessage = (items: Array<unknown>, label: string, action = 'Buka menu Pengaturan lalu lengkapi data master terlebih dahulu.') => {
  if (items.length) return '';
  return `${label} belum tersedia. ${action}`;
};
