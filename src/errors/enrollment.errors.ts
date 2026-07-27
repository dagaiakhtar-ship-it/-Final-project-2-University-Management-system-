import { AppError } from './auth.errors';

export class EnrollmentNotFoundError extends AppError {
  constructor(message: string = 'Enrollment record not found') {
    super(message, 404, 'ENROLLMENT_NOT_FOUND');
  }
}

export class DuplicateEnrollmentError extends AppError {
  constructor(message: string = 'Student is already enrolled in this course offering') {
    super(message, 409, 'DUPLICATE_ENROLLMENT');
  }
}

export class CreditLimitExceededError extends AppError {
  constructor(message: string = 'Enrolling in this course would exceed the maximum registered credit limit') {
    super(message, 400, 'CREDIT_LIMIT_EXCEEDED');
  }
}

export class CourseOfferingFullError extends AppError {
  constructor(message: string = 'This course offering has reached its maximum enrollment capacity') {
    super(message, 400, 'COURSE_OFFERING_FULL');
  }
}

export class InactiveCourseOfferingError extends AppError {
  constructor(message: string = 'Cannot enroll in an inactive or completed course offering') {
    super(message, 400, 'INACTIVE_COURSE_OFFERING');
  }
}

export class InactiveStudentError extends AppError {
  constructor(message: string = 'Cannot enroll an inactive or suspended student') {
    super(message, 400, 'INACTIVE_STUDENT');
  }
}
