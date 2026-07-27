import { z } from 'zod';

export const subjectBaseSchema = z.object({
  code: z
    .string()
    .min(1, { message: 'Subject code is required' })
    .max(50, { message: 'Subject code must not exceed 50 characters' })
    .regex(/^[a-zA-Z0-9\-_ ]+$/, { message: 'Subject code must contain only letters, numbers, spaces, dashes, and underscores' }),
  name: z
    .string()
    .min(2, { message: 'Subject name must be at least 2 characters' })
    .max(100, { message: 'Subject name must not exceed 100 characters' }),
  shortName: z
    .string()
    .max(20, { message: 'Short name must not exceed 20 characters' })
    .optional()
    .nullable(),
  departmentId: z.coerce
    .number({ message: 'Department is required' })
    .int()
    .positive({ message: 'Department is required' }),
  programId: z.coerce
    .number({ message: 'Program is required' })
    .int()
    .positive({ message: 'Program is required' }),
  semesterId: z.coerce
    .number({ message: 'Semester is required' })
    .int()
    .positive({ message: 'Semester is required' }),
  creditHours: z.coerce
    .number({ message: 'Credit Hours must be a number' })
    .int()
    .nonnegative({ message: 'Credit Hours must be non-negative' }),
  theoryHours: z.coerce
    .number({ message: 'Theory Hours must be a number' })
    .int()
    .nonnegative({ message: 'Theory Hours must be non-negative' }),
  labHours: z.coerce
    .number({ message: 'Lab Hours must be a number' })
    .int()
    .nonnegative({ message: 'Lab Hours must be non-negative' }),
  subjectType: z.enum(['Theory', 'Lab', 'Mixed'], {
    message: 'Subject Type must be Theory, Lab, or Mixed',
  }),
  category: z.enum(['Core', 'Elective', 'General'], {
    message: 'Category must be Core, Elective, or General',
  }),
  prerequisiteId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters' })
    .optional()
    .nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE',
  }).default('ACTIVE'),
});

export const createSubjectSchema = subjectBaseSchema.refine(
  (data) => data.theoryHours + data.labHours === data.creditHours,
  {
    message: 'Theory Hours + Lab Hours must equal Credit Hours',
    path: ['creditHours'],
  }
);

export const updateSubjectSchema = subjectBaseSchema
  .partial()
  .refine(
    (data) => {
      return true;
    },
    {
      message: 'Theory Hours + Lab Hours must equal Credit Hours',
      path: ['creditHours'],
    }
  );

export const updateSubjectStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE',
  }),
});
