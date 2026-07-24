# Folder Structure Guide

This document outlines the complete directory structure of **ApplyHub**, explaining the responsibilities of each directory and key file.

---

## 📁 Repository Overview

```
ApplyHub/
├── README.md                  # Main entry point documentation
├── docs/                      # Technical documentation suite
├── backend/                   # Node.js + Express REST API Backend
└── frontend/                  # React 19 + Vite Frontend SPA
```

---

## ⚙️ Backend Structure (`backend/`)

```
backend/
├── .env                       # Local environment secrets (ignored by git)
├── .env.Example               # Environment variable reference template
├── .gitignore                 # Backend git ignore definitions
├── app.js                     # Express application initialization & middleware pipeline
├── server.js                  # Entry point: HTTP server, DB connection, uncaught exception handlers
├── package.json               # Backend dependencies & script definitions
├── config/                    # Configuration modules
│   ├── db.js                  # Mongoose MongoDB connection setup
│   └── logger.js              # Winston logger configuration
├── constants/                 # Domain constants
│   └── india.js               # Legacy India-first location constants (delegates to CountryService)
├── controllers/               # Express route request handlers
│   ├── application.controller.js  # Application pipeline CRUD & cover letter generator
│   ├── auth.controller.js         # Authentication, login, signup, OTP, session management
│   ├── job.controller.js          # Job search, aggregation, caching, details view
│   ├── notification.controller.js # User notifications management
│   ├── profile.controller.js      # User profile preferences
│   ├── resume.controller.js       # Resume upload, active selection, version history
│   └── system.controller.js       # System metrics, audit logs, admin user management
├── middleware/                # Express middleware pipeline
│   ├── auth.js                # JWT authentication & role authorization middleware
│   ├── errorHandler.js        # Centralized global error handling middleware
│   ├── notFound.js            # 404 Route catch handler
│   ├── rateLimiter.js         # Express rate limiters for security
│   ├── validation.js          # Express-validator request sanitization rules
│   └── zodValidation.js       # Zod schema validation middleware
├── models/                    # Mongoose database schemas
│   ├── AIAnalysis.js          # Cached AI match analysis per user/job
│   ├── Application.js         # Application tracking records
│   ├── AuditLog.js            # User security audit trail
│   ├── Job.js                 # Unified job listings model
│   ├── Notification.js       # User notifications
│   ├── OTP.js                 # One-time passwords for phone auth/resets
│   ├── Profile.js             # User job preferences & criteria
│   ├── Resume.js              # Parsed resume documents & ATS scores
│   ├── Session.js             # Active user sessions & refresh token hashes
│   └── User.js                # User accounts & roles
├── routes/                    # Express API route endpoints
│   ├── ai.routes.js           # Direct AI analysis endpoints
│   ├── application.routes.js  # Application tracker endpoints
│   ├── auth.routes.js         # Auth endpoints (signup, login, OTP)
│   ├── job.routes.js          # Job discovery & health endpoints
│   ├── notification.routes.js # Notification endpoints
│   ├── profile.routes.js      # Profile endpoints
│   ├── resume.routes.js       # Resume management endpoints
│   └── system.routes.js       # System admin & diagnostic endpoints
├── schemas/                   # Zod request validation schemas
│   └── profile.schema.js      # Profile validation rules
├── services/                  # Business logic & domain services
│   ├── ai.service.js          # Multi-LLM provider orchestrator
│   ├── aiAnalysis.service.js  # AI analysis document compilation & caching
│   ├── audit.service.js       # Audit log recorder
│   ├── auth.service.js        # Auth logic, bcrypt, OTP management
│   ├── cache.service.js       # In-memory TTL cache service
│   ├── country.service.js     # Country-agnostic location matching engine
│   ├── cron.service.js        # Scheduled cache warming & stale job pruning
│   ├── email.service.js       # Nodemailer SMTP email service
│   ├── jobAggregator.service.js # Multi-provider job scraper & weighted ranker
│   ├── jobEnrichment.service.js # Deterministic keyword & salary extractor
│   ├── matching.service.js    # Hybrid semantic AI + keyword scoring engine
│   ├── notification.service.js# User notifications manager
│   ├── parser.service.js      # PDF (pdf-parse) & DOCX (mammoth) text parser
│   ├── sms.service.js         # SMS OTP service abstraction
│   ├── storage.service.js     # Dual-mode storage (Cloudinary / local disk)
│   ├── token.service.js       # JWT signing & cookie management
│   ├── ai/                    # AI Provider implementations
│   │   └── providers/
│   │       ├── base.provider.js # Base AI provider with Zod schemas & mocks
│   │       ├── deepseek.provider.js # DeepSeek V3 API provider
│   │       ├── gemini.provider.js   # Google Gemini 1.5 Flash provider
│   │       ├── nvidia.provider.js   # NVIDIA NIM Llama 3.1 provider
│   │       └── openai.provider.js   # OpenAI GPT-4o-mini provider
│   └── providers/             # Job Board Scraping Adapters
│       ├── base.provider.js   # Base Job Provider abstract class
│       ├── index.js           # Job Provider registry
│       ├── adzuna.provider.js # Adzuna REST API adapter
│       ├── arbeitnow.provider.js # Arbeitnow public feed adapter
│       ├── ashby.provider.js   # Ashby public board adapter
│       ├── greenhouse.provider.js # Greenhouse public board adapter
│       ├── lever.provider.js   # Lever public board adapter
│       ├── linkedin.provider.js# Public LinkedIn job adapter
│       ├── indeed.provider.js  # Public Indeed job adapter
│       ├── naukri.provider.js  # Public Naukri job adapter
│       ├── remotive.provider.js# Remotive public feed adapter
│       └── ... (foundit, cutshort, instahyre, recruitee, smartrecruiters, wellfound, ycjobs)
└── utils/                     # Utility helpers & custom errors
    ├── asyncHandler.js        # Async error wrapper for Express routes
    ├── response.js            # Standardized API response formatters
    └── errors/                # Custom error classes
        ├── ApiError.js        # Custom base API error
        ├── errorCodes.js      # Error codes dictionary
        └── index.js           # Exported typed errors (BadRequestError, UnauthorizedError, etc.)
```

