# Enterprise Data Warehouse, Business Intelligence (BI) & Advanced Analytics Platform
## Architecture and System Documentation

This document provides a highly detailed architectural, schema-level, and operational reference for the **Enterprise Data Warehouse & BI Analytics Platform** built for the **Smart University ERP & Smart Campus Platform**.

---

## 1. Data Warehouse Architecture

The analytics platform employs a hybrid **Lambda/Kappa-style** staging and star-schema architecture. 
Operational database tables (OLTP database) are decoupled from the analytical queries (OLAP) to prevent load contention.

```
       [ OLTP Relational Database (PostgreSQL) ]
                           │
                           ▼
              [ Staging & Aggregation Layer ]
                           │
                           ▼
          [ Enterprise Data Warehouse (EDW) ]
            (Star-Schema Analytical Tables)
             ┌─────────────┴─────────────┐
             ▼                           ▼
      [ Data Marts ]             [ KPI Repository ]
     (Admissions, Finance,         (Zustand / Memory / DB)
      Students, HR, Research...)         │
             │                           ▼
             │               [ Real-time Broadcasts ]
             │                   (Socket.io Stream)
             ▼                           │
   [ Report Designer / Catalog ] ◄───────┘
             │
             ▼
[ Looker & Tableau Cloud Level UI Dashboards ]
```

### Key Components:
1. **Source Layer (OLTP)**: Direct transactional entities (Student, Teacher, Financial Invoices, Research Publications, etc.).
2. **Enterprise Data Warehouse (EDW)**: Aggregated fact and dimension tables, synchronized periodically via our custom background ETL orchestrator.
3. **Data Mart Layer**: Domain-focused, high-performance logical and physical views designed for specific institutional leaders (e.g. Finance Mart for the Finance Director).

---

## 2. ETL Workflow

The ETL (Extract, Transform, Load) pipelines ingest raw transactional records, perform cross-table dimension mapping, compute metrics (e.g. pass percentages and workloads), and output the aggregated values into the data warehouse tables.

### ETL Core Flow:
- **Extract**: Query raw student counts, teacher headcounts, research publications, and fiscal invoicing entries.
- **Transform**: Clean null fields, apply currency conversion ratios, calculate GPA and credit pass rate metrics per department.
- **Load**: Push aggregated records into `KPI`, `DataWarehouseJob`, and dynamic query matrices.
- **Real-time Notifications**: Emit real-time progress events (`analytics:etl:progress`) via Socket.io to keep dashboards instantly synced without reloading.

---

## 3. Data Mart Design

We support **14 specialized Data Marts** aligned with the core operational domains of the Smart Campus ERP:

| Data Mart Name | Core Dimensions & Facts | Lead Stakeholder |
| :--- | :--- | :--- |
| **Admissions** | Conversion counts, applied vs admitted, yield rates | Registrar / VC |
| **Students** | Active students, enrollment progression, international rates | Registrar |
| **Attendance** | Student attendance rate, teacher class compliance | Department Head |
| **Faculty** | Workload hours, Ph.D. holders ratio, paper output | VC / HR Director |
| **Examinations**| Active examination schedules, student seat plans | Controller of Exams|
| **Results** | Average class GPAs, pass vs fail distributions | Controller of Exams|
| **Finance** | Revenues, expenditures, library fines, surplus margins | Finance Director |
| **HR** | Employee headcount, leave requests, payroll | HR Director |
| **Payroll** | Base salaries, net pays, tax withholdings | HR Director / Finance |
| **Procurement**| Purchase orders, pending values, purchase speed rate | Finance Director |
| **Library** | Books checked out, active cards, unique titles catalog | Registrar |
| **Research** | Ongoing projects, completed papers, funding amounts | Vice Chancellor |
| **Inventory** | Total stock quantities, low-stock threshold warning count| Finance Director |
| **Assets** | Total campus assets, active equipment, maintenance alerts| Department Head |

---

## 4. KPI Documentation

We track **10 critical Key Performance Indicators (KPIs)** defined across administrative domains:

