import { z } from 'zod';

export const createParentSchema = z.object({
  userId: z.number().int().positive(),
  relation: z.string().min(2).max(50).trim(),
  occupation: z.string().max(100).optional(),
  studentIds: z.array(z.number().int().positive()).optional(),
});

export const updateParentSchema = createParentSchema.partial();
