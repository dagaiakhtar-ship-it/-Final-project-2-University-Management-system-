import { AppError } from './auth.errors';

export class TeacherNotFoundError extends AppError {
  constructor(message: string = 'Teacher profile not found') {
    super(message, 404, 'TEACHER_NOT_FOUND');
  }
}

export class DuplicateEmployeeIdError extends AppError {
  constructor(message: string = 'Employee ID must be unique') {
    super(message, 409, 'DUPLICATE_EMPLOYEE_ID');
  }
}

export class DuplicateUserAssignmentError extends AppError {
  constructor(message: string = 'This user already has a teacher profile') {
    super(message, 409, 'DUPLICATE_USER_ASSIGNMENT');
  }
}

export class InvalidTeacherRelationshipError extends AppError {
  constructor(message: string = 'Department or associated User does not exist or role is invalid') {
    super(message, 400, 'INVALID_TEACHER_RELATIONSHIP');
  }
}
