# ENTERPRISE SYSTEM DOCUMENTATION & USER MANUALS (STEP 99)
## Smart University ERP & Smart Campus Platform

---

## 1. EXECUTIVE SUMMARY
The **Smart University ERP & Smart Campus Platform** is a unified, full-stack enterprise ecosystem designed to streamline and automate complete academic, administrative, financial, operational, and AI-enabled decision-making tasks across the modern university. 

This manual serves as the single source of truth for students, faculty, system administrators, security auditors, database administrators, and software development teams. It provides comprehensive technical architectures, detailed user training materials, extensive step-by-step administrator guides, production-level deployment topologies, and a full RESTful API reference index.

---

## 2. SYSTEM OVERVIEW
The platform bridges standard higher education operations with cutting-edge real-time tracking and cognitive analytics:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                              │
│              React SPA / Tailwind CSS / Framer Motion Client           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / WebSockets
┌──────────────────────────────────▼─────────────────────────────────────┐
│                            API GATEWAY LAYER                           │
│           JWT & RBAC Middleware / Socket.io Sync / Rate Limiting       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ├─────────────────────────────────────┐
┌──────────────────────────────────▼──────────────────┐   ┌──────────────▼──────┐
│                    BUSINESS ENGINE                  │   │      AI ENGINE      │
│  Academics / HR / Finance / Workflows / Procurement │   │ Gemini / RAG / Vector│
└──────────────────────────────────┬──────────────────┘   └──────────────┬──────┘
                                   │ Prisma ORM                          │ pgvector
┌──────────────────────────────────▼─────────────────────────────────────▼──────┐
│                            PERSISTENCE & CACHE                                 │
│                   PostgreSQL Database   /   Redis Cache Engine                 │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ARCHITECTURE DOCUMENTATION

### 3.1 Modular Monolith & Core Services
The system is constructed as a modular monolithic engine containing cleanly decoupled domain contexts. Each context features explicit routing, middleware boundaries, controller validation layers, and database access structures:

1.  **Identity Context**: Employs hybrid authentication (Server-issued JSON Web Tokens + Google Firebase Authentication state) backing granular Role-Based Access Control (RBAC).
2.  **Academic Context**: Coordinates programs, courses, schedules, enrollment bounds, live classroom attendances, and automated GPA/credits auditing.
3.  **Finance & Procurement Context**: Governs student billing generation, salary structures, multi-level purchase requisition approval boards, and automatic physical inventory reconciliation.
4.  **Workflow Automation Engine**: An asynchronous state machine managing tiered department-wide approvals, automated notification dispatches, and trigger conditions.
5.  **AI Copilot & Predictive Intelligence**: Multi-model routing client facilitating natural-language copilot assistants, automated academic summarizing, and regression-based dropout predictions.
6.  **Mobile Device Management (MDM)**: Hardware compliance auditor tracking on-campus mobile/tablet fleets and executing remote administrative lockdowns.

---

## 4. USER DOCUMENTATION (MANUALS)

### 4.1 Student Guide
*   **Aesthetic Portal**: Upon login, students see their personalized academic command center featuring GPA indicators, semester course timelines, and attendance status.
*   **Workflows**:
    1.  **Course Enrollment**: Navigate to `/enrollments`, filter open courses by department, and click "Enroll". The system validates prerequisite matches before persisting.
    2.  **Exams & Results**: View active exam tables, download seat schedules, and view finalized, graded transcript records at `/results`.
*   **Troubleshooting**: If your course is locked, check that you do not have an outstanding tuition balance inside the Finance tab.

### 4.2 Faculty & Instructor Guide
*   **Aesthetic Portal**: Faculty dashboards present active course-load schedules, student attendance heatmaps, and pending assignment review lists.
*   **Workflows**:
    1.  **Attendance Logging**: Select your active lecture from `/attendance`, mark absent students, and submit. The system instantly updates student analytics records.
    2.  **Interactive Grading**: Submit grades through `/results`, which automatically triggers GPA recalculations.
*   **Troubleshooting**: For missing class schedules, verify with the Dean's office that your `CourseOffering` is officially mapped to your account in the Database.

---

## 5. ADMINISTRATOR GUIDE

### 5.1 Role-Based Access Control (RBAC) Matrix
The platform strictly enforces role claims on every endpoint:

| Role | Permissions | Accessible Modules |
| :--- | :--- | :--- |
| **SYSTEM_ADMIN** | Full absolute system write/read, database migrations, MDM lockdowns. | Entire ERP suite |
| **FINANCE_OFFICER**| Financial transactions, payroll disbursements, purchase auditing. | Finance, Inventory |
| **TEACHER** | Attendance submission, course grading, research tracking, syllabus management. | Academics, Grading |
| **STUDENT** | Read-only profile, self-course enrollment, fee payment simulation. | Academics, Portals |

### 5.2 Database Backup & Disaster Recovery
*   **Manual Backup Execution**:
    ```bash
    pg_dump -h localhost -U postgres -d university_erp > backup_$(date +%Y%m%d).sql
    ```
