import { z } from 'zod';

const nullableString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const nullableDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
    message: 'Tanggal tidak valid',
  });

const familyMemberSchema = z.object({
  relationType: z.string().trim().min(2, 'Status hubungan wajib diisi'),
  fullName: z.string().trim().min(2, 'Nama anggota wajib diisi'),
  nik: nullableString,
  gender: z.enum(['MALE', 'FEMALE']),
  placeOfBirth: nullableString,
  birthDate: nullableDate,
  religion: nullableString,
  education: nullableString,
  occupation: nullableString,
  maritalStatus: nullableString,
  citizenship: nullableString,
  fatherName: nullableString,
  motherName: nullableString,
  relationshipStatus: nullableString,
});

const familyBody = {
  villageId: z.coerce.number().int().positive(),
  hamletId: z.coerce.number().int().positive(),
  rwId: z.coerce.number().int().positive(),
  rtId: z.coerce.number().int().positive(),
  domicileProvinceCode: nullableString,
  domicileProvinceName: nullableString,
  domicileRegencyCode: nullableString,
  domicileRegencyName: nullableString,
  domicileDistrictCode: nullableString,
  domicileDistrictName: nullableString,
  domicileVillageCode: nullableString,
  domicileVillageName: nullableString,
  domicileRw: nullableString,
  domicileRt: nullableString,
  familyNumber: z.string().trim().min(8, 'No KK minimal 8 karakter'),
  headName: z.string().trim().min(2, 'Nama kepala keluarga minimal 2 karakter'),
  address: z.string().trim().min(5, 'Alamat minimal 5 karakter'),
  phone: nullableString,
  members: z.array(familyMemberSchema).max(20).optional().default([]),
};

export const familyCreateSchema = z.object({
  body: z.object(familyBody),
  params: z.object({}),
  query: z.object({}),
});

export const familyUpdateSchema = z.object({
  body: z.object(familyBody),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});
