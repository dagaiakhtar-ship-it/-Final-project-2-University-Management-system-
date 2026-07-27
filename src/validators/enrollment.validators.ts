import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  studentId: z.coerce.number({ message: 'Student is required' }).int().positive('Student is required'),
  courseOfferingId: z.coerce.number({ message: 'Course Offering is required' }).int().positive('Course Offering is required'),
  academicYear: z.string().min(4, { message: 'Academic Year must be valid' }),
  session: z.enum(['Spring', 'Summer', 'Fall', 'Winter'], { message: 'Session is required' }),
  enrollmentDate: z.preprocess((val) => (val ? new Date(val as string) : new Date()), z.date()).optional(),
  status: z.enum(['Pending', 'Approved', 'Enrolled', 'Dropped', 'Withdrawn', 'Completed'], { message: 'Status must be a valid status' }).optional().default('Enrolled'),
  enrollmentType: z.enum(['Regular', 'Repeat', 'Improvement', 'Audit'], { message: 'Type must be valid' }).optional().default('Regular'),
  creditsRegistered: z.coerce.number().int().min(1, 'Credits must be at least 1').max(6, 'Credits cannot exceed 6').optional().default(3),
  tuitionStatus: z.enum(['Pending', 'Paid', 'Scholarship'], { message: 'Tuition status must be valid' }).optional().default('Pending'),
  advisorApproval: z.boolean().optional().default(false),
  registrarApproval: z.boolean().optional().default(false),
  remarks: z.string().max(500, { message: 'Remarks cannot exceed 500 characters' }).optional().nullable(),
});

export const updateEnrollmentSchema = createEnrollmentSchema.partial();

export const patchStatusSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Enrolled', 'Dropped', 'Withdrawn', 'Completed'], { message: 'Status is required' }),
});
