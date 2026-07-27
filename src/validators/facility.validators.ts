import { z } from 'zod';

export const createBookingSchema = z.object({
  roomId: z.number().int().positive('Room ID is required'),
  bookedBy: z.string().trim().min(1, 'Booked by is required'),
  bookingPurpose: z.string().min(3, 'Purpose must be at least 3 characters').max(500),
  bookingDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid booking date format',
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time format (HH:MM)'),
  attendees: z.number().int().nonnegative('Attendees count must be non-negative').default(0),
  approvalStatus: z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled']).default('Pending'),
});

export const updateBookingSchema = createBookingSchema.partial();

export const createMaintenanceRequestSchema = z.object({
  buildingId: z.number().int().positive('Building ID is required'),
  roomId: z.number().int().positive().optional().nullable(),
  requestedBy: z.string().trim().min(1, 'Requested by email is required'),
  issueCategory: z.string().trim().min(2, 'Issue category is required'),
  issueDescription: z.string().min(5, 'Description must be at least 5 characters').max(1000),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  assignedTo: z.string().optional().nullable(),
  status: z.enum(['Open', 'Assigned', 'In Progress', 'Completed', 'Closed']).default('Open'),
});

export const updateMaintenanceRequestSchema = createMaintenanceRequestSchema.partial();
