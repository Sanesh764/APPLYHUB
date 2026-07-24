# Error Handling Architecture

This document details the centralized error handling framework implemented in **ApplyHub**.

---

## 🛠 Overview

ApplyHub uses a typed custom error hierarchy (`backend/utils/errors/`) combined with an async wrapper (`utils/asyncHandler.js`) and a central Express error handler (`middleware/errorHandler.js`).

---

## 🏗 Error Class Hierarchy

All custom errors inherit from the base `ApiError` class:

```
ApiError (Base Error Class)
├── BadRequestError       (HTTP 400 - Invalid input / missing fields)
├── UnauthorizedError     (HTTP 401 - Missing or invalid JWT token)
├── ForbiddenError        (HTTP 403 - Role authorization failure)
├── NotFoundError         (HTTP 404 - Resource missing)
├── ConflictError         (HTTP 409 - Duplicate email / application)
├── ValidationError      (HTTP 422 - Schema / payload validation failure)
└── InternalServerError   (HTTP 500 - System failure)
```

### Base `ApiError.js` Implementation
```javascript
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

---

## 🔄 Error Flow Architecture

```mermaid
flowchart TD
    Controller[Express Route Controller] -->|Throws Error / Rejection| Wrapper[asyncHandler]
    Wrapper -->|Passes error to next(err)| ExpressPipeline[Express Error Pipeline]
    ExpressPipeline --> Handler[Central Error Handler Middleware]
    
    Handler --> Logger[Winston Logger: Write to Log Files]
    Handler --> Masking{NODE_ENV === 'production'?}
    
    Masking -->|Yes| SanitizedResponse[Return Sanitized JSON without Stack Traces]
    Masking -->|No| DetailedResponse[Return Full JSON with Error Stack]
```

---

## 📋 Standardized Error Response Format

Every API error returns a predictable JSON response structure:

```json
{
  "success": false,
  "message": "Invalid email or password credentials provided.",
  "code": "AUTHENTICATION_FAILED"
}
```

In development mode (`NODE_ENV === 'development'`), the `stack` trace property is included for debugging.

---

## ❓ Interview Questions & Answers

### Q1: What is the distinction between Operational Errors and Developer Errors?
**Answer**: **Operational errors** (`isOperational: true`) represent expected runtime errors caused by user input or environment state (e.g., invalid password, expired token, missing file format). They inherit from `ApiError` and return helpful error messages to the client. **Developer errors** (`isOperational: false`) represent unexpected software bugs (e.g. `TypeError: Cannot read property of undefined`, database connection drops). ApplyHub catches developer errors, logs full stack traces via Winston, and returns a generic `500 Internal Server Error` to hide internal details in production.
