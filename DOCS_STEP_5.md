# Step 5 of 100: Authentication & Authorization Foundation

## Overview
Built a secure, enterprise-grade backend Authentication and Authorization architecture supporting Super Admin, Admin, Teacher, Student, and Parent roles.

The backend infrastructure is highly modular, adhering to SOLID, DRY, KISS, and Clean Architecture patterns (Service-Repository layout), and features complete typesafety, input validation, and rate limiting.

---

## 📂 Project Structure Updates

All added files are isolated within standard architectural layers:

```text
├── server.ts                             # Express server entry (mounted /api/auth & added custom error mappings)
├── prisma/schema.prisma                  # Database schema (added auth-specific fields to User table)
├── src/
│   ├── errors/
│   │   └── auth.errors.ts                # Custom API AppError hierarchy
│   ├── types/
│   │   └── auth.types.ts                 # Strong typing extensions for Request Context (req.user)
│   ├── validators/
│   │   └── auth.validators.ts            # Zod validation schemas
│   ├── repositories/
│   │   ├── user.repository.ts            # Data Access Object Layer (DAO) using Prisma
│   │   └── index.ts                      # Repository exports index
│   ├── services/
│   │   ├── password.service.ts           # Bcrypt hashing & strength validation
│   │   ├── token.service.ts              # JWT signing, verification & parameters
│   │   ├── firebase-admin.service.ts     # Firebase Admin SDK (lazy initialization to avoid startup crashes)
│   │   ├── auth.service.ts               # Core Business Orchestration layer
│   │   └── index.ts                      # Service exports index
│   └── middleware/
│       └── auth.middleware.ts            # Extraction, RBAC, Permission Guard, & Rate Limit middlewares
```

---

## 🔒 Security Implementations

1. **Helmet & Security Headers**: Installed via Express.
2. **Timing-Safe Password Comparison**: Enforced using `bcryptjs` comparing hashes directly in memory.
3. **Password Strength Validation**: Requirements:
   - At least 8 characters
   - At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character
4. **Account Locking & Bruteforce Protection**:
   - Accounts are automatically locked for **15 minutes** after **5 consecutive failed login attempts**.
   - `failedLoginAttempts` and `accountLockedUntil` fields are fully synced in the PostgreSQL schema.
5. **Rate Limiting**: Enforced via `express-rate-limit` on all auth routes (`/register`, `/login`, `/forgot-password`, `/reset-password`) capping traffic at **15 requests per 15 minutes per IP**.
6. **Refresh Token Rotation & Theft Detection**:
   - Every refresh token is signed with a `refreshTokenVersion`.
   - On refresh, a new token pair is generated, and `refreshTokenVersion` is incremented.
   - If a compromised/outdated refresh token is re-submitted, the application detects the mismatch, increments the database version immediately to **revoke all active sessions for that user** as an emergency circuit breaker.

---

## 🔑 REST API Endpoints (`/api/auth`)

All requests validate payloads against Zod schemas.

| Method | Route | Authentication | Rate Limited | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | None | Yes | Register a new user + sync with Firebase Auth |
| **POST** | `/api/auth/login` | None | Yes | Authenticate via local Email/Pass OR via SSO (Firebase ID Token) |
| **POST** | `/api/auth/refresh` | None | No | Rotate JWT token pair via valid refresh token |
| **POST** | `/api/auth/logout` | JWT Bearer | No | Invalidate all sessions (revokes refresh token) |
| **POST** | `/api/auth/forgot-password` | None | Yes | Generate a secure dynamic password reset link/token |
| **POST** | `/api/auth/reset-password` | None | Yes | Validate reset token and update user password |
| **GET** | `/api/auth/verify-email` | None | No | Marks a user email verified via verification token |
| **GET** | `/api/auth/me` | JWT Bearer | No | Retrieves current logged-in user profile info |

---

## ⚙️ Environment Variables (`.env.example`)
Ensure the following variables are configured in your `.env`:
```env
# JWT configurations
JWT_ACCESS_SECRET="your_long_random_access_secret_here"
JWT_REFRESH_SECRET="your_long_random_refresh_secret_here"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
```
