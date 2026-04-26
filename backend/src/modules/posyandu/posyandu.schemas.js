import { z } from 'zod';

const nullableString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const hamletCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Nama dusun minimal 2 karakter'),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const hamletUpdateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Nama dusun minimal 2 karakter'),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const rwCreateSchema = z.object({
  body: z.object({
    hamletId: z.coerce.number().int().positive(),
    name: z.string().trim().min(2, 'Nama RW minimal 2 karakter'),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const rwUpdateSchema = z.object({
  body: z.object({
    hamletId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(2, 'Nama RW minimal 2 karakter').optional(),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const rtCreateSchema = z.object({
  body: z.object({
    rwId: z.coerce.number().int().positive(),
    name: z.string().trim().min(2, 'Nama RT minimal 2 karakter'),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const rtUpdateSchema = z.object({
  body: z.object({
    rwId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(2, 'Nama RT minimal 2 karakter').optional(),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const posyanduCreateSchema = z.object({
  body: z.object({
    hamletId: z.coerce.number().int().positive(),
    name: z.string().trim().min(2, 'Nama posyandu minimal 2 karakter'),
    locationAddress: nullableString,
    scheduleDay: nullableString,
    contactPhone: nullableString,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const posyanduUpdateSchema = z.object({
  body: z.object({
    hamletId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(2, 'Nama posyandu minimal 2 karakter').optional(),
    locationAddress: nullableString,
    scheduleDay: nullableString,
    contactPhone: nullableString,
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

