export interface AuthUser {
  id: number;
  name: string;
  email: string;
  status: string;
  village: { id: number; name: string; code: string } | null;
  roles: Array<{ id: number; code: string; name: string }>;
  permissions: string[];
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Toddler {
  id: number;
  kode_balita: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'MALE' | 'FEMALE';
  nama_ibu: string;
  nama_ayah: string;
  alamat: string;
  no_hp_orangtua?: string | null;
  qr_code_value: string;
  status_aktif: boolean;
  hamlet?: { id: number; name: string };
  posyandu?: { id: number; name: string };
  family?: { id: number; familyNumber?: string };
  latestCheckup?: Checkup | null;
  checkups?: Checkup[];
  card?: {
    cardNumber: string;
    publicToken: string;
    qrCodeUrl: string;
  } | null;
}

export interface Checkup {
  id: number;
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
  genderReference?: 'MALE' | 'FEMALE' | null;
  headCircumference?: number | null;
  muac?: number | null;
  riskLevel: string;
  growthTrend: string;
  statusLabel: string;
  growthSummary: string;
  officerName: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  permissions: Array<{ id: number; code: string; name: string }>;
}
