import { AppError } from './auth.errors';

export class SemesterNotFoundError extends AppError {
  constructor(message: string = 'Semester not found') {
    super(message, 404, 'SEMESTER_NOT_FOUND');
  }
}

export class DuplicateSemesterError extends AppError {
  constructor(message: string) {
    super(message, 409, 'DUPLICATE_SEMESTER');
  }
}

export class AcademicYearNotFoundError extends AppError {
  constructor(message: string = 'Academic year not found') {
    super(message, 404, 'ACADEMIC_YEAR_NOT_FOUND');
  }
}
