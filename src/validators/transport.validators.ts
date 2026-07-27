import { z } from 'zod';

export const createVehicleSchema = z.object({
  vehicleNumber: z
    .string()
    .trim()
    .min(1, 'Vehicle number is required')
    .max(50, 'Vehicle number must not exceed 50 characters'),
  registrationNumber: z
    .string()
    .trim()
    .min(1, 'Registration number is required')
    .max(100, 'Registration number must not exceed 100 characters'),
  vehicleType: z.enum(['Bus', 'Van', 'Mini Bus'], {
    message: 'Vehicle type must be Bus, Van, or Mini Bus',
  }),
  manufacturer: z
    .string()
    .trim()
    .min(1, 'Manufacturer is required')
    .max(100, 'Manufacturer must not exceed 100 characters'),
  model: z
    .string()
    .trim()
    .min(1, 'Model is required')
    .max(100, 'Model must not exceed 100 characters'),
  year: z.coerce
    .number({ message: 'Year is required' })
    .int()
    .min(1900, 'Year must be greater than 1900')
    .max(new Date().getFullYear() + 2, 'Year cannot be too far in the future'),
  seatingCapacity: z.coerce
    .number({ message: 'Seating capacity is required' })
    .int()
    .positive('Seating capacity must be a positive integer'),
  fuelType: z
    .string()
    .trim()
    .min(1, 'Fuel type is required')
    .max(50, 'Fuel type must not exceed 50 characters'),
  insuranceExpiry: z.coerce.date({ message: 'Insurance expiry date is required' }),
  fitnessExpiry: z.coerce.date({ message: 'Fitness expiry date is required' }),
  status: z.enum(['Active', 'Maintenance', 'Out of Service']).optional().default('Active'),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const createDriverSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .min(5, 'Phone number is too short')
    .max(20, 'Phone number must not exceed 20 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters'),
  licenseNumber: z
    .string()
    .trim()
    .min(1, 'License number is required')
    .max(100, 'License number must not exceed 100 characters'),
  licenseExpiry: z.coerce.date({ message: 'License expiry date is required' }),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(255, 'Address must not exceed 255 characters'),
  emergencyContact: z
    .string()
    .trim()
    .min(1, 'Emergency contact is required')
    .max(100, 'Emergency contact must not exceed 100 characters'),
  assignedVehicleId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  status: z.enum(['Active', 'Leave', 'Suspended']).optional().default('Active'),
});

export const updateDriverSchema = createDriverSchema.partial();

export const createStopSchema = z.object({
  routeId: z.coerce
    .number({ message: 'Route association is required' })
    .int()
    .positive(),
  stopName: z
    .string()
    .trim()
    .min(1, 'Stop name is required')
    .max(100, 'Stop name must not exceed 100 characters'),
  latitude: z.coerce.number({ message: 'Latitude is required' }),
  longitude: z.coerce.number({ message: 'Longitude is required' }),
  arrivalTime: z
    .string()
    .trim()
    .min(1, 'Arrival time is required'),
  departureTime: z
    .string()
    .trim()
    .min(1, 'Departure time is required'),
  sequence: z.coerce
    .number({ message: 'Sequence is required' })
    .int()
    .min(1, 'Sequence must be at least 1'),
});

export const createRouteSchema = z.object({
  routeName: z
    .string()
    .trim()
    .min(1, 'Route name is required')
    .max(100, 'Route name must not exceed 100 characters'),
  routeCode: z
    .string()
    .trim()
    .min(1, 'Route code is required')
    .max(50, 'Route code must not exceed 50 characters'),
  startLocation: z
    .string()
    .trim()
    .min(1, 'Start location is required')
    .max(100, 'Start location must not exceed 100 characters'),
  endLocation: z
    .string()
    .trim()
    .min(1, 'End location is required')
    .max(100, 'End location must not exceed 100 characters'),
  estimatedDistance: z.coerce
    .number({ message: 'Estimated distance is required' })
    .positive('Estimated distance must be positive'),
  estimatedTime: z
    .string()
    .trim()
    .min(1, 'Estimated time is required'),
  fare: z.coerce
    .number()
    .min(0, 'Fare must be non-negative')
    .optional()
    .default(0.0),
  active: z.boolean().optional().default(true),
  stops: z.array(createStopSchema.omit({ routeId: true })).optional(),
});

export const updateRouteSchema = createRouteSchema.partial();

export const registerTransportSchema = z.object({
  studentId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  employeeId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  routeId: z.coerce
    .number({ message: 'Route selection is required' })
    .int()
    .positive(),
  pickupStopId: z.coerce
    .number({ message: 'Pickup stop is required' })
    .int()
    .positive(),
  dropStopId: z.coerce
    .number({ message: 'Drop stop is required' })
    .int()
    .positive(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
});

export const createMaintenanceSchema = z.object({
  vehicleId: z.coerce
    .number({ message: 'Vehicle selection is required' })
    .int()
    .positive(),
  maintenanceType: z
    .string()
    .trim()
    .min(1, 'Maintenance type is required')
    .max(100),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(1000),
  maintenanceCost: z.coerce
    .number()
    .min(0, 'Cost must be non-negative')
    .optional()
    .default(0.0),
  status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).optional().default('Scheduled'),
  completedAt: z.coerce.date().optional().nullable(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();

export const createFuelLogSchema = z.object({
  vehicleId: z.coerce
    .number({ message: 'Vehicle selection is required' })
    .int()
    .positive(),
  fuelQuantity: z.coerce
    .number({ message: 'Fuel quantity is required' })
    .positive('Quantity must be positive'),
  cost: z.coerce
    .number({ message: 'Cost is required' })
    .positive('Cost must be positive'),
  odometerReading: z.coerce
    .number({ message: 'Odometer reading is required' })
    .positive('Odometer must be positive'),
  remarks: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable(),
});

export const createTripLogSchema = z.object({
  vehicleId: z.coerce
    .number({ message: 'Vehicle selection is required' })
    .int()
    .positive(),
  driverId: z.coerce
    .number({ message: 'Driver selection is required' })
    .int()
    .positive(),
  routeId: z.coerce
    .number({ message: 'Route selection is required' })
    .int()
    .positive(),
  status: z.enum(['Scheduled', 'Ongoing', 'Completed', 'Cancelled']).optional().default('Completed'),
  startOdometer: z.coerce.number().optional().nullable(),
  endOdometer: z.coerce.number().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const markAttendanceSchema = z.object({
  registrationId: z.coerce
    .number({ message: 'Registration selection is required' })
    .int()
    .positive(),
  driverId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  status: z.enum(['Present', 'Absent']).optional().default('Present'),
  direction: z.enum(['Pickup', 'Drop']).optional().default('Pickup'),
});