1. **Student Enrollment**: Active students enrolled in courses.
2. **Attendance Rate**: Average percentage of students present in lectures.
3. **Graduation Rate**: Percentage of students completing programs within standard periods.
4. **Pass Percentage**: Student examination pass indices.
5. **Faculty Workload**: Average weekly contact hours per lecturer.
6. **Budget Utilization**: Percentage of allocated department budgets spent.
7. **Library Usage**: Number of books issued per semester.
8. **Research Publications**: Peer-reviewed scientific articles published.
9. **Employee Attendance**: Faculty & staff class/duty presence ratios.
10. **Procurement Efficiency**: Days taken to complete and approve purchase cycles.

---

## 5. Dashboard Architecture

Dynamic visualizations are rendered responsively using **Recharts** charts and Lucide React iconography. The UI is designed with a desk-first layout featuring:
- **Stat Widgets Layer**: Clean cards displaying raw values with color-coded trend indicators (e.g. "+12.4%").
- **Interactive charts**: High-performance Area charts showing revenues vs expenditures, line charts showing enrollments, and comparative bar charts.
- **ARIMA Predictive Engine**: Forecasts student trajectories with shaded pessimistic/optimistic confidence bands.

---

## 6. API Documentation

### `GET /api/analytics/dashboard`
Returns calculated metrics, charts data, and data mart specifications based on user lens (VC, Registrar, HR, etc.).
- **Query Params**: `dashboardType`, `department`, `timeRange`
- **RBAC**: Requires authenticated academic or executive roles.

### `GET /api/analytics/kpis`
Retrieves all core Key Performance Indicators with current values, targets, categories, and trends.

### `POST /api/analytics/reports`
Saves custom designed report queries into the metadata catalog.
- **Body Schema**: `reportName`, `reportType`, `configuration`, `schedule`

### `GET /api/analytics/reports`
Lists all custom designed reports.

### `GET /api/analytics/export`
Generates downloadable, fully compliant analytical media attachments.
- **Query Params**: `format` (`pdf` \| `csv` \| `excel`), `reportId`

### `POST /api/analytics/schedule`
Assigns recurring cron schedules to custom reports.
- **Body Schema**: `reportId`, `schedule`

### `GET /api/analytics/jobs`
Lists historic execution status records of the Data Warehouse jobs.

### `POST /api/analytics/jobs/trigger`
Asynchronously triggers a manual ETL synchronization pipeline with live progress broadcasts.

---

## 7. Database Changes & Prisma Schema

The following tables have been added to the Prisma database configuration to persist analytical configurations:

```prisma
model DataWarehouseJob {
  id          Int       @id @default(autoincrement())
  jobName     String
  jobType     String    // ETL, ELT, Refresh, Cleanup
  status      String    // Pending, Running, Success, Failed
  startedAt   DateTime  @default(now())
  completedAt DateTime?
}

model KPI {
  id           Int     @id @default(autoincrement())
  name         String
  category     String
  targetValue  Float
  currentValue Float
  trend        Float   
  active       Boolean @default(true)
}

model SavedReport {
  id            Int     @id @default(autoincrement())
  reportName    String
  reportType    String
  createdBy     String
  configuration String  // Serialized JSON
  schedule      String? 
}
```

---

## 8. Entity-Relationship (ER) Diagram

```
┌────────────────────┐          ┌─────────────┐          ┌───────────────────────┐
│     SavedReport    │          │     KPI     │          │    DataWarehouseJob   │
├────────────────────┤          ├─────────────┤          ├───────────────────────┤
│ id (PK, Int)       │          │ id (PK, Int)│          │ id (PK, Int)          │
│ reportName (String)│          │ name        │          │ jobName (String)      │
│ reportType (String)│          │ category    │          │ jobType (String)      │
│ createdBy (String) │          │ targetValue │          │ status (String)       │
│ configuration (JSON)│         │ currentValue│          │ startedAt (DateTime)  │
│ schedule (String)  │          │ trend       │          │ completedAt (DateTime)│
└────────────────────┘          │ active      │          └───────────────────────┘
                                └─────────────┘
```

---

## 9. Folder Structure

```
├── prisma/
│   └── schema.prisma                # Database Models
├── server.ts                        # Express API Entrypoint
├── src/
│   ├── routes/
│   │   └── analytics.routes.ts      # Backend API endpoints with RBAC & Validation
│   ├── pages/
│   │   └── analytics/
│   │       └── AnalyticsPage.tsx    # Interactive BI dashboards and Report Builder
│   └── api/
│       └── api-client.ts            # Client-side axios instance
```
