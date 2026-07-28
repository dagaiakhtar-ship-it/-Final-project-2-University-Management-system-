<!-- =====================================================================
     🎓  UNIVERSITY MANAGEMENT SYSTEM (UMS) — Premium Project-Report README
     ---------------------------------------------------------------------
     ✅ Satisfies report constraints a–g:
        a) name · problem · audience     b) live URL     c) full features
        d) AI feature + system prompt    e) tools/AI     f) 3+ screenshots
        g) run instructions

     🎨 BEFORE YOU PUBLISH — replace:
        1. 🔍 "REPLACE_LIVE_URL" → your production deploy link
        2. 🖼️  swap placehold.co screenshots with files in /assets
        3. 🤖 paste your exact Gemini prompt from src/services (AI section)
        4. 🎓 save the UMS hero banner I generated as assets/ums-banner.svg
===================================================================== -->

<div align="center">

<img width="1664" height="928" alt="1784693519" src="https://github.com/user-attachments/assets/19a458d5-acb6-4a6c-84f6-278f3fb34e79" />

<!-- 🎓 no banner yet? use this placeholder instead:
<img src="https://placehold.co/1400x420/0F172A/8B5CF6?text=UNIVERSITY+MANAGEMENT+SYSTEM&font=montserrat" width="100%" alt="banner" />
-->

# 🎓 University Management System (UMS)

### *Enterprise ERP · Real‑Time · AI‑Powered*

A modern, full‑stack university ERP built with **React 19 · TypeScript · Express · Prisma · PostgreSQL · Socket.IO · Google Gemini AI**.

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br/><br/>

