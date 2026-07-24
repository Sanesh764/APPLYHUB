# Security Implementation Documentation

This document describes the security protocols, policies, and safeguards implemented across the **ApplyHub** platform.

---

## 🛡 Security Architecture Summary

```
Incoming Client Request
    │
    ▼
┌───────────────────────────────────────────────────────────┐
│ 1. Helmet HTTP Security Headers                           │
│    (X-Content-Type-Options, X-Frame-Options, HSTS, CSP)   │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│ 2. Restricted CORS Policy                                 │
│    (Origin Whitelisting + Credentials Allowed)            │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│ 3. Express Rate Limiting                                  │
│    (100 req/15m API, 10 req/15m Auth, 3 req/hr OTP)       │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│ 4. Payload Size Caps                                      │
│    (express.json({ limit: "10kb" }) - DoS Protection)     │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│ 5. Input Validation & Sanitization                        │
│    (express-validator & Zod Schemas)                      │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│ 6. JWT Authentication & Session Tracking                  │
│    (HTTP-Only Cookies, SHA-256 Refresh Hashes, RBAC)      │
└───────────────────────────────────────────────────────────┘
```

---

## 🔒 Implemented Security Features

### 1. HTTP-Only Cookies & XSS Protection
To prevent Cross-Site Scripting (XSS) attacks from stealing tokens via `document.cookie`, access and refresh tokens are served exclusively inside HTTP-only cookies (`httpOnly: true`). This ensures token contents are inaccessible to malicious JavaScript scripts running in the browser.

### 2. Password Hashing (`bcryptjs`)
User passwords are standardly salted and hashed using `bcryptjs` with 10 salt rounds before storage. Plain-text passwords are never saved or logged.

### 3. Rate Limiting (`express-rate-limit`)
Three rate limiters are configured in `middleware/rateLimiter.js`:
- **Global API Rate Limiter**: 100 requests per 15 minutes per IP.
- **Authentication Limiter**: 10 login/verify attempts per 15 minutes per IP.
- **OTP Request Limiter**: 3 SMS OTP requests per hour per IP (prevents SMS inflation fraud).

### 4. HTTP Security Headers (`Helmet`)
`app.use(helmet())` automatically sets standard security headers:
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `X-Frame-Options: SAMEORIGIN` (prevents clickjacking framing)
- `Strict-Transport-Security` (enforces HTTPS connections)
- `X-XSS-Protection` (enforces browser XSS filtering)

### 5. Cross-Origin Resource Sharing (`CORS`)
CORS is explicitly configured to allow requests only from trusted origins specified in `process.env.FRONTEND_URL` and predefined domains:
```javascript
cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS Policy Violation: Origin not allowed"), false);
  },
  credentials: true
})
```

### 6. Security Audit Logging (`AuditLog.js`)
Critical security events (logins, password resets, role updates, failed authentications) are recorded by `AuditService` in the `AuditLog` collection, logging:
- `userId`
- `action`
- `ipAddress`
- `userAgent`
- `timestamp`

---

## ❓ Interview Questions & Answers

### Q1: How does ApplyHub defend against Cross-Site Request Forgery (CSRF)?
**Answer**: ApplyHub defends against CSRF by combining strict CORS origin checks with `SameSite=Lax` (or `SameSite=None` with `Secure=true` in production) cookie flags. Additionally, state-changing API endpoints enforce authentication via custom `Authorization` headers or cookie validation checks that browsers block from cross-origin form submissions.
