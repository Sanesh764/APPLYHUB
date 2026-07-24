# Backend Architecture & Implementation

This document provides in-depth technical documentation for the **ApplyHub Node.js & Express API Backend**.

---

## 🚀 Overview

The backend is a Node.js application built on Express 5. It serves a RESTful JSON API to the frontend SPA. It manages user authentication, resume parsing, job scraping & aggregation, AI semantic matching, and background cache warming.

---

## ⚙️ Application Entry Point & Bootstrap

The backend entry point is split into two files:
1. **`backend/app.js`**: Configures middleware, security HTTP headers, body parsers, static asset serving, API routes, and central error handlers.
2. **`backend/server.js`**: Handles uncaught exceptions, connects to MongoDB, starts background cron jobs, and boots the HTTP server.

```javascript
// server.js uncaught exception handler snippet
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...", { error: err });
  process.exit(1);
});
```

---

## 🛡 Middleware Execution Pipeline

Every incoming HTTP request traverses the Express middleware pipeline in `app.js`:

```
Incoming Request
    │
    ▼
1. Helmet Security Headers (helmet())
    │
    ▼
2. CORS Handler (cors({ origin: allowedOrigins, credentials: true }))
    │
    ▼
3. Response Compression (compression())
    │
    ▼
4. Body Parsers (express.json({ limit: "10kb" }), express.urlencoded())
    │
    ▼
5. Cookie Parser (cookieParser())
    │
    ▼
6. User Agent Parser (express-useragent)
    │
    ▼
7. Global Rate Limiter (/api/ rate limits)
    │
    ▼
8. API Route Handlers (/api/v1/*)
    │
    ▼
9. 404 Route Catch Handler (notFoundHandler)
    │
    ▼
10. Global Error Handler (errorHandler)
```

---

## 📁 Core Backend Modules

| Module | Primary Responsibility | File Path |
|---|---|---|
| **Auth Controller & Service** | Manages user registration, JWT generation, bcrypt password hashing, OTP verification, and session management. | `controllers/auth.controller.js`, `services/auth.service.js` |
| **Job Aggregator Engine** | Executes parallel job fetching across 15+ job scrapers, deduplicates using Jaccard text overlap, filters by country, and ranks by weighted relevance. | `services/jobAggregator.service.js`, `services/providers/index.js` |
| **Job Enrichment Service** | Extracts skills, technologies, experience levels, and salary ranges from job descriptions using fast deterministic regex patterns. | `services/jobEnrichment.service.js` |
| **AI Orchestrator** | Dispatches AI requests across NVIDIA, DeepSeek, Gemini, and OpenAI with automatic fallback and Zod schema validation. | `services/ai.service.js`, `services/ai/providers/base.provider.js` |
| **Matching Engine** | Computes hybrid job compatibility score (60% Semantic AI match + 40% Local deterministic keyword score). | `services/matching.service.js` |
| **Resume Parser Service** | Extracts raw text from PDF (`pdf-parse`) and DOCX (`mammoth`) uploads. | `services/parser.service.js` |
| **Storage Service** | Dual-mode storage service (Cloudinary cloud media upload with local disk fallback). | `services/storage.service.js` |
| **Cron Cache Service** | Scheduled background task (`node-cron`) running every 45 minutes to refresh job search caches and prune listings older than 21 days. | `services/cron.service.js` |

---

## ❓ Interview Questions & Answers

### Q1: How does `asyncHandler` work in ApplyHub's Express controller routes?
**Answer**: In Express 4 and earlier Express pattern setups, unhandled promise rejections inside async route handlers would hang requests or cause process crashes if not wrapped in `try/catch`. ApplyHub uses an `asyncHandler` wrapper (`utils/asyncHandler.js`):
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```
This catches any asynchronous error thrown in a controller and automatically forwards it to `next(err)`, triggering the central `errorHandler` middleware cleanly without needing repetitive `try/catch` blocks in every controller method.
