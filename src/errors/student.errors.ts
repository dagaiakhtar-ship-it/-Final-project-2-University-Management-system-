import { AppError } from './auth.errors';

export class StudentNotFoundError extends AppError {
  constructor(message: string = 'Student profile not found') {
    super(message, 404, 'STUDENT_NOT_FOUND');
  }
}

export class DuplicateRollNumberError extends AppError {
  constructor(message: string = 'Roll Number must be unique') {
    super(message, 409, 'DUPLICATE_ROLL_NUMBER');
  }
}

export class DuplicateRegistrationNumberError extends AppError {
  constructor(message: string = 'Registration Number must be unique') {
    super(message, 409, 'DUPLICATE_REGISTRATION_NUMBER');
  }
}

export class DuplicateUserAssignmentError extends AppError {
  constructor(message: string = 'This user already has a student profile') {
    super(message, 409, 'DUPLICATE_USER_ASSIGNMENT');
  }
}

export class InvalidStudentRelationshipError extends AppError {
  constructor(message: string = 'Department, Program, Semester, Section or associated User does not exist or role is invalid') {
    super(message, 400, 'INVALID_STUDENT_RELATIONSHIP');
  }
}
