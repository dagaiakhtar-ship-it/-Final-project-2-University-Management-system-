import { AppError } from './auth.errors';

export class TimetableNotFoundError extends AppError {
  constructor(message: string = 'Timetable record not found') {
    super(message, 404, 'TIMETABLE_NOT_FOUND');
  }
}

export class BuildingNotFoundError extends AppError {
  constructor(message: string = 'Building not found') {
    super(message, 404, 'BUILDING_NOT_FOUND');
  }
}

export class RoomNotFoundError extends AppError {
  constructor(message: string = 'Room not found') {
    super(message, 404, 'ROOM_NOT_FOUND');
  }
}

export class TimeSlotNotFoundError extends AppError {
  constructor(message: string = 'Time Slot not found') {
    super(message, 404, 'TIME_SLOT_NOT_FOUND');
  }
}

export class DuplicateBuildingCodeError extends AppError {
  constructor(message: string = 'Building code already exists') {
    super(message, 409, 'DUPLICATE_BUILDING_CODE');
  }
}

export class DuplicateRoomNumberError extends AppError {
  constructor(message: string = 'Room number already exists in this building') {
    super(message, 409, 'DUPLICATE_ROOM_NUMBER');
  }
}

export class DuplicateTimeSlotError extends AppError {
  constructor(message: string = 'Time Slot already exists') {
    super(message, 409, 'DUPLICATE_TIME_SLOT');
  }
}

export class TeacherConflictError extends AppError {
  constructor(message: string = 'Teacher is already scheduled for another class in this time slot') {
    super(message, 409, 'TEACHER_CONFLICT');
  }
}

export class RoomConflictError extends AppError {
  constructor(message: string = 'Room is already scheduled for another class in this time slot') {
    super(message, 409, 'ROOM_CONFLICT');
  }
}

export class SectionConflictError extends AppError {
  constructor(message: string = 'Section is already scheduled for another class in this time slot') {
    super(message, 409, 'SECTION_CONFLICT');
  }
}

export class RoomFullError extends AppError {
  constructor(message: string = 'Room capacity is smaller than section size/enrollment') {
    super(message, 400, 'ROOM_FULL');
  }
}

export class InvalidTimeSlotError extends AppError {
  constructor(message: string = 'Invalid time slot or period number') {
    super(message, 400, 'INVALID_TIME_SLOT');
  }
}

export class InactiveCourseOfferingError extends AppError {
  constructor(message: string = 'Course offering is inactive or cancelled') {
    super(message, 400, 'INACTIVE_COURSE_OFFERING');
  }
}

export class LaboratoryRequirementError extends AppError {
  constructor(message: string = 'A Laboratory room type is required for this practical subject/session') {
    super(message, 400, 'LABORATORY_REQUIREMENT_ERROR');
  }
}
