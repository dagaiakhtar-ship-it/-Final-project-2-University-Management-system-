import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Course name must be at least 3 characters' })
    .max(100, { message: 'Course name must not exceed 100 characters' })
    .trim(),
  code: z
    .string()
    .min(2, { message: 'Course code must be at least 2 characters' })
    .max(15, { message: 'Course code must not exceed 15 characters' })
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, { message: 'Code must be alphanumeric and can contain hyphens' })
    .trim(),
  credits: z
    .number()
    .int()
    .min(1, { message: 'Credits must be at least 1' })
    .max(10, { message: 'Credits cannot exceed 10' }),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters' })
    .trim()
    .optional()
    .nullable(),
  status: z
    .enum(['ACTIVE', 'INACTIVE'])
    .default('ACTIVE'),
});

export const updateCourseSchema = createCourseSchema.partial();
export const updateCourseStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
