import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Department name must be at least 3 characters' })
    .max(100, { message: 'Department name must not exceed 100 characters' })
    .trim(),
  code: z
    .string()
    .min(2, { message: 'Department code must be at least 2 characters' })
    .max(10, { message: 'Department code must not exceed 10 characters' })
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, { message: 'Code must be alphanumeric and can contain hyphens' })
    .trim(),
  shortName: z
    .string()
    .max(10, { message: 'Short name must not exceed 10 characters' })
    .toUpperCase()
    .trim()
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters' })
    .trim()
    .optional()
    .nullable(),
  faculty: z
    .string()
    .max(100, { message: 'Faculty name must not exceed 100 characters' })
    .trim()
    .optional()
    .nullable(),
  officeLocation: z
    .string()
    .max(100, { message: 'Office location must not exceed 100 characters' })
    .trim()
    .optional()
    .nullable(),
  officePhone: z
    .string()
    .regex(/^(\+?[0-9\s-]{7,20})?$/, { message: 'Invalid phone number format' })
    .trim()
    .optional()
    .nullable(),
  officeEmail: z
    .string()
    .email({ message: 'Invalid email address' })
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  headOfDepartmentId: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  status: z
    .enum(['ACTIVE', 'INACTIVE'])
    .default('ACTIVE'),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().omit({
  code: true, // Typically department codes shouldn't change after creation, but let's allow partial update or make code read-only
}).extend({
  // If they want to update code, let's keep code optional but validated if provided
  code: z
    .string()
    .min(2, { message: 'Department code must be at least 2 characters' })
    .max(10, { message: 'Department code must not exceed 10 characters' })
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, { message: 'Code must be alphanumeric and can contain hyphens' })
    .trim()
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Status must be ACTIVE or INACTIVE' }),
});
