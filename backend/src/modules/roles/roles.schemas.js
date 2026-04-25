import { z } from 'zod';

export const rolePermissionUpdateSchema = z.object({
  params: z.object({
    id: z.coerce.number().int(),
  }),
  body: z.object({
    permissionIds: z.array(z.number().int()).optional(),
    permissionCodes: z.array(z.string()).optional(),
  }),
});

