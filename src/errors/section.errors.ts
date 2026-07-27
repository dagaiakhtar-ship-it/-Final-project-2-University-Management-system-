import { AppError } from './auth.errors';

export class SectionNotFoundError extends AppError {
  constructor(message: string = 'Section not found') {
    super(message, 404, 'SECTION_NOT_FOUND');
  }
}

export class DuplicateSectionError extends AppError {
  constructor(message: string) {
    super(message, 409, 'DUPLICATE_SECTION');
  }
}

export class CapacityExceededError extends AppError {
  constructor(message: string = 'Current strength cannot exceed section capacity') {
    super(message, 400, 'CAPACITY_EXCEEDED');
  }
}
