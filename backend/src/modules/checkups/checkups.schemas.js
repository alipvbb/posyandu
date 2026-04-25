import { z } from 'zod';

export const checkupCreateSchema = z.object({
  params: z.object({
    id: z.coerce.number().int(),
  }),
  body: z.object({
    examDate: z.coerce.date(),
    ageInMonths: z.number().int().optional(),
    weight: z.number().positive(),
    height: z.number().positive(),
    headCircumference: z.number().positive().optional().nullable(),
    muac: z.number().positive().optional().nullable(),
    immunizationNote: z.string().optional().nullable(),
    vitaminPmtNote: z.string().optional().nullable(),
    complaintNote: z.string().optional().nullable(),
    officerName: z.string().min(3),
    posyanduId: z.number().int(),
    interventionTypeIds: z.array(z.number().int()).optional(),
    immunizationIds: z.array(z.number().int()).optional(),
  }),
});

export const checkupUpdateSchema = z.object({
  params: z.object({
    id: z.coerce.number().int(),
  }),
  body: checkupCreateSchema.shape.body.partial(),
});

