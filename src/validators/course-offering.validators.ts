import { z } from 'zod';

export const courseOfferingBaseSchema = z.object({
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
    .number({ message: 'Section is required' })
    .int()
    .positive({ message: 'Section is required' }),
  subjectId: z.coerce
    .number({ message: 'Subject is required' })
    .int()
    .positive({ message: 'Subject is required' }),
  teacherId: z.coerce
    .number({ message: 'Teacher is required' })
    .int()
    .positive({ message: 'Teacher is required' }),
  academicYear: z
    .string()
    .min(1, { message: 'Academic Year is required' })
    .max(50, { message: 'Academic Year must not exceed 50 characters' }),
  session: z.enum(['Spring', 'Fall', 'Summer'], {
    message: 'Session must be Spring, Fall, or Summer',
  }),
  startDate: z.coerce.date({ message: 'Valid Start Date is required' }),
  endDate: z.coerce.date({ message: 'Valid End Date is required' }),
  weeklyLectureHours: z.coerce
    .number({ message: 'Weekly Lecture Hours must be a number' })
    .int()
    .nonnegative({ message: 'Weekly Lecture Hours must be non-negative' }),
  weeklyLabHours: z.coerce
    .number({ message: 'Weekly Lab Hours must be a number' })
    .int()
    .nonnegative({ message: 'Weekly Lab Hours must be non-negative' }),
  maxStudents: z.coerce
    .number({ message: 'Maximum Students must be a number' })
    .int()
    .positive({ message: 'Maximum Students must be positive' }),
  status: z.enum(['Upcoming', 'Active', 'Completed', 'Cancelled'], {
    message: 'Status must be Upcoming, Active, Completed, or Cancelled',
  }).default('Upcoming'),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters' })
    .optional()
    .nullable(),
});

export const createCourseOfferingSchema = courseOfferingBaseSchema.refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'Start Date must be before End Date',
    path: ['endDate'],
  }
);

export const updateCourseOfferingSchema = courseOfferingBaseSchema
  .partial()
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start Date must be before End Date',
      path: ['endDate'],
    }
  );

export const updateCourseOfferingStatusSchema = z.object({
  status: z.enum(['Upcoming', 'Active', 'Completed', 'Cancelled'], {
    message: 'Status must be Upcoming, Active, Completed, or Cancelled',
  }),
});
