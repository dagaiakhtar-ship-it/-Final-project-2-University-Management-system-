import { z } from 'zod';

export const createProgramSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Program name must be at least 3 characters' })
    .max(100, { message: 'Program name must not exceed 100 characters' })
    .trim(),
  code: z
    .string()
    .min(2, { message: 'Program code must be at least 2 characters' })
    .max(15, { message: 'Program code must not exceed 15 characters' })
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, { message: 'Code must be alphanumeric and can contain hyphens' })
    .trim(),
  shortName: z
    .string()
    .max(15, { message: 'Short name must not exceed 15 characters' })
    .toUpperCase()
    .trim()
    .optional()
    .nullable(),
  degreeLevel: z.enum(['Diploma', 'Associate', 'BS', 'MS', 'MPhil', 'PhD'], {
    message: 'Invalid degree level',
  }),
  departmentId: z.coerce
    .number({ message: 'Please select a valid department' })
    .int()
    .positive({ message: 'Please select a valid department' }),
  duration: z.coerce
    .number({ message: 'Duration must be a number' })
    .int({ message: 'Duration must be a whole number' })
    .min(1, { message: 'Duration must be at least 1 year' })
    .max(10, { message: 'Duration must not exceed 10 years' }),
  totalSemesters: z.coerce
    .number({ message: 'Total semesters must be a number' })
    .int({ message: 'Total semesters must be a whole number' })
    .min(1, { message: 'Must have at least 1 semester' })
    .max(20, { message: 'Must not exceed 20 semesters' }),
  creditHours: z.coerce
    .number({ message: 'Credit hours must be a number' })
    .int({ message: 'Credit hours must be a whole number' })
    .min(1, { message: 'Must have at least 1 credit hour' })
    .max(300, { message: 'Must not exceed 300 credit hours' }),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters' })
    .trim()
    .optional()
    .nullable(),
  coordinatorId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || isNaN(Number(val)) || Number(val) === 0 ? null : Number(val)),
    z.number().int().positive().optional().nullable()
  ),
  status: z
    .enum(['ACTIVE', 'INACTIVE'])
    .default('ACTIVE'),
});

export const updateProgramSchema = createProgramSchema.partial().omit({
  code: true, // Programs codes generally do not change, but let's allow it optionally if needed
}).extend({
  code: z
    .string()
    .min(2, { message: 'Program code must be at least 2 characters' })
    .max(15, { message: 'Program code must not exceed 15 characters' })
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, { message: 'Code must be alphanumeric and can contain hyphens' })
    .trim()
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateProgramStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Status must be ACTIVE or INACTIVE' }),
});
