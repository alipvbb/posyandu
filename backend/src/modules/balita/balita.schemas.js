import { z } from 'zod';

const toddlerBody = z.object({
  code: z.string().min(3).optional(),
  familyMemberId: z.number().int().positive().optional().nullable(),
  fullName: z.string().min(3),
  nik: z.string().optional().nullable(),
  noKk: z.string().min(8).optional().nullable(),
  placeOfBirth: z.string().min(2),
  birthDate: z.coerce.date(),
  gender: z.enum(['MALE', 'FEMALE']),
  motherName: z.string().min(3),
  fatherName: z.string().min(3),
  familyId: z.number().int(),
  posyanduId: z.number().int(),
  address: z.string().min(5),
  hamletId: z.number().int(),
  rwId: z.number().int(),
  rtId: z.number().int(),
  parentPhone: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  photoUrl: z.string().url().optional().nullable(),
});

export const toddlerCreateSchema = z.object({
  body: toddlerBody,
});

export const toddlerUpdateSchema = z.object({
  params: z.object({
    id: z.coerce.number().int(),
  }),
  body: toddlerBody.partial(),
});
