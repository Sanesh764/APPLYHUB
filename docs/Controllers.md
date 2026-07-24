# Controllers Reference

This document details the responsibilities and methods of all Express controllers implemented in `backend/controllers/`.

---

## 🛠 Controller Overview

Controllers receive validated requests from Express routes, call domain services to execute business logic, format JSON response structures using helper functions (`utils/response.js`), and pass unhandled errors to `asyncHandler`.

---

## 1. Auth Controller (`controllers/auth.controller.js`)

Manages user authentication lifecycle, registration, credentials validation, and session cookies.

| Method | Endpoint | Description |
|---|---|---|
| `registerEmail` | `POST /auth/register-email` | Registers a new email/password account. Calls `authService.registerEmail()`. |
| `loginEmail` | `POST /auth/login-email` | Authenticates email/password credentials, issues tokens, sets cookies. |
| `sendPhoneOTP` | `POST /auth/send-phone-otp` | Generates 6-digit OTP and sends via SMS service. |
| `verifyPhoneOTP` | `POST /auth/verify-phone-otp` | Verifies phone OTP, creates user session, issues cookies. |
| `refreshToken` | `POST /auth/refresh-token` | Verifies refresh token, rotates tokens, and returns new access token. |
| `logout` | `POST /auth/logout` | Clears auth cookies and revokes active session document in DB. |
| `getMe` | `GET /auth/me` | Returns profile details of authenticated user. |

---

## 2. Job Controller (`controllers/job.controller.js`)

Manages live multi-provider job searches, cached queries, details lookup, and provider health.

| Method | Endpoint | Description |
|---|---|---|
| `searchJobs` | `GET /jobs/search` | Executes parallel fan-out search across scrapers, enriches, dedupes, ranks results, caches in Mongo, and returns paginated page. |
| `getJobs` | `GET /jobs` | Returns cached jobs from MongoDB with filters (location, mode, salary). |
| `getRecommended` | `GET /jobs/recommended` | Scores cached recent jobs against user's active resume using matching engine. |
| `getJobDetails` | `GET /jobs/:jobId` | Retrieves job details, company metadata, internship stats, and AI Career Assistant roadmap. |
| `getProvidersHealth` | `GET /jobs/providers/health` | Returns health status probe for all 15+ registered scrapers. |

---

## 3. Resume Controller (`controllers/resume.controller.js`)

Manages document upload, parsing, active resume selection, and version history.

| Method | Endpoint | Description |
|---|---|---|
| `uploadResume` | `POST /resumes/upload` | Uploads file to Storage Service, parses text via `ParserService`, runs AI ATS analysis, and stores version. |
| `getResumes` | `GET /resumes` | Retrieves all uploaded resume versions for user. |
| `getActiveResume` | `GET /resumes/active` | Retrieves candidate's current active resume. |
| `setActiveResume` | `PATCH /resumes/:resumeId/active` | Switches active resume version used for job matching. |
| `deleteResume` | `DELETE /resumes/:resumeId` | Removes resume version and cleans up media file from storage. |

---

## 4. Application Controller (`controllers/application.controller.js`)

Manages candidate Kanban application board state, analytics, and cover letter generation.

| Method | Endpoint | Description |
|---|---|---|
| `getApplications` | `GET /applications` | Retrieves tracked application cards for user pipeline. |
| `createApplication` | `POST /applications` | Saves or updates a job application in tracker (`saved`, `applied`, etc.). |
| `updateStatus` | `PATCH /applications/:id/status` | Updates Kanban status column for an application. |
| `generateCoverLetter` | `POST /applications/cover-letter` | Invokes AI service to write a tailored cover letter for a job. |
| `getAnalytics` | `GET /applications/analytics` | Calculates ATS average, pipeline count breakdown, and response rates. |

---

## 5. System Controller (`controllers/system.controller.js`)

Administrative management and platform metrics console.

| Method | Endpoint | Description |
|---|---|---|
| `getSystemHealth` | `GET /system/health` | Diagnostic status for DB, memory, uptime, and AI providers. |
| `getSystemMetrics` | `GET /system/metrics` | Platform performance and pipeline metrics. |
| `getUsers` | `GET /system/users` | Paginated search and list of registered users. |
| `updateUserRole` | `PATCH /system/users/:userId/role` | Mutates user role (`user` -> `admin`). |

---

## ❓ Interview Questions & Answers

### Q1: Why do controllers return standard response helpers (`sendSuccess`) instead of invoking `res.json()` directly?
**Answer**: Using standard response helpers (`utils/response.js`) enforces consistent API contracts across the entire system. Every API response follows a uniform JSON structure `{ success: true, message: "...", data: { ... } }`, making it predictable and straightforward for frontend client code and third-party integrations to consume.
