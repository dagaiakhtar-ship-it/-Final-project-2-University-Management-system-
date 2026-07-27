# Smart University ERP - Department Management Module Documentation

This document outlines the architecture, database design, API specification, validation rules, and role permission matrix for the **Department Management Module** (Step 13 of 100).

---

## 📂 Folder Structure

The module follows a strictly decoupled, layered architecture conforming to **SOLID, DRY, and KISS** principles.

```
/
├── prisma/
│   ├── schema.prisma                       # Database Schema (Department, Teacher, Audit relations)
├── src/
│   ├── controllers/
│   │   └── department.controller.ts        # Express route handlers, input parsing, error handling
│   ├── errors/
│   │   └── department.errors.ts            # Custom domain errors (NotFound, Duplicate)
│   ├── pages/
│   │   └── departments/
│   │       ├── DepartmentListPage.tsx      # Comprehensive list table, filters, searching, and pagination
│   │       ├── DepartmentCreatePage.tsx    # Create Form with React Hook Form & Zod
│   │       ├── DepartmentEditPage.tsx      # Edit Form populated with database parameters
│   │       └── DepartmentDetailPage.tsx    # Comprehensive read-only / delete metrics view
│   ├── repositories/
│   │   └── department.repository.ts        # Repository pattern wrapping Prisma queries
│   ├── routes/
│   │   └── department.routes.ts            # REST API endpoints & Role Guard configuration
│   ├── services/
│   │   ├── department.service.ts           # Core business logic, validation, audit integration
│   │   └── audit.service.ts                # Action tracker / logging service
│   ├── validators/
│   │   └── department.validators.ts        # Zod input validation schemas
│   └── App.tsx                             # Main entry point (loads routing bundle)
└── server.ts                               # App entry point (registers api/departments route)
```

---

## 🗄️ Database Changes (PostgreSQL via Prisma)

The `Department` table is defined as follows:

```prisma
model Department {
  id                 Int                  @id @default(autoincrement())
  uuid               String               @unique @default(uuid()) @db.Uuid
  code               String               @unique @db.VarChar(10)
  name               String               @unique @db.VarChar(100)
  shortName          String?              @db.VarChar(10)
  description        String?              @db.VarChar(500)
  faculty            String?              @db.VarChar(100)
  officeLocation     String?              @db.VarChar(100)
  officePhone        String?              @db.VarChar(20)
  officeEmail        String?              @db.VarChar(100)
  status             String               @default("ACTIVE") // ACTIVE, INACTIVE
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  deletedAt          DateTime?
  createdBy          String?
  updatedBy          String?
  universityId       Int
  university         University           @relation(fields: [universityId], references: [id])
  headOfDepartmentId Int?                 @unique
  headOfDepartment   Teacher?             @relation("DepartmentHead", fields: [headOfDepartmentId], references: [id])
  teachers           Teacher[]            @relation("DepartmentTeachers")
}
```

---

## 🔒 Permission & Authorization Matrix

Access protection is enforced both at the **React Client Router (via `RoleGuard`)** and at the **Express API Router (via `requireRoles`)**:

| Role | Read (List, View Details) | Write (Create, Update) | Soft Delete | Toggle Status | Bulk Action Override |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Teacher** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Student** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Parent** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 📡 REST API Specifications

All endpoints require authentication (JWT Bearer Token in `Authorization` header).

### 1. `GET /api/departments`
*   **Access:** Super Admin, Admin, Teacher, Student
*   **Query Parameters:**
    *   `search` (string, filters by code, name, faculty)
    *   `status` (`ACTIVE` / `INACTIVE`)
    *   `page` (number, default: 1)
    *   `limit` (number, default: 10)
    *   `sortBy` (field name, default: `createdAt`)
    *   `sortOrder` (`asc` / `desc`, default: `desc`)
*   **Response:** `200 OK` with paginated array of departments and pagination metadata.

### 2. `GET /api/departments/teachers`
*   **Access:** Super Admin, Admin, Teacher
*   **Description:** Returns a list of active teachers available to be appointed as Head of Department.
*   **Response:** `200 OK`

### 3. `GET /api/departments/:id`
*   **Access:** Super Admin, Admin, Teacher, Student
*   **Response:** `200 OK` with complete department payload or `404 Not Found`.

### 4. `POST /api/departments`
*   **Access:** Super Admin, Admin
*   **Request Body:** Validated via `createDepartmentSchema` (Zod).
*   **Response:** `201 Created`

### 5. `PUT /api/departments/:id`
*   **Access:** Super Admin, Admin
*   **Request Body:** Validated via `updateDepartmentSchema` (Zod).
*   **Response:** `200 OK`

### 6. `DELETE /api/departments/:id`
*   **Access:** Super Admin, Admin
*   **Description:** Performs a soft-delete (sets `deletedAt` and logs action).
*   **Response:** `200 OK`

### 7. `PATCH /api/departments/:id/status`
*   **Access:** Super Admin, Admin
*   **Request Body:** `{ status: "ACTIVE" | "INACTIVE" }`
*   **Response:** `200 OK`

---

## 🔍 Input Validation Rules (Zod Validation)

*   **Department Name (`name`):** Required, string length 3 - 100 characters. Unique.
*   **Department Code (`code`):** Required, string length 2 - 10 characters, strictly alphanumeric/hyphens, auto-capitalized. Unique.
*   **Short Name (`shortName`):** Optional, max 10 characters, auto-capitalized.
*   **Description (`description`):** Optional, max 500 characters.
*   **Faculty/School (`faculty`):** Optional, max 100 characters.
*   **Office Location (`officeLocation`):** Optional, max 100 characters.
*   **Office Phone (`officePhone`):** Optional, valid phone expression, length 7 - 20 digits.
*   **Office Email (`officeEmail`):** Optional, valid RFC 5322 email string.
*   **Head of Department (`headOfDepartmentId`):** Optional, valid active teacher ID.
*   **Status (`status`):** Must be `ACTIVE` or `INACTIVE` (default: `ACTIVE`).

---

## 📝 Audit Trail System

Every mutate action (Create, Update, Delete, Status Change) captures:
*   `action` (e.g. `DEPARTMENT_CREATED`, `DEPARTMENT_UPDATED`, `DEPARTMENT_DELETED`, `DEPARTMENT_STATUS_CHANGED`)
*   `tableName` (`Department`)
*   `recordId` (the numerical ID of the modified department)
*   `oldValue` (JSON capture of previous values for audit diffing)
*   `newValue` (JSON capture of new values)
*   `userId` (ID of the modifying administrator)
*   `timestamp` (system datetime)

---

## 🚀 Key Implementation Highlights

1.  **Strict Type Safety:** No use of the `any` keyword. Form parameters, server payloads, and repositories are protected with clear TypeScript interface parameters.
2.  **Optimistic UI & Clean Layout:** Real-time feedback, status toggles, paginated query triggers, sorting indicator transitions, and clean bento-card alignments.
3.  **Enterprise Error Resolution:** Integrates with the application's centralized Express error handling to map domain errors to precise REST JSON messages with consistent HTTP status codes.