*   **Restoration Run**:
    ```bash
    psql -h localhost -U postgres -d university_erp -f backup.sql
    ```
*   **Recovery Objective**: Point-in-time recovery is managed via WAL (Write-Ahead Logging) archiving directly to protected cloud buckets.

---

## 6. DEVELOPER DOCUMENTATION & API REFERENCE

All external and internal REST API requests must provide the following header for authentication:
`Authorization: Bearer <JWT_TOKEN>`

### 6.1 Authentication APIs
#### `POST /api/auth/login`
Authenticates a user and returns a signed JSON Web Token.
*   **Request Payload**:
    ```json
    {
      "email": "admin@university.edu",
      "password": "SecurePassword123"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 1,
        "email": "admin@university.edu",
        "role": "SYSTEM_ADMIN"
      }
    }
    ```

### 6.2 Decision Support & AI APIs
#### `POST /api/ai/copilot`
Submits a user prompt to the University Assistant Model for contextual reasoning.
*   **Request Payload**:
    ```json
    {
      "prompt": "What is the graduation policy for late submissions?",
      "assistantType": "University"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "reply": "According to general guidelines, late submissions carry a 5% grade reduction penalty per 24 hours.",
      "assistantType": "University"
    }
    ```

#### `POST /api/ai/predict`
Calculates regression projections for student grades, drop-out risks, or enrollment trends.
*   **Request Payload**:
    ```json
    {
      "target": "Student Dropout Risk",
      "parameters": {
        "studentId": "std-401",
        "attendanceRate": 68
      }
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "target": "Student Dropout Risk",
      "prediction": "### Analysis\n- Confidence Score: 84%\n- Risk: High\n- Recommendation: Schedule advisory counseling session."
    }
    ```

---

## 7. DATABASE DOCUMENTATION & PRISMA SCHEMA

The schema is maintained, versioned, and migrated using Prisma ORM. Below are the key data relationships:

```
  ┌───────────────┐          1:N         ┌───────────────┐
  │     User      ├─────────────────────►│  Enrollment   │
  │ (SYSTEM_ADMIN)│                      │   (Student)   │
  └───────┬───────┘                      └───────┬───────┘
          │                                      │
          │ 1:N                                  │ 1:N
  ┌───────▼───────┐                      ┌───────▼───────┐
  │  Deployment   │                      │  ExamResult   │
  │ (DevOps Logs) │                      │ (GPA Records) │
  └───────────────┘                      └───────────────┘
```

### 7.1 Key Database Indexes
To maintain optimal lookup latency, indexes are established on all foreign key references and frequently-searched parameters:
*   `User(email)`: Unique hash index for near-instant authentication lookups.
*   `Enrollment(studentId, courseOfferingId)`: Composite index to prevent dual-registration races.
*   `Deployment(environment, status)`: Optimization for DevOps health checks and metrics streaming.

---

## 8. DEPLOYMENT & DEVOPS GUIDE

### 8.1 Docker Multi-Stage Build
Our production image optimizes static bundles and strips unused development packages to minimize attack surfaces and execution times:

```dockerfile
# Stage 1: Build the frontend bundle
FROM node:18-alpine AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Deploy Production Node/Express Container
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build-frontend /app/dist ./dist
COPY --from=build-frontend /app/server.ts ./server.ts
EXPOSE 3000
CMD ["npm", "start"]
```

### 8.2 Kubernetes Deployment Manifest
Our horizontal auto-scaling service matches campus workload bursts:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: university-erp-backend
  labels:
    app: erp-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: erp-backend
  template:
    metadata:
      labels:
        app: erp-backend
    spec:
      containers:
      - name: erp-container
        image: university/erp-backend:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
```

---

## 9. SECURITY MODEL & RATINGS

*   **Authentication Validation**: Zero-trust JSON Web Tokens expire in exactly 60 minutes.
*   **Sensitive Secret Hygiene**: All credentials, database connection strings, and Gemini API keys are configured inside `.env` configurations and never hardcoded in source systems.
*   **Audit Logging**: Every administrative transaction is persisted with timestamps, actor IDs, client IPs, and action descriptions inside the immutable database logs table.

---

## 10. TRAINING MATERIALS & FAQ

### FAQ 1: How do I change the operational LLM for predictions?
The backend automatically resolves the model to `gemini-1.5-flash` or fallback mock setups. Simply configure `GEMINI_API_KEY` in the environment settings and restart the container to enable active live production models.

### FAQ 2: Why are real-time statistics not rendering instantly on my device?
Confirm your browser has active WebSockets connections enabled. The system features dynamic polling fallbacks if firewall rules block persistent Socket.io channels.

---

## 11. APPENDIX & PROJECT PACKAGING CHECKLIST
*   [x] Verify core database migrations build without warnings using `npx prisma db push`.
*   [x] Establish all API proxy endpoints in `server.ts` to prevent client-side secret leakage.
*   [x] Verify comprehensive accessibility standards using the WCAG 2.1 AA compliance guidelines.
