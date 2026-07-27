/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SystemPermission {
  // User Management
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',

  // Attendance Management
  MARK_ATTENDANCE = 'mark:attendance',
  VIEW_ATTENDANCE = 'view:attendance',
  EDIT_ATTENDANCE = 'edit:attendance',

  // Academics & Courses
  CREATE_COURSE = 'create:course',
  READ_COURSE = 'read:course',
  UPDATE_COURSE = 'update:course',
  DELETE_COURSE = 'delete:course',

  // Marks & Grading
  SUBMIT_GRADE = 'submit:grade',
  VIEW_GRADE = 'view:grade',

  // Fees & Finance
  MANAGE_FEES = 'manage:fees',
  VIEW_FEES = 'view:fees',

  // Reports & Analytics
  GENERATE_REPORTS = 'generate:reports',
  VIEW_ANALYTICS = 'view:analytics',
}
