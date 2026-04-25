export const SYSTEM_PERMISSIONS = [
  { code: 'dashboard.view', name: 'Lihat Dashboard' },
  { code: 'toddlers.view', name: 'Lihat Data Balita' },
  { code: 'toddlers.create', name: 'Tambah Balita' },
  { code: 'toddlers.update', name: 'Edit Balita' },
  { code: 'toddlers.delete', name: 'Hapus Balita' },
  { code: 'checkups.view', name: 'Lihat Pemeriksaan' },
  { code: 'checkups.create', name: 'Input Pemeriksaan' },
  { code: 'checkups.update', name: 'Edit Pemeriksaan' },
  { code: 'checkups.delete', name: 'Hapus Pemeriksaan' },
  { code: 'qrcode.scan', name: 'Scan QR' },
  { code: 'cards.generate', name: 'Generate Kartu Posyandu' },
  { code: 'users.manage', name: 'Kelola User' },
  { code: 'roles.manage', name: 'Kelola Role' },
  { code: 'reports.view', name: 'Lihat Laporan' },
  { code: 'reports.export', name: 'Export Laporan' },
  { code: 'settings.manage', name: 'Kelola Pengaturan' },
  { code: 'audit.view', name: 'Lihat Audit Log' },
];

export const DEFAULT_ROLES = [
  { code: 'admin', name: 'Admin' },
  { code: 'kepala-desa', name: 'Kepala Desa' },
  { code: 'petugas-kesehatan', name: 'Petugas Kesehatan' },
  { code: 'kader-posyandu', name: 'Kader Posyandu' },
  { code: 'operator-desa', name: 'Operator Desa' },
  { code: 'viewer', name: 'Viewer' },
];

export const ROLE_PERMISSION_MAP = {
  admin: SYSTEM_PERMISSIONS.map((permission) => permission.code),
  'kepala-desa': [
    'dashboard.view',
    'toddlers.view',
    'checkups.view',
    'reports.view',
    'reports.export',
    'audit.view',
  ],
  'petugas-kesehatan': [
    'dashboard.view',
    'toddlers.view',
    'toddlers.create',
    'toddlers.update',
    'checkups.view',
    'checkups.create',
    'checkups.update',
    'qrcode.scan',
    'cards.generate',
    'reports.view',
  ],
  'kader-posyandu': [
    'dashboard.view',
    'toddlers.view',
    'checkups.view',
    'checkups.create',
    'checkups.update',
    'qrcode.scan',
    'cards.generate',
  ],
  'operator-desa': [
    'dashboard.view',
    'toddlers.view',
    'toddlers.create',
    'toddlers.update',
    'users.manage',
    'reports.view',
    'reports.export',
  ],
  viewer: ['dashboard.view', 'toddlers.view', 'checkups.view', 'reports.view'],
};

export const DEFAULT_PAGE_SIZE = 10;
