import { z } from 'zod';

export const sectionBaseSchema = z.object({
  code: z
    .string()
    .min(1, { message: 'Section code is required' })
    .max(50, { message: 'Section code must not exceed 50 characters' })
    .regex(/^[a-zA-Z0-9\-_]+$/, { message: 'Section code must contain only letters, numbers, dashes, and underscores' }),
  name: z
    .string()
    .min(2, { message: 'Section name must be at least 2 characters' })
    .max(100, { message: 'Section name must not exceed 100 characters' }),
  semesterId: z.coerce
    .number({ message: 'Semester is required' })
    .int()
    .positive({ message: 'Semester is required' }),
  programId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  departmentId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  academicYearId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  classAdvisorId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  capacity: z.coerce
    .number({ message: 'Capacity must be a number' })
    .int()
    .positive({ message: 'Capacity must be greater than 0' }),
  currentStrength: z.coerce
    .number({ message: 'Current strength must be a number' })
    .int()
    .nonnegative({ message: 'Current strength must be non-negative' })
    .default(0),
  shift: z.enum(['MORNING', 'EVENING'], {
    message: 'Shift must be MORNING or EVENING',
  }),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE',
  }).default('ACTIVE'),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters' })
    .optional()
    .nullable(),
});

export const createSectionSchema = sectionBaseSchema.refine(
  (data) => data.currentStrength <= data.capacity,
  {
    message: 'Current strength must not exceed capacity',
    path: ['currentStrength'],
  }
);

export const updateSectionSchema = sectionBaseSchema
  .partial()
  .refine(
    (data) => {
      if (data.currentStrength !== undefined && data.capacity !== undefined) {
        return data.currentStrength <= data.capacity;
      }
      return true;
    },
    {
      message: 'Current strength must not exceed capacity',
      path: ['currentStrength'],
    }
  );

export const updateSectionStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE',
  }),
});
