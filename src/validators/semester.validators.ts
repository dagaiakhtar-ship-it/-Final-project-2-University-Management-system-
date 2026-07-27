import { z } from 'zod';

export const semesterBaseSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Semester name must be at least 2 characters' })
    .max(100, { message: 'Semester name must not exceed 100 characters' }),
  code: z
    .string()
    .min(2, { message: 'Semester code must be at least 2 characters' })
    .max(50, { message: 'Semester code must not exceed 50 characters' }),
  semesterNumber: z.coerce
    .number({ message: 'Semester number must be a number' })
    .int({ message: 'Semester number must be an integer' })
    .min(1, { message: 'Semester number must be at least 1' })
    .max(20, { message: 'Semester number must not exceed 20' }),
  programId: z.coerce
    .number({ message: 'Please select a valid program' })
    .int()
    .positive({ message: 'Please select a valid program' }),
  academicYearId: z.coerce
    .number({ message: 'Please select a valid academic year' })
    .int()
    .positive({ message: 'Please select a valid academic year' }),
  startDate: z.coerce.date({ message: 'Invalid start date format' }),
  endDate: z.coerce.date({ message: 'Invalid end date format' }),
  registrationStartDate: z.coerce.date({ message: 'Invalid registration start date format' }),
  registrationEndDate: z.coerce.date({ message: 'Invalid registration end date format' }),
  minCreditHours: z.coerce
    .number({ message: 'Minimum credit hours must be a number' })
    .int({ message: 'Minimum credit hours must be a whole number' })
    .min(0, { message: 'Minimum credit hours must be at least 0' })
    .max(30, { message: 'Minimum credit hours cannot exceed 30' }),
  maxCreditHours: z.coerce
    .number({ message: 'Maximum credit hours must be a number' })
    .int({ message: 'Maximum credit hours must be a whole number' })
    .min(1, { message: 'Maximum credit hours must be at least 1' })
    .max(30, { message: 'Maximum credit hours cannot exceed 30' }),
  semesterType: z.enum(['REGULAR', 'SUMMER', 'WINTER'], {
    message: 'Invalid semester type',
  }),
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'SUSPENDED', 'ARCHIVED'], {
    message: 'Invalid semester status',
  }).default('UPCOMING'),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters' })
    .optional()
    .nullable(),
});

export const createSemesterSchema = semesterBaseSchema
  .refine((data) => data.startDate < data.endDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })
  .refine((data) => data.registrationStartDate < data.registrationEndDate, {
    message: 'Registration end date must be after registration start date',
    path: ['registrationEndDate'],
  })
  .refine((data) => data.maxCreditHours >= data.minCreditHours, {
    message: 'Maximum credit hours must be greater than or equal to minimum credit hours',
    path: ['maxCreditHours'],
  });

export const updateSemesterSchema = semesterBaseSchema
  .partial()
  .refine((data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })
  .refine((data) => {
    if (data.registrationStartDate && data.registrationEndDate) {
      return data.registrationStartDate < data.registrationEndDate;
    }
    return true;
  }, {
    message: 'Registration end date must be after registration start date',
    path: ['registrationEndDate'],
  })
  .refine((data) => {
    if (data.maxCreditHours !== undefined && data.minCreditHours !== undefined) {
      return data.maxCreditHours >= data.minCreditHours;
    }
    return true;
  }, {
    message: 'Maximum credit hours must be greater than or equal to minimum credit hours',
    path: ['maxCreditHours'],
  });

export const updateSemesterStatusSchema = z.object({
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'SUSPENDED', 'ARCHIVED'], {
    message: 'Invalid semester status',
  }),
});
