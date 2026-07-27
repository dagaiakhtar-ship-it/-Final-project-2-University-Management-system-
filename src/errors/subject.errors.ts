import { AppError } from './auth.errors';

export class SubjectNotFoundError extends AppError {
  constructor(message: string = 'Subject not found') {
    super(message, 404, 'SUBJECT_NOT_FOUND');
  }
}

export class DuplicateSubjectError extends AppError {
  constructor(message: string = 'Subject code already exists') {
    super(message, 409, 'DUPLICATE_SUBJECT');
  }
}

export class InvalidSubjectHoursError extends AppError {
  constructor(message: string = 'Theory Hours and Lab Hours must sum up to Credit Hours') {
    super(message, 400, 'INVALID_SUBJECT_HOURS');
  }
}
