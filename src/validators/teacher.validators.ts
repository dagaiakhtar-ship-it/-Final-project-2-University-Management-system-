import { z } from 'zod';

export const teacherBaseSchema = z.object({
  userId: z.coerce
    .number({ message: 'User assignment is required' })
    .int()
    .positive({ message: 'User assignment is required' }),
  employeeId: z
    .string()
    .min(2, { message: 'Employee ID must be at least 2 characters' })
    .max(50, { message: 'Employee ID must not exceed 50 characters' }),
  departmentId: z.coerce
    .number({ message: 'Department is required' })
    .int()
    .positive({ message: 'Department is required' }),
  designation: z
    .string()
    .min(2, { message: 'Designation must be at least 2 characters' })
    .max(100, { message: 'Designation must not exceed 100 characters' })
    .optional()
    .nullable(),
  employmentType: z.enum(['Permanent', 'Contract', 'Visiting'], {
    message: 'Employment Type must be Permanent, Contract, or Visiting',
  }),
  qualification: z
    .string()
    .min(2, { message: 'Qualification must be at least 2 characters' })
    .max(200, { message: 'Qualification must not exceed 200 characters' })
    .optional()
    .nullable(),
  specialization: z
    .string()
    .max(200, { message: 'Specialization must not exceed 200 characters' })
    .optional()
    .nullable(),
  experience: z.coerce
    .number({ message: 'Experience must be a number' })
    .int()
    .nonnegative({ message: 'Experience cannot be negative' })
    .optional()
    .nullable(),
  joiningDate: z.coerce
    .date({ message: 'Valid joining date is required' })
    .optional()
    .nullable(),
  officeLocation: z
    .string()
    .max(200, { message: 'Office location must not exceed 200 characters' })
    .optional()
    .nullable(),
  officePhone: z
    .string()
    .max(20, { message: 'Office phone must not exceed 20 characters' })
    .optional()
    .nullable(),
  profilePhoto: z
    .string()
    .url({ message: 'Profile photo must be a valid URL' })
    .optional()
    .nullable()
    .or(z.literal('')),
  cnic: z
    .string()
    .max(50, { message: 'CNIC/National ID must not exceed 50 characters' })
    .optional()
    .nullable(),
  emergencyContact: z
    .string()
    .max(100, { message: 'Emergency contact must not exceed 100 characters' })
    .optional()
    .nullable(),
  biography: z
    .string()
    .max(1000, { message: 'Biography must not exceed 10000 characters' })
    .optional()
    .nullable(),
  status: z.enum(['Active', 'On Leave', 'Retired', 'Suspended'], {
    message: 'Status must be Active, On Leave, Retired, or Suspended',
  }).default('Active'),
});

export const createTeacherSchema = teacherBaseSchema;

export const updateTeacherSchema = teacherBaseSchema.partial();

export const updateTeacherStatusSchema = z.object({
  status: z.enum(['Active', 'On Leave', 'Retired', 'Suspended'], {
    message: 'Status must be Active, On Leave, Retired, or Suspended',
  }),
});
