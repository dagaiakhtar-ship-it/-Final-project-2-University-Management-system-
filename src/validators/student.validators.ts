import { z } from 'zod';

export const studentBaseSchema = z.object({
  userId: z.coerce
    .number({ message: 'User assignment is required' })
    .int()
    .positive({ message: 'User assignment is required' }),
  registrationNumber: z
    .string()
    .min(3, { message: 'Registration Number must be at least 3 characters' })
    .max(50, { message: 'Registration Number must not exceed 50 characters' }),
  rollNumber: z
    .string()
    .min(2, { message: 'Roll Number must be at least 2 characters' })
    .max(50, { message: 'Roll Number must not exceed 50 characters' }),
  idCardNumber: z
    .string()
    .max(50, { message: 'ID Card Number must not exceed 50 characters' })
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
  sectionId: z.coerce
    .number()
    .int()
    .optional()
    .nullable(),
  academicYearId: z.coerce
    .number({ message: 'Academic Year is required' })
    .int()
    .positive({ message: 'Academic Year is required' }),
  admissionSession: z
    .string()
    .max(50, { message: 'Admission session must not exceed 50 characters' })
    .optional()
    .nullable(),
  admissionDate: z.coerce
    .date()
    .optional()
    .nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'APPLIED', 'WITHDRAWN', 'ALUMNI'], {
    message: 'Status must be ACTIVE, INACTIVE, SUSPENDED, GRADUATED, APPLIED, WITHDRAWN, or ALUMNI',
  }).default('ACTIVE'),
  enrollmentStatus: z
    .string()
    .max(50)
    .optional()
    .nullable()
    .default('Pending'),
  
  // Personal Info
  fullName: z
    .string()
    .max(100, { message: 'Full name must not exceed 100 characters' })
    .optional()
    .nullable(),
  fatherName: z
    .string()
    .max(100, { message: 'Father name must not exceed 100 characters' })
    .optional()
    .nullable(),
  motherName: z
    .string()
    .max(100, { message: 'Mother name must not exceed 100 characters' })
    .optional()
    .nullable(),
  guardianRelationship: z
    .string()
    .max(50, { message: 'Guardian relationship must not exceed 50 characters' })
    .optional()
    .nullable(),
  dateOfBirth: z.coerce
    .date()
    .optional()
    .nullable(),
  gender: z
    .string()
    .max(20)
    .optional()
    .nullable(),
  bloodGroup: z
    .string()
    .max(10)
    .optional()
    .nullable(),
  nationality: z
    .string()
    .max(50)
    .optional()
    .nullable(),
  cnic: z
    .string()
    .max(50, { message: 'CNIC/B-Form must not exceed 50 characters' })
    .optional()
    .nullable(),
  
  // Contact Info
  email: z
    .string()
    .email({ message: 'Valid contact email is required' })
    .or(z.literal(''))
    .optional()
    .nullable(),
  mobileNumber: z
    .string()
    .max(20, { message: 'Mobile number must not exceed 20 characters' })
    .optional()
    .nullable(),
  emergencyContact: z
    .string()
    .max(100, { message: 'Emergency contact must not exceed 100 characters' })
    .optional()
    .nullable(),
  permanentAddress: z
    .string()
    .max(500, { message: 'Permanent address must not exceed 500 characters' })
    .optional()
    .nullable(),
  currentAddress: z
    .string()
    .max(500, { message: 'Current address must not exceed 500 characters' })
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  province: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(20)
    .optional()
    .nullable(),
  
  // Academic History
  previousInstitution: z
    .string()
    .max(200)
    .optional()
    .nullable(),
  previousQualification: z
    .string()
    .max(200)
    .optional()
    .nullable(),
  previousCgpa: z.coerce
    .number()
    .nonnegative()
    .optional()
    .nullable(),
  admissionMeritNumber: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  
  // Preferences/Facilities
  scholarshipStatus: z
    .string()
    .max(50)
    .optional()
    .nullable(),
  hostelStatus: z
    .string()
    .max(50)
    .optional()
    .nullable(),
  transportStatus: z
    .string()
    .max(50)
    .optional()
    .nullable(),
  medicalNotes: z
    .string()
    .max(1000)
    .optional()
    .nullable(),
  
  // Media
  studentPhoto: z
    .string()
    .url({ message: 'Student photo must be a valid URL' })
    .or(z.literal(''))
    .optional()
    .nullable(),
  signatureImage: z
    .string()
    .url({ message: 'Signature must be a valid URL' })
    .or(z.literal(''))
    .optional()
    .nullable(),
});

export const createStudentSchema = studentBaseSchema;

export const updateStudentSchema = studentBaseSchema.partial();

export const updateStudentStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'APPLIED', 'WITHDRAWN', 'ALUMNI'], {
    message: 'Status must be ACTIVE, INACTIVE, SUSPENDED, GRADUATED, APPLIED, WITHDRAWN, or ALUMNI',
  }),
});
