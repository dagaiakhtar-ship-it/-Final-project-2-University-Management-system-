import { z } from 'zod';

export const createBuildingSchema = z.object({
  buildingCode: z
    .string()
    .trim()
    .min(1, 'Building code is required')
    .max(50, 'Building code must not exceed 50 characters'),
  buildingName: z
    .string()
    .trim()
    .min(1, 'Building name is required')
    .max(100, 'Building name must not exceed 100 characters'),
  gender: z.enum(['Male', 'Female', 'Mixed', 'MALE', 'FEMALE', 'MIXED'], {
    message: 'Gender must be Male, Female, or Mixed',
  }),
  address: z
    .string()
    .max(255, 'Address must not exceed 255 characters')
    .optional()
    .nullable(),
  totalFloors: z.coerce
    .number({ message: 'Total floors is required' })
    .int()
    .positive('Total floors must be a positive integer'),
  wardenId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  status: z
    .string()
    .max(50)
    .optional()
    .default('Active'),
});

export const updateBuildingSchema = createBuildingSchema.partial();

export const createRoomSchema = z.object({
  buildingId: z.coerce
    .number({ message: 'Building association is required' })
    .int()
    .positive('Building association is required'),
  floorNumber: z.coerce
    .number({ message: 'Floor number is required' })
    .int()
    .min(0, 'Floor number must be non-negative'),
  roomNumber: z
    .string()
    .trim()
    .min(1, 'Room number is required')
    .max(50, 'Room number must not exceed 50 characters'),
  roomType: z
    .string()
    .trim()
    .min(1, 'Room type is required')
    .max(50, 'Room type must not exceed 50 characters'),
  capacity: z.coerce
    .number({ message: 'Room capacity is required' })
    .int()
    .positive('Room capacity must be at least 1'),
  monthlyFee: z.coerce
    .number()
    .min(0, 'Monthly fee must be non-negative')
    .optional()
    .default(0.0),
  status: z
    .string()
    .max(50)
    .optional()
    .default('Available'),
});

export const updateRoomSchema = createRoomSchema.partial();

export const createAllocationSchema = z.object({
  studentId: z.coerce
    .number({ message: 'Student association is required' })
    .int()
    .positive('Student association is required'),
  buildingId: z.coerce
    .number({ message: 'Building association is required' })
    .int()
    .positive('Building association is required'),
  roomId: z.coerce
    .number({ message: 'Room association is required' })
    .int()
    .positive('Room association is required'),
  bedNumber: z
    .string()
    .trim()
    .min(1, 'Bed number is required')
    .max(50, 'Bed number must not exceed 50 characters'),
  allocationDate: z.coerce
    .date()
    .optional(),
  expectedCheckout: z.coerce
    .date()
    .optional()
    .nullable(),
  status: z
    .string()
    .max(50)
    .optional()
    .default('Active'),
  remarks: z
    .string()
    .max(1000, 'Remarks must not exceed 1000 characters')
    .optional()
    .nullable(),
});

export const transferAllocationSchema = z.object({
  targetRoomId: z.coerce
    .number({ message: 'Target room association is required' })
    .int()
    .positive('Target room association is required'),
  bedNumber: z
    .string()
    .trim()
    .min(1, 'Bed number is required')
    .max(50, 'Bed number must not exceed 50 characters'),
  remarks: z
    .string()
    .max(1000, 'Remarks must not exceed 1000 characters')
    .optional()
    .nullable(),
});

export const createVisitorSchema = z.object({
  studentId: z.coerce
    .number({ message: 'Student association is required' })
    .int()
    .positive('Student association is required'),
  visitorName: z
    .string()
    .trim()
    .min(1, 'Visitor name is required')
    .max(100, 'Visitor name must not exceed 100 characters'),
  relationship: z
    .string()
    .trim()
    .min(1, 'Relationship description is required')
    .max(100, 'Relationship must not exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .min(5, 'Phone number must be at least 5 characters')
    .max(20, 'Phone number must not exceed 20 characters'),
  remarks: z
    .string()
    .max(1000, 'Remarks must not exceed 1000 characters')
    .optional()
    .nullable(),
  approvedBy: z
    .string()
    .max(100, 'Approved By must not exceed 100 characters')
    .optional()
    .nullable(),
});

export const createComplaintSchema = z.object({
  studentId: z.coerce
    .number({ message: 'Student association is required' })
    .int()
    .positive('Student association is required'),
  roomId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  title: z
    .string()
    .trim()
    .min(1, 'Complaint title is required')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Complaint description is required')
    .max(2000, 'Description must not exceed 2000 characters'),
  category: z
    .string()
    .trim()
    .min(1, 'Complaint category is required')
    .max(100, 'Category must not exceed 100 characters'),
});

export const updateComplaintSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Resolved', 'Rejected'], {
    message: 'Status must be Pending, In Progress, Resolved, or Rejected',
  }).optional(),
  remarks: z
    .string()
    .max(1000, 'Remarks must not exceed 1000 characters')
    .optional()
    .nullable(),
});

export const createMaintenanceSchema = z.object({
  roomId: z.coerce
    .number({ message: 'Room association is required' })
    .int()
    .positive('Room association is required'),
  title: z
    .string()
    .trim()
    .min(1, 'Maintenance title is required')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Maintenance description is required')
    .max(2000, 'Description must not exceed 2000 characters'),
  category: z
    .string()
    .trim()
    .min(1, 'Category is required')
    .max(100, 'Category must not exceed 100 characters'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'], {
    message: 'Priority must be Low, Medium, High, or Urgent',
  }),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'], {
    message: 'Status must be Pending, Scheduled, In Progress, Completed, or Cancelled',
  }).optional(),
  cost: z.coerce
    .number()
    .min(0, 'Maintenance cost must be non-negative')
    .optional(),
  remarks: z
    .string()
    .max(1000, 'Remarks must not exceed 1000 characters')
    .optional()
    .nullable(),
});
