import { z } from 'zod';

// Building Schemas
export const createBuildingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  code: z.string().min(2, 'Code must be at least 2 characters').max(20).toUpperCase().trim(),
  campus: z.string().min(2, 'Campus name must be at least 2 characters').max(100).trim(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

export const updateBuildingSchema = createBuildingSchema.partial();

// Room Schemas
export const createRoomSchema = z.object({
  buildingId: z.number().int().positive('Building ID is required'),
  roomNumber: z.string().min(1, 'Room number is required').max(20).trim(),
  roomType: z.enum(['Classroom', 'Laboratory', 'Seminar Hall', 'Auditorium']),
  capacity: z.number().int().positive('Capacity must be positive'),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  departmentId: z.number().int().positive().optional().nullable(),
});

export const updateRoomSchema = createRoomSchema.partial();

// TimeSlot Schemas
export const createTimeSlotSchema = z.object({
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time format (HH:MM)'),
  periodNumber: z.number().int().positive('Period number must be positive'),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

export const updateTimeSlotSchema = createTimeSlotSchema.partial();

// Timetable Schemas
export const createTimetableSchema = z.object({
  courseOfferingId: z.number().int().positive('Course Offering ID is required'),
  teacherId: z.number().int().positive('Teacher ID is required'),
  subjectId: z.number().int().positive('Subject ID is required'),
  sectionId: z.number().int().positive('Section ID is required'),
  roomId: z.number().int().positive('Room ID is required'),
  timeSlotId: z.number().int().positive('Time Slot ID is required'),
  academicYear: z.string().min(4, 'Academic year is required').max(20).trim(),
  session: z.string().min(2, 'Session is required').max(20).trim(),
  weeklyRepeat: z.boolean().default(true),
  effectiveFrom: z.string().or(z.date()).refine((val) => !isNaN(Date.parse(val.toString())), {
    message: 'Invalid effective from date format',
  }),
  effectiveTo: z.string().or(z.date()).refine((val) => !isNaN(Date.parse(val.toString())), {
    message: 'Invalid effective to date format',
  }),
  status: z.enum(['Active', 'Suspended', 'Cancelled']).default('Active'),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional().nullable(),
});

export const updateTimetableSchema = createTimetableSchema.partial();

export const patchTimetableStatusSchema = z.object({
  status: z.enum(['Active', 'Suspended', 'Cancelled'], { message: 'Status must be Active, Suspended, or Cancelled' }),
});
