# REST API Reference Documentation

This document provides complete documentation for the REST API endpoints provided by the **ApplyHub Backend Server** (`/api/v1`).

---

## 🔐 Base URL & Headers

- **Base URL**: `http://localhost:8080/api/v1` (or your production API domain)
- **Content-Type**: `application/json` (or `multipart/form-data` for file uploads)
- **Authentication**: JWT Bearer token in `Authorization: Bearer <token>` header OR via HTTP-only `access_token` cookie.

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/register-email`
Registers a new user account with name, email, and password.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully. Please check your email to verify your account.",
    "data": null
  }
  ```

---

### `POST /auth/login-email`
Authenticates a user via email and password.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": {
        "id": "60d5ecb8b3b3a214c8e3b1a1",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "isEmailVerified": true
      },
      "accessToken": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```

---

### `POST /auth/send-phone-otp`
Sends a 6-digit OTP to a user's phone number for phone sign-in.
- **Auth**: Public
- **Request Body**:
  ```json
  { "phone": "+919876543210" }
  ```

---

### `POST /auth/verify-phone-otp`
Verifies a 6-digit phone OTP and issues authentication tokens.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "phone": "+919876543210",
    "otp": "123456"
  }
  ```

---

### `POST /auth/refresh-token`
Exchanges a valid refresh token cookie/body for a new short-lived access token.
- **Auth**: Public (Requires valid Refresh Token in Cookie/Body)

---

### `POST /auth/logout`
Revokes active session, invalidates refresh token in DB, and clears cookies.
- **Auth**: Protected

---

## 2. Job Discovery & Aggregation Endpoints (`/jobs`)

### `GET /jobs/search`
Queries all 15+ job providers in parallel, deduplicates, enriches, ranks by weighted score, and returns paginated job listings.
- **Auth**: Protected
- **Query Parameters**:
  - `query` (string): Keywords or title (e.g. `React`)
  - `location` (string): Location or city
  - `workMode` (string): `remote`, `hybrid`, `onsite`, or `any`
  - `salary` (number): Minimum salary
  - `country` (string): Target country (default: `India`)
  - `page` (number): Page number (default: `1`)
  - `limit` (number): Items per page (default: `12`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Jobs aggregated and matched successfully.",
    "data": {
      "jobs": [
        {
          "id": "60d5ecb8b3b3a214c8e3b1a2",
          "title": "Senior React Engineer",
          "company": "Stripe",
          "logo": "https://logo.clearbit.com/stripe.com",
          "location": "Bengaluru, Karnataka, India",
          "remoteType": "remote",
          "employmentType": "Full-time",
          "experience": "Senior (5+ years)",
          "salary": "₹2,200,000",
          "skills": ["React", "Node.js", "TypeScript"],
          "matchScore": 88,
          "source": "remotive",
          "applyUrl": "https://stripe.com/jobs/123"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 12,
        "total": 45,
        "totalPages": 4,
        "hasMore": true
      }
    }
  }
  ```

---

### `GET /jobs/:jobId`
Retrieves detailed information for a specific job, including complete description, company metadata, internship stats, and candidate-specific AI Career Assistant roadmap.
- **Auth**: Protected
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Job details retrieved successfully.",
    "data": {
      "job": {
        "id": "60d5ecb8b3b3a214c8e3b1a2",
        "title": "Senior React Engineer",
        "company": "Stripe",
        "description": "Full job text...",
        "companyWebsite": "https://stripe.com",
        "companySize": "1000-5000 employees",
        "companyIndustry": "Financial Services",
        "benefits": ["Health Insurance", "Stock Options"],
        "matchScore": 88,
        "why": "Candidate possesses required React and TypeScript skills.",
        "interviewReadiness": "Ready",
        "difficultyLevel": "Hard",
        "interviewTopics": ["React Fiber", "State Synchronization"],
        "prepRoadmap": ["Review React rendering lifecycle", "Practice API rate limiting design"],
        "learningResources": [
          { "title": "React Architecture", "url": "https://react.dev" }
        ]
      }
    }
  }
  ```

---

### `GET /jobs/recommended`
Returns cached jobs scored against the user's active resume, sorted by highest compatibility score first.
- **Auth**: Protected

---

### `GET /jobs/providers/health`
Returns health check diagnostic status for all 15+ registered job scrapers.
- **Auth**: Protected

---

## 3. Resume Management Endpoints (`/resumes`)

### `POST /resumes/upload`
Uploads a PDF/DOCX resume file, parses text, runs AI ATS analysis, and stores the resume version.
- **Auth**: Protected
- **Content-Type**: `multipart/form-data`
- **Form Field**: `resume` (File)
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Resume uploaded, parsed, and analyzed successfully.",
    "data": {
      "resume": {
        "id": "60d5ecb8b3b3a214c8e3b1a3",
        "version": 1,
        "fileName": "John_Doe_Resume.pdf",
        "fileUrl": "https://res.cloudinary.com/demo/image/upload/v12345/resumes/resume.pdf",
        "atsAnalysis": {
          "atsScore": 82,
          "strongSkills": ["React", "Node.js", "MongoDB"],
          "missingSkills": ["GraphQL", "Docker"],
          "improvementSuggestions": ["Add metrics to experience bullets"]
        },
        "isActive": true
      }
    }
  }
  ```

---

### `GET /resumes`
Retrieves all uploaded resume versions for the authenticated user.
- **Auth**: Protected

---

### `PATCH /resumes/:resumeId/active`
Sets a specific resume version as active for job matching and recommendations.
- **Auth**: Protected

---

## 4. Application Tracker Endpoints (`/applications`)

### `POST /applications`
Saves or updates a job application status in the candidate's tracker board.
- **Auth**: Protected
- **Request Body**:
  ```json
  {
    "jobId": "60d5ecb8b3b3a214c8e3b1a2",
    "status": "applied",
    "notes": "Applied via official website portal."
  }
  ```

---

### `GET /applications`
Retrieves all job applications tracked by the authenticated candidate.
- **Auth**: Protected

---

### `PATCH /applications/:id/status`
Updates the status column of an application (`saved`, `applied`, `pending`, `interview`, `offer`, `rejected`).
- **Auth**: Protected
- **Request Body**:
  ```json
  { "status": "interview" }
  ```

---

### `POST /applications/cover-letter`
Generates a tailored AI cover letter for a specific job posting based on the user's active resume.
- **Auth**: Protected
- **Request Body**:
  ```json
  { "jobId": "60d5ecb8b3b3a214c8e3b1a2" }
  ```

---

## 5. System Admin & Diagnostics Endpoints (`/system`)

### `GET /system/health`
Returns overall system status, uptime, memory usage, database connection status, and AI provider diagnostics.
- **Auth**: Admin Only (`role === 'admin'`)

---

### `GET /system/metrics`
Returns system performance metrics (CPU, RAM, total user count, application pipeline totals).
- **Auth**: Admin Only

---

### `GET /system/users`
Paginated search and list of registered platform users.
- **Auth**: Admin Only

---

## ❓ Interview Questions & Answers

### Q1: How does ApplyHub secure API endpoints against unauthorized access?
**Answer**: ApplyHub uses `protect` middleware (`middleware/auth.js`) on secure routes. The middleware extracts the JWT access token from HTTP-only cookies (`req.cookies.access_token`) or the `Authorization: Bearer <token>` header. It verifies the token using `jsonwebtoken` and `JWT_ACCESS_SECRET`. If valid, it attaches the decoded user payload (`req.user = { userId, role }`) to the request object. If invalid or expired, it throws an `UnauthorizedError` (HTTP 401).
