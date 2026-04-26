import { z } from 'zod';

export const userCreateSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    password: z.string().min(6),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    villageId: z.number().int().positive().optional(),
    roleIds: z.array(z.number().int()).optional(),
    roleCodes: z.array(z.string()).optional(),
  }),
});

export const userUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    password: z.string().min(6).optional(),
    villageId: z.number().int().positive().optional().nullable(),
    roleIds: z.array(z.number().int()).optional(),
    roleCodes: z.array(z.string()).optional(),
  }),
  params: z.object({
    id: z.coerce.number().int(),
  }),
});
