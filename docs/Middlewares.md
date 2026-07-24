# Middleware Documentation

This document explains the custom Express middleware functions implemented in `backend/middleware/`.

---

## 🛠 Middleware Architecture Overview

Middleware functions intercept incoming HTTP requests, perform validation, authentication, rate limiting, or security checks, and either pass control to the next function using `next()` or throw an error.

---

## 1. Authentication & Authorization (`middleware/auth.js`)

- **`protect`**: Extracts JWT access token from HTTP-only cookies (`req.cookies.access_token`) or `Authorization: Bearer <token>` header. Decodes token using `token.service.js`, verifies user exists, and attaches `req.user = { userId, role }`.
- **`authorize(...roles)`**: Restricts endpoint execution to specific roles (e.g. `admin`). Throws `ForbiddenError` if `req.user.role` does not match.

```javascript
// protect middleware snippet
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.access_token;
  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) throw new UnauthorizedError("Authentication token required.");

  const decoded = tokenService.verifyAccessToken(token);
  req.user = decoded;
  next();
});
```

---

## 2. Global Error Handler (`middleware/errorHandler.js`)

Central error handling middleware registered at the end of `app.js`. It catches all errors (both operational `ApiError` instances and unhandled system errors), formats standardized JSON responses, logs trace errors using Winston logger, and masks internal error details in production (`NODE_ENV === 'production'`).

```javascript
const errorHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  logger.error(`[${req.method}] ${req.originalUrl} - ${error.statusCode} - ${error.message}`);
  
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code || "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
```

---

## 3. Rate Limiter Middleware (`middleware/rateLimiter.js`)

Uses `express-rate-limit` to prevent denial-of-service (DoS) and brute-force credential stuffing attacks.

- **`apiLimiter`**: General API limiter. Max 100 requests per 15-minute window per IP.
- **`authLimiter`**: Strict authentication limiter for `/auth/login-email` and `/auth/verify-phone-otp`. Max 10 requests per 15-minute window per IP.
- **`otpLimiter`**: Strict OTP request limiter for `/auth/send-phone-otp`. Max 3 requests per hour per IP.

---

## 4. 404 Not Found Handler (`middleware/notFound.js`)

Catches any request pointing to an unhandled endpoint path and forwards a `NotFoundError` (HTTP 404) to the central error handler.

```javascript
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
};
```

---

## 5. Input Validation Middlewares

- **`validation.js` (`express-validator`)**: Validates request parameters for authentication (email format, password complexity rules, phone E.164 formats).
- **`zodValidation.js` (`zod`)**: Validates request bodies against complex Zod schemas (e.g. `profile.schema.js`), casting inputs and returning field-level validation errors.

---

## ❓ Interview Questions & Answers

### Q1: Why is Express error-handling middleware required to take four arguments `(err, req, res, next)`?
**Answer**: Express uses function arity (number of arguments defined in the function signature) to identify error-handling middleware. When a function has exactly four parameters `(err, req, res, next)`, Express recognizes it as an error handler. Calling `next(err)` anywhere in the application bypasses standard middleware routes and jumps straight to the four-argument error handler.