<!-- ⚠️ REPLACE_LIVE_URL -->
[![LIVE](https://img.shields.io/badge/LIVE_DEMO-ums.vercel.app-16A34A?style=for-the-badge&logo=vercel&logoColor=white)](https://ums.vercel.app)
[![AISTUDIO](https://img.shields.io/badge/VIEW_IN-AI_Studio-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.studio/apps/5c1f8d4c-a9ba-406b-aa25-0dea058a2dfc)
[![SOURCE](https://img.shields.io/badge/SOURCE_CODE-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername/ums)

</div>

> [!IMPORTANT]
> ### 🔗 Live Application
> https://agent-6a67e13366dec--smart-university-management-setting.netlify.app/login
> <br>
>  vercal app make problem demo data removed <br>
>https://final-project-2-university-manageme-roan.vercel.app/  <br>
>google ai studio>>https://ai.studio/apps/5c1f8d4c-a9ba-406b-aa25-0dea058a2dfc
> 🔑 **Default login (seeded) →** Username `admin` · Password `admin123` *(Super Admin — change immediately)*

---

## 📊 At a Glance

<table>
<tr>
<td align="center" width="20%">👥<br/><br/><b>14+</b><br/><sub>USER ROLES</sub></td>
<td align="center" width="20%">⚡<br/><br/><b>Socket.IO</b><br/><sub>REAL-TIME</sub></td>
<td align="center" width="20%">🤖<br/><br/><b>Gemini</b><br/><sub>AI ASSISTANT</sub></td>
<td align="center" width="20%">🧩<br/><br/><b>12+</b><br/><sub>MODULES</sub></td>
<td align="center" width="20%">🔐<br/><br/><b>RBAC</b><br/><sub>+ PERMISSIONS</sub></td>
</tr>
</table>

<br/>

<div align="center">

### 📖 Overview

<img src="https://placehold.co/120x4/0F172A/0F172A" alt="—" />

</div>

Most universities still run on a patchwork of spreadsheets, paper registers, and disconnected legacy tools. Enrollment doesn't talk to the hostel warden, fee payments don't sync with exam eligibility, library fines live in a separate sheet, and leadership has no single dashboard for institutional health. The result is wasted time, data errors, and accreditation audits that turn into fire drills.

The **University Management System (UMS)** is a full‑stack, **enterprise‑grade ERP** that brings every corner of a university under one unified roof — a complete digital ecosystem for:

> 🎓 Academics · 👨‍🎓 Student Lifecycle · 👨‍🏫 Faculty · 📚 Library · 🏠 Hostel · 🚌 Transport · 💰 Finance · 📊 Analytics · 🤖 AI Assistant · 🔔 Real‑Time Notifications · 📑 Accreditation · 🔒 Security & Compliance

It follows a **Layered Modular Monolith Architecture** for maintainability, scalability, and clean code organization.

> [!NOTE]
> 🎓 **Built by Akhtar Ali** — designed for real institutional use, not just academic submission.

<table>
<tr>
<td width="50%">

**⚡ Why it's different**
- 🏛️ **Layered modular monolith** — clean, scalable separation of concerns
- ⚡ **Real‑time** attendance, timetable & notifications via Socket.IO
- 🤖 **Gemini‑powered** academic assistant & recommendations
- 👥 **14 roles** with granular RBAC + permission system
- 📡 **Prometheus‑ready** monitoring out of the box
- 🛡️ Enterprise security: Helmet, CORS, rate limiting, JWT refresh

</td>
<td width="50%">

**🎯 Built for**
- 🏛️ Multi‑campus universities
- 🎓 Engineering & professional colleges
- 📑 Institutions pursuing NAAC / NBA accreditation
- 🧑‍💼 Administrators needing unified oversight
- 👨‍🎓 Students, faculty & parents
- 👨‍💻 Developers learning enterprise architecture

</td>
</tr>
</table>

---

## 🧭 Table of Contents

<div align="center">

[🖼️ Screenshots](#-screenshots) · [✨ Features](#-core-features) · [🤖 AI](#-the-ai-feature) · [🔐 Auth & Roles](#-authentication--roles) · [⚡ Real-Time](#-real-time-features) · [🏗️ Architecture](#️-system-architecture) · [🔄 Data Flow](#-data-flow) · [🛠️ Stack](#️-tech-stack) · [📁 Structure](#-project-structure) · [🚀 Run](#-getting-started) · [📡 Monitoring](#-monitoring) · [🛡️ Security](#️-security) · [📈 Future](#-future-improvements) · [🤝 Contributing](#-contributing)

</div>

<br/>

<div align="center">

### 🖼️ Screenshots

<img src="https://placehold.co/120x4/EC4899/EC4899" alt="—" />

</div>

<!-- 🖼️  REPLACE placehold.co URLs with: assets/dashboard.png · students.png · academics.png · ai.png -->

<table>
<tr>
<td align="center" width="50%">
<img src="https://placehold.co/760x440/0F172A/8B5CF6?text=1+·+Admin+Dashboard+%26+KPIs&font=roboto" width="100%" alt="Dashboard"/>
     <br>
<img width="960" height="540" alt="s1" src="https://github.com/user-attachments/assets/0c9ac1df-4402-4d79-9c02-dd907d49f94d" />
<br>
<img width="960" height="540" alt="sc2" src="https://github.com/user-attachments/assets/d4f4d39a-cf31-4d3b-9595-8c607dfa9a06" />
<br>
<img width="960" height="540" alt="sc3" src="https://github.com/user-attachments/assets/e4e131ad-d91b-4ac4-8a88-605f6a69d408" />
<br>
<img width="960" height="540" alt="sc4" src="https://github.com/user-attachments/assets/95d6a19d-3431-456f-ae33-f0d5a8e158fa" />
<br>
<img width="960" height="540" alt="sc4" src="https://github.com/user-attachments/assets/d2975eb5-565b-4107-b379-859955f6f432" />
<br>
<img width="960" height="540" alt="sc5" src="https://github.com/user-attachments/assets/29131045-c216-444e-9bc8-b69afcc3cf23" />
<br>
<img width="960" height="540" alt="sc6" src="https://github.com/user-attachments/assets/e8c29140-08ae-4103-aaf7-cfce33cf7eb3" />
<br>
<img width="960" height="540" alt="sc7" src="https://github.com/user-attachments/assets/02c7bef0-541f-42d3-80e4-d6b9dbc8433f" />
<br>
<img width="960" height="540" alt="sc8" src="https://github.com/user-attachments/assets/05e6d2c2-3c56-46b4-987c-64ef0aa69cdd" />
<br>
<img width="960" height="540" alt="sc9" src="https://github.com/user-attachments/assets/55c16eaa-fb4e-4e21-b769-ac98fd8235fb" />
<br>
<img width="960" height="540" alt="sc10" src="https://github.com/user-attachments/assets/5a61a388-8d05-47c0-bdb0-cbc822e80e85" />
<br>
<img width="960" height="540" alt="sc11" src="https://github.com/user-attachments/assets/43007389-bb6f-4fd6-aa94-c1a3bbf9b1bb" />
<br>
<img width="960" height="540" alt="sc12" src="https://github.com/user-attachments/assets/82760f92-4da5-4072-9a5a-8e8d54b64f7a" />
<br>
<img width="960" height="540" alt="sc13" src="https://github.com/user-attachments/assets/2f80057d-7097-4384-bd12-a0da95fbf219" />

<br>
<img width="960" height="540" alt="sc14" src="https://github.com/user-attachments/assets/9a8b9f05-a53e-4231-9410-fa9132ec3ea9" />
<br>
<img width="960" height="540" alt="sc15" src="https://github.com/user-attachments/assets/65c5b3c4-364f-4bff-b4c1-2cd0f5fc7a9b" />
<br>
<img width="960" height="540" alt="sc16" src="https://github.com/user-attachments/assets/a87b2e98-18e7-4a80-ba24-88930297884e" />
<br>

<img width="960" height="540" alt="sc17" src="https://github.com/user-attachments/assets/84c5be51-0517-482e-8911-c926f4a297e6" />
<br>
<img width="960" height="540" alt="sc18" src="https://github.com/user-attachments/assets/b65004a9-f2c3-400f-a339-f94e5d0b899d" />
<br>
<img width="960" height="540" alt="sc19" src="https://github.com/user-attachments/assets/026e5962-abe6-4def-a255-88ebb70ad447" />
<br>
<img width="960" height="540" alt="sc20" src="https://github.com/user-attachments/assets/6dd53bb6-51ed-4c56-a2ee-f3521db87797" />
<br>
<img width="960" height="540" alt="sc21" src="https://github.com/user-attachments/assets/5d58953a-ce8c-448a-849e-26f7c7a39c34" />
<br>
<img width="960" height="540" alt="sc22" src="https://github.com/user-attachments/assets/afd4dd13-7eaa-41e9-96ea-cb9d715a1366" />
<br>
<img width="960" height="540" alt="sc23" src="https://github.com/user-attachments/assets/31dd6e3b-5923-47e0-aee3-791b5109b8b7" />
<br>
<img width="960" height="540" alt="sc24" src="https://github.com/user-attachments/assets/acf957f4-445b-48cc-88f2-3b317de78d69" />
<br>
<img width="960" height="540" alt="sc25" src="https://github.com/user-attachments/assets/dedae174-3b69-4a3a-86bf-f49cc30a975e" />
<br>
<img width="960" height="540" alt="sc26" src="https://github.com/user-attachments/assets/89a533f0-b783-4a52-8024-bf4960c25555" />
<br>
<img width="960" height="540" alt="sc27" src="https://github.com/user-attachments/assets/a2d32210-2bfe-49a4-96e1-2ec955570bb9" />
<br>

<br/><sub><b>① Admin Dashboard</b> — KPIs, charts & real‑time metrics</sub>
</td>
<td align="center" width="50%">
<img src="https://placehold.co/760x440/0F172A/38BDF8?text=2+·+Student+Management&font=roboto" width="100%" alt="Students"/>
     <br>
     <img width="960" height="540" alt="Te1" src="https://github.com/user-attachments/assets/64e6d8b4-6dca-4f13-a470-c2b601463758" />
<br>
     <img width="960" height="540" alt="te2" src="https://github.com/user-attachments/assets/6a03d382-867e-4c53-bcab-e7ad75b48958" />
<br>
     <img width="960" height="540" alt="te3" src="https://github.com/user-attachments/assets/3c7c8846-626f-4b17-99ea-a06bf4d3db65" />
<br>
     <img width="960" height="540" alt="te4" src="https://github.com/user-attachments/assets/a2bc219c-1c09-447e-8675-c05ce5fe31e5" />
     <br>
<img width="960" height="540" alt="te5" src="https://github.com/user-attachments/assets/fed77b76-84a1-48ef-950d-e3fbaf1336f1" />
<br>
<img width="960" height="540" alt="te6" src="https://github.com/user-attachments/assets/fba6c364-1934-49a1-ae4c-fa6077a80a79" />
<br>
<img width="960" height="540" alt="te7" src="https://github.com/user-attachments/assets/9404ce6d-8822-4929-a455-5918766e35f7" />
<br>
<img width="960" height="540" alt="te8" src="https://github.com/user-attachments/assets/46dd52f6-e11b-45b7-a6d1-826368d1386d" />
<br>
<img width="960" height="540" alt="te11" src="https://github.com/user-attachments/assets/4ef5a8a9-19a3-4b2a-b2d6-3cfcc139f28d" />
<br>
     <img width="960" height="540" alt="te22" src="https://github.com/user-attachments/assets/c5b5434f-e8aa-41f3-9ffe-3cacb365846d" />
<br>
     <img width="960" height="540" alt="te33" src="https://github.com/user-attachments/assets/e7058acd-aa29-4b67-8289-861f86b7b2b4" />
<br>
     <img width="960" height="540" alt="44" src="https://github.com/user-attachments/assets/3ff2a48c-9a3b-4835-821f-a6007623d76a" />

<br/><sub><b>② Teachers Management</b> — profiles, enrollment & records</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="https://placehold.co/760x440/0F172A/22C55E?text=3+·+Academics+%26+Timetable&font=roboto" width="100%" alt="Academics"/>
 <br>
  <img width="960" height="540" alt="st1" src="https://github.com/user-attachments/assets/6243fe18-20b9-43a2-8acb-efdc0c55a7e4" />
<br>
     <img width="960" height="540" alt="st2" src="https://github.com/user-attachments/assets/405dd704-7706-4c5d-99b2-2f72b7b54270" />
<br>
     <img width="960" height="540" alt="st3" src="https://github.com/user-attachments/assets/9a98fcb8-effe-483f-a5ff-44032178a508" />
<br>
     <img width="960" height="540" alt="st4" src="https://github.com/user-attachments/assets/de9df19c-e587-4f29-96ef-923dc9e4b92c" />
<br>
     <img width="960" height="540" alt="st5" src="https://github.com/user-attachments/assets/fd539e2d-9f52-4b61-8229-c03fd080faf8" />
<br>
     <img width="960" height="540" alt="st6" src="https://github.com/user-attachments/assets/81447486-32e6-4a34-96b3-d8d2907ba7e5" />
<br>
     <img width="960" height="540" alt="st7" src="https://github.com/user-attachments/assets/c29720df-92af-4971-aa89-5a24968d015f" />
<br>
     <img width="960" height="540" alt="st8" src="https://github.com/user-attachments/assets/fa946ccc-e0b5-4eba-9d19-c30a9c48d89a" />
<br>
<br/><sub><b>③ Academics</b> — courses, timetable & attendance</sub>
</td>
<td align="center">
<img src="https://placehold.co/760x440/0F172A/F59E0B?text=4+·+AI+Assistant+%26+Analytics&font=roboto" width="100%" alt="AI"/>
<br/><sub><b>④ AI Assistant</b> — chat, insights & recommendations</sub>
</td>
</tr>
</table>

<br/>

<div align="center">

### ✨ Core Features

<img src="https://placehold.co/120x4/0EA5E9/0EA5E9" alt="—" />

</div>

<table>
<tr>
<td width="33%" valign="top">

**🎓 Academic**
Student, Faculty, Department, Program, Course, Subject, Semester & Section management · Enrollment · Attendance · Timetable · Assignments · Quizzes · Examinations · Results · **Transcript Generation** · **Degree Audit**.

</td>
<td width="33%" valign="top">

**🏢 Campus Operations**
🏠 Hostel · 📚 Library · 🚌 Transport · 🏫 Room Booking · 🛒 Procurement · 📦 Inventory · 🚪 Visitor Management · 🔐 Security.

</td>
<td width="33%" valign="top">

**💰 Finance**
Fee Collection · Scholarships · Online Payments · Financial Reports.

</td>
</tr>
<tr>
<td valign="top">

**🧑‍💼 Administration**
Alumni · Placement · Recruitment · Research · Accreditation · Workflow Engine · CMS · **Multi‑Tenant Support**.

</td>
<td valign="top">

**🤖 AI Features**
Google Gemini AI Assistant · AI Chat · AI Recommendations · AI Academic Support.

</td>
<td valign="top">

**📊 Enterprise**
Analytics Dashboard · Audit Logs · Notifications · Search · Reports · **Role‑Based Access Control** · Permission System.

</td>
</tr>
</table>

<br/>

<div align="center">

### 🤖 The AI Feature

<img src="https://placehold.co/120x4/7C3AED/7C3AED" alt="—" />

</div>

The built‑in **UMS Assistant**, powered by **Google Gemini**, turns institutional data into guidance:

- 💬 Answers plain‑English questions — *"Which students are at risk this semester?"*, *"Show hostel occupancy trends"*
- 🎓 Gives **academic recommendations** grounded in performance & attendance patterns
- 🚨 Flags **fee defaulters, timetable clashes, low attendance, and accreditation gaps**
- 📝 Produces **structured reports** → `headline · key metrics · insights · risks · actions`

> [!TIP]
> 🔐 The AI **never touches the browser directly**. The client calls `/api/ai/*`, and the **Express server injects `GEMINI_API_KEY` server‑side** — so your key is never exposed.

```mermaid
flowchart LR
    Q["👤 User asks a question"] --> API["POST /api/ai/*<br/>(Express)"]
    DATA[("PostgreSQL snapshot<br/>students · faculty · finance · ops")] --> API
    API -->|"GEMINI_API_KEY<br/>(server-side)"| GEM(("✨ Google<br/>Gemini"))
    GEM --> JSON["Structured JSON answer"]
    JSON --> UI["📊 Dashboard + 💬 Chat"]
    style GEM fill:#FEF3C7,stroke:#D97706,color:#78350F
    style DATA fill:#E0F2FE,stroke:#0284C7,color:#0C4A6E
```

**📜 The system prompt behind it** *(see `src/services/`)*:

```text
You are "UMS Assistant", the embedded academic AI inside the University
Management System — an enterprise ERP serving a multi-campus university.

CONTEXT
You receive a JSON snapshot of institutional data: students (grades,
attendance, enrollment, fee status), faculty, departments, programs,
courses, timetables, hostel occupancy, library usage and accreditation
records. Treat this snapshot as the ONLY source of truth.

TASKS
1. Answer plain-English questions about academics, operations and finance.
2. Proactively surface: at-risk students (low attendance/grades), fee
   defaulters, timetable clashes, hostel capacity issues, accreditation gaps.
3. Give academic recommendations grounded in performance trends.
4. When asked for a "report", return a structured summary:
   { headline, key_metrics[], insights[], risks[], actions[] }.

RULES
- NEVER invent students, grades or figures. If data is missing, say so.
- Cite specific departments, courses, semesters or IDs when possible.
- Quantify everything ("CS attendance down 18% this semester").
- Prioritize student welfare and accreditation compliance.
- Be concise and professional — write for faculty and administrators.
- If a question is outside the data, reply:
  "I can't find that in the university database."
```

<br/>

<div align="center">

### 🔐 Authentication & Roles

<img src="https://placehold.co/120x4/D97706/D97706" alt="—" />

</div>

✅ JWT Authentication · ✅ Refresh Tokens · ✅ Firebase Authentication · ✅ Role‑Based Access Control · ✅ Permission‑Based Authorization

**👥 14 Supported Roles**

<div align="center">

| | | |
|:---|:---|:---|
| 👑 Super Admin | 🛠 Admin | 👨‍🏫 Teacher |
| 👨‍🎓 Student | 👨‍👩‍👧 Parent | 📈 Recruiter |
| 💼 Placement Officer | 🏠 Hostel Warden | 🛡 Security Staff |
| 📚 Librarian | ⚖ Compliance Officer | 📋 Internal Auditor |
| ⚠ Risk Manager | 📑 Auditor | |

</div>

```mermaid
flowchart TD
    SA["👑 Super Admin"] --> AD["🛠 Admin"]
    AD --> T["👨‍🏫 Teacher"]
    AD --> S["👨‍🎓 Student"]
    AD --> P["👨‍👩‍👧 Parent"]
    AD --> OPS["💼 Placement · 📈 Recruiter"]
    AD --> CAMPUS["🏠 Warden · 📚 Librarian · 🛡 Security"]
    AD --> GOV["⚖ Compliance · 📋 Auditor · ⚠ Risk"]
    style SA fill:#FEF3C7,stroke:#D97706,color:#78350F
    style AD fill:#E0F2FE,stroke:#0284C7,color:#0C4A6E
    style T fill:#F0FDF4,stroke:#16A34A,color:#14532D
    style S fill:#FCE7F3,stroke:#DB2777,color:#831843
```

<br/>

<div align="center">

### ⚡ Real-Time Features

<img src="https://placehold.co/120x4/06B6D4/06B6D4" alt="—" />

</div>

Powered by **Socket.IO** — 🔔 Notifications · 📅 Timetable Updates · ✅ Attendance Updates · 💬 Chat · 📊 Dashboard Updates · 📢 Event Broadcasting.

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Teacher
    participant React as React SPA
    participant Sock as Socket.IO
    participant Srv as Express
    participant DB as PostgreSQL
    U->>React: Mark attendance
    React->>Sock: emit('attendance:update')
    Sock->>Srv: WebSocket event
    Srv->>DB: Prisma write
    DB-->>Srv: confirm
    Srv->>Sock: broadcast('attendance:updated')
    Sock-->>React: push to all subscribers
    Note over React,Sock: ✅ Every connected client updates instantly
```

<br/>

<div align="center">

### 🏗️ System Architecture

<img src="https://placehold.co/120x4/4F46E5/4F46E5" alt="—" />

</div>

A **Layered Modular Monolith** — clean separation of concerns, scalable within a single deployable unit.

```text
                    🌐 Browser (React SPA)
                             │
               REST API / WebSocket (Socket.IO)
                             │
                    🚀 Express Server
                             │
        ┌───────────────────────────────────────┐
        │ Authentication │ Authorization │ Logs │
        └───────────────────────────────────────┘
                             │
                     📂 Controllers
                             │
                     ⚙️ Services
                             │
                    🗄️ Repositories
                             │
                     Prisma ORM Client
                             │
                     PostgreSQL Database
```

<br/>

<div align="center">

### 🔄 Data Flow

<img src="https://placehold.co/120x4/3B82F6/3B82F6" alt="—" />

</div>

```text
🌐 Browser → ⚛️ React → 🌍 REST API → 🚀 Express → 🔐 JWT Middleware
   → 📂 Controller → ✔ Zod Validation → ⚙️ Service → 🗄 Repository
   → 🔥 Prisma → 🐘 PostgreSQL
```

<br/>

<div align="center">

### 🛠️ Tech Stack

<img src="https://placehold.co/120x4/14B8A6/14B8A6" alt="—" />

</div>

<div align="center">

**Frontend**

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**State · Validation**

![Zustand](https://img.shields.io/badge/State-Zustand-F59E0B?style=for-the-badge)
![TanStack](https://img.shields.io/badge/Query-TanStack_Query-FF4154?style=for-the-badge)
![Zod](https://img.shields.io/badge/Validation-Zod-3E67B1?style=for-the-badge)

**Backend · Data · Real-Time**

![Express](https://img.shields.io/badge/Express.js-Server-000000?style=for-the-badge&logo=express&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SocketIO](https://img.shields.io/badge/Socket.IO-Real--time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

**AI · Charts · Export**

![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)
![ECharts](https://img.shields.io/badge/Charts-ECharts-AA344D?style=for-the-badge)
![Recharts](https://img.shields.io/badge/Charts-Recharts-10B981?style=for-the-badge)
![PDFKit](https://img.shields.io/badge/PDF-PDFKit-7C3AED?style=for-the-badge)

</div>

| Layer | Technology |
|---------|------------|
| 🎨 Frontend | React 19 + TypeScript + Vite |
| 💅 Styling | TailwindCSS |
| ⚙️ Backend | Express.js |
| 🗄️ Database | PostgreSQL |
| 🔥 ORM | Prisma |
| 🔐 Authentication | JWT + Firebase |
| 🔄 Real-Time | Socket.IO |
| 📦 State | Zustand |
| 🌐 Server State | TanStack Query |
| ✔ Validation | Zod |
| 🤖 AI | Google Gemini |
| 📊 Charts | ECharts + Recharts |
| 📄 PDF | PDFKit |
| 📱 QR | QRCode |
| 📌 Barcode | JsBarcode |

<br/>

<div align="center">

### 📁 Project Structure

<img src="https://placehold.co/120x4/64748B/64748B" alt="—" />

</div>

```bash
📦 ums
├── 📂 prisma
│   ├── schema.prisma
│   └── seed.ts
│
├── 📂 src
│   ├── 📂 components
│   ├── 📂 controllers
│   ├── 📂 errors
│   ├── 📂 features
│   ├── 📂 hooks
│   ├── 📂 middleware
│   ├── 📂 pages
│   ├── 📂 providers
│   ├── 📂 repositories
│   ├── 📂 routes
│   ├── 📂 services
│   ├── 📂 socket
│   ├── 📂 store
│   ├── 📂 types
│   └── 📂 validators
│
├── 🚀 server.ts
├── 📄 package.json
└── 📖 README.md
```

<br/>

<div align="center">

### 🚀 Getting Started

<img src="https://placehold.co/120x4/10B981/10B981" alt="—" />

</div>

**✅ Prerequisites** — Node.js ≥ `20.x` · PostgreSQL 16 · a [Gemini API key](https://aistudio.google.com/apikey) · Firebase service-account credentials

**1️⃣ Clone repository**
```bash
git clone https://github.com/yourusername/ums.git
cd ums
```

**2️⃣ Install dependencies**
```bash
npm install
```

**3️⃣ Configure environment** *(create `.env` / `.env.local`)*
```env
DATABASE_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

PORT=5000

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GEMINI_API_KEY=
```

**4️⃣ Initialize Prisma**
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

**5️⃣ Run the dev server**
```bash
npm run dev          # 🌐 http://localhost:5000
```

**6️⃣ Production build**
```bash
npm run build
```

> [!TIP]
> 🧪 **Prefer zero setup?** View the live app in **AI Studio** → [ai.studio/apps/5c1f8d4c…](https://ai.studio/apps/5c1f8d4c-a9ba-406b-aa25-0dea058a2dfc). Just set `GEMINI_API_KEY` in `.env.local` and run `npm run dev`.

> [!NOTE]
> ☁️ **To get your live URL:** deploy to **Vercel / Render / Railway**, set every env var in the host dashboard, then paste the URL into the **LIVE_DEMO** badge at the top.

<br/>

<div align="center">

### 📡 Monitoring

<img src="https://placehold.co/120x4/22C55E/22C55E" alt="—" />

</div>

| Endpoint | Description |
|----------|-------------|
| ❤️ `/health` | Liveness |
| 💚 `/ready` | Readiness |
| 📊 `/metrics` | Prometheus |
| 🩺 `/api/health` | Application Health |

<br/>

<div align="center">

### 🛡️ Security

<img src="https://placehold.co/120x4/E11D48/E11D48" alt="—" />

</div>

🛡 Helmet · 🌍 CORS · 🚦 Rate Limiting · 🔐 JWT · 🔄 Refresh Tokens · 🔑 RBAC · ✔ Input Validation · 🔒 Secure Headers

<br/>

<div align="center">

### 📈 Future Improvements

<img src="https://placehold.co/120x4/7C3AED/7C3AED" alt="—" />

</div>

⚡ Redis Cache · 📨 BullMQ Jobs · ☁ AWS S3 / MinIO · 🔎 Elasticsearch · 🐳 Docker · ☸ Kubernetes · 📊 Grafana · 📈 Prometheus · 🌐 Microservices

<br/>

<div align="center">

### 🤝 Contributing

<img src="https://placehold.co/120x4/06B6D4/06B6D4" alt="—" />

</div>

Contributions are welcome!

1. 🍴 Fork the repository
2. 🌿 Create a new branch
3. 💻 Commit your changes
4. 🚀 Push your branch
5. 🔥 Open a Pull Request

<br/>

<div align="center">

### 👨‍💻 Developer

<img src="https://placehold.co/120x4/E11D48/E11D48" alt="—" />

<br/><br/>

**Akhtar Ali**

*Computer Science Student & Developer*

<br/>

![Built With](https://img.shields.io/badge/BUILT_WITH-React_·_Express_·_Prisma_·_PostgreSQL_·_Socket.IO_·_Gemini-0F172A?style=for-the-badge)

<br/><br/>

### ❤️ Built With Love for Education

**University Management System** · by **Akhtar Ali**

</div>

---

## 📜 License

Licensed under the **MIT License**.

---

<div align="center">

### ⭐ If you like this project, consider giving it a Star!

Made with ❤️ using React, Express, Prisma & PostgreSQL

</div>

<!-- =====================================================================
     OPTIONAL: Star History chart (uncomment when repo is public):
<a href="https://star-history.com/#yourusername/ums&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=yourusername/ums&type=Date&theme=dark" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=yourusername/ums&type=Date" width="70%"/>
 </picture>
</a>
===================================================================== -->
