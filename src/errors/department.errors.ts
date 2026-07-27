import { AppError } from './auth.errors';

export class DepartmentNotFoundError extends AppError {
  constructor(message: string = 'Department not found') {
    super(message, 404, 'DEPARTMENT_NOT_FOUND');
  }
}

export class DuplicateDepartmentError extends AppError {
  constructor(message: string) {
    super(message, 409, 'DUPLICATE_DEPARTMENT');
  }
}

export class TeacherNotFoundError extends AppError {
  constructor(message: string = 'Teacher not found') {
    super(message, 404, 'TEACHER_NOT_FOUND');
  }
}
