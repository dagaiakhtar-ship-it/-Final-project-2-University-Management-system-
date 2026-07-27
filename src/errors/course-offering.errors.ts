import { AppError } from './auth.errors';

export class CourseOfferingNotFoundError extends AppError {
  constructor(message: string = 'Course offering not found') {
    super(message, 404, 'COURSE_OFFERING_NOT_FOUND');
  }
}

export class DuplicateCourseOfferingError extends AppError {
  constructor(message: string = 'Course offering already exists for this subject, section and semester') {
    super(message, 409, 'DUPLICATE_COURSE_OFFERING');
  }
}

export class InvalidCourseOfferingRelationshipError extends AppError {
  constructor(message: string = 'One or more academic entities referenced do not exist') {
    super(message, 400, 'INVALID_COURSE_OFFERING_RELATIONSHIP');
  }
}

export class TeacherConflictError extends AppError {
  constructor(message: string = 'Teacher has a scheduling or assignment conflict') {
    super(message, 409, 'TEACHER_CONFLICT');
  }
}

export class InvalidDatesError extends AppError {
  constructor(message: string = 'Start date must be before end date') {
    super(message, 400, 'INVALID_OFFERING_DATES');
  }
}