---

## 🎨 Frontend Structure (`frontend/`)

```
frontend/
├── index.html                 # HTML shell & font definitions
├── vite.config.js             # Vite 8 build & dev server config
├── package.json               # Frontend dependencies (React 19, Tailwind 4, React Query)
└── src/
    ├── App.jsx                # Router, Layout wrapper, & route declarations
    ├── App.css                # Base stylesheet
    ├── index.css              # TailwindCSS 4 imports & global theme styles
    ├── main.jsx               # React DOM entry point
    ├── components/            # Reusable UI components
    │   ├── AdminRoute.jsx     # Admin authorization route guard
    │   ├── ProtectedRoute.jsx # User authentication route guard
    │   └── ui/                # UI Primitives
    │       ├── Button.jsx     # Button component (primary, secondary, glass, danger)
    │       ├── Card.jsx       # Card container component with backdrop blur
    │       └── Input.jsx      # Form input with error states
    ├── contexts/              # React Context Providers
    │   └── AuthContext.jsx    # Global Authentication context (user, login, logout)
    ├── hooks/                 # Custom React Hooks
    │   └── useAuth.js         # Custom hook to consume AuthContext
    ├── pages/                 # Full Page Components
    │   ├── AdminDashboard.jsx # System metrics, logs, & user role management
    │   ├── CoverLetterModal.jsx # Modal popup for AI cover letter editing & printing
    │   ├── Dashboard.jsx      # Main candidate dashboard (stats, charts, notifications)
    │   ├── ForgotPassword.jsx # Forgot password request form
    │   ├── JobDetails.jsx     # Dedicated job details view page with AI assistant
    │   ├── JobSearch.jsx      # Filterable job discovery list with AI match badges
    │   ├── Login.jsx          # Email/Phone login view
    │   ├── Onboarding.jsx     # User onboarding preferences setup
    │   ├── Profile.jsx        # User profile management & active sessions
    │   ├── Register.jsx       # Account creation form
    │   ├── ResetPassword.jsx  # Reset password form
    │   ├── Resumes.jsx        # Resume upload, ATS score gauge, & versioning
    │   ├── Tracker.jsx        # Kanban application tracking board
    │   ├── VerifyEmail.jsx    # Email verification confirmation page
    │   └── VerifyOTP.jsx      # Phone OTP verification view
    └── services/              # Client-side API layer
        └── api.js             # Axios instance with credentials & response interceptors
```

---

## ❓ Interview Questions & Answers

### Q1: What is the benefit of separating Controllers from Services in Node.js?
**Answer**: Separating controllers from services enforces **Separation of Concerns (SoC)**. Controllers handle HTTP-specific concerns (reading `req.query`, `req.body`, formatting HTTP response status codes with `res.json()`). Services contain core business logic (aggregating scrapers, running AI LLM chains, interacting with database models). This makes services reusable (e.g. called from cron jobs or CLI scripts) and unit-testable without mocking Express request/response objects.
