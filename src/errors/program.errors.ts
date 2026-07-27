import { AppError } from './auth.errors';

export class ProgramNotFoundError extends AppError {
  constructor(message: string = 'Program not found') {
    super(message, 404, 'PROGRAM_NOT_FOUND');
  }
}

export class DuplicateProgramError extends AppError {
  constructor(message: string) {
    super(message, 409, 'DUPLICATE_PROGRAM');
  }
}

export class DepartmentNotFoundError extends AppError {
  constructor(message: string = 'Department not found') {
    super(message, 404, 'DEPARTMENT_NOT_FOUND');
  }
}

export class TeacherNotFoundError extends AppError {
  constructor(message: string = 'Teacher not found') {
    super(message, 404, 'TEACHER_NOT_FOUND');
  }
}
