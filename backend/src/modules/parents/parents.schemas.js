import { z } from 'zod';

const nullableDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
    message: 'Tanggal lahir tidak valid',
  });

const nullableString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const baseParentBody = {
  familyId: z.coerce.number().int().positive().optional(),
  familyNumber: z.string().trim().min(8, 'No KK minimal 8 karakter').optional(),
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  nik: nullableString,
  birthDate: nullableDate,
  education: nullableString,
  occupation: nullableString,
  phone: nullableString,
};

export const parentCreateSchema = z.object({
  body: z
    .object(baseParentBody)
    .refine((value) => Number.isFinite(Number(value.familyId)) || Boolean(value.familyNumber), {
      message: 'Pilih keluarga berdasarkan No KK',
      path: ['familyNumber'],
    }),
  params: z.object({}),
  query: z.object({}),
});

export const parentUpdateSchema = z.object({
  body: z
    .object(baseParentBody)
    .refine((value) => Number.isFinite(Number(value.familyId)) || Boolean(value.familyNumber), {
      message: 'Pilih keluarga berdasarkan No KK',
      path: ['familyNumber'],
    }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});
