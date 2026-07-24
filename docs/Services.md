# Services & Business Logic Layer Reference

This document details the business logic layer implemented in `backend/services/`.

---

## 🛠 Business Services Summary

Services contain reusable, framework-independent business logic, data aggregations, third-party API adapters, and background tasks.

| Service Name | File Path | Responsibilities |
|---|---|---|
| **`AuthService`** | `services/auth.service.js` | Account registration, password hashing (`bcryptjs`), login validation, session tracking, OTP generation/verification. |
| **`JobAggregatorService`** | `services/jobAggregator.service.js` | Parallel job fetching (`Promise.allSettled`), Jaccard description deduplication, country filtering, weighted ranking algorithm. |
| **`CountryService`** | `services/country.service.js` | Parameterized location matching, token normalization, city/state definitions, country eligibility checks, ranking tiers (defaults to India). |
| **`JobEnrichmentService`** | `services/jobEnrichment.service.js` | Fast deterministic regex scanner for skills, technologies, experience levels, education, and salary ranges. |
| **`MatchingService`** | `services/matching.service.js` | Hybrid job compatibility engine combining 60% Semantic AI match score with 40% local Jaccard keyword match score. |
| **`AIService`** | `services/ai.service.js` | Multi-LLM provider orchestrator (`NVIDIA` -> `DeepSeek` -> `Gemini` -> `OpenAI`) with fallback handling. |
| **`AIAnalysisService`** | `services/aiAnalysis.service.js` | Compiles and caches user-job AI analysis documents (`AIAnalysis` collection) in MongoDB. |
| **`ParserService`** | `services/parser.service.js` | Document parser extracting plain text from PDF (`pdf-parse`) and Word DOCX (`mammoth`) uploads. |
| **`StorageService`** | `services/storage.service.js` | Dual-mode storage manager uploading to Cloudinary Cloud when configured, or saving to `backend/public/uploads/` on local disk. |
| **`CronService`** | `services/cron.service.js` | Scheduled background task (`node-cron`) running every 45 minutes to refresh job caches and prune listings older than 21 days. |
| **`EmailService`** | `services/email.service.js` | Nodemailer SMTP email service sending HTML transaction emails (verification, OTPs, application alerts). Fallback prints to Winston logger. |
| **`SMSService`** | `services/sms.service.js` | SMS OTP delivery abstraction layer. |
| **`TokenService`** | `services/token.service.js` | Signs and verifies JWT access & refresh tokens, manages HTTP-only cookie attachment. |
| **`CacheService`** | `services/cache.service.js` | Fast in-memory TTL caching service for search query results and match scores. |
| **`AuditService`** | `services/audit.service.js` | Persists user security audit logs to MongoDB (`AuditLog` collection). |
| **`NotificationService`** | `services/notification.service.js` | Creates and manages user in-app notifications. |

---

## 🔍 Key Service Implementations

### 1. `JobAggregatorService.js` (Smart Weighted Ranking)
The aggregator ranks job listings using a weighted multi-signal formula:

```javascript
// Formula calculation snippet from jobAggregator.service.js
let score = 0;
score += (resumeScore / 100) * 40;   // 40% Resume Keyword Overlap
score += countryScore;                // 20% Target Country Location Tier
score += freshnessScore;              // 15% Posting Freshness
score += salaryScore;                 // 10% Salary Level
score += skillMatchScore;             // 10% Search Query Match
score += companyQualityScore;         // 5%  Company Brand Quality
```

### 2. `ParserService.js` (Document Extraction)
```javascript
class ParserService {
  async extractText(fileBuffer, mimeType) {
    if (mimeType === "application/pdf") {
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text;
    } else if (mimeType.includes("wordprocessingml") || mimeType.includes("docx")) {
      const docData = await mammoth.extractRawText({ buffer: fileBuffer });
      return docData.value;
    }
    throw new BadRequestError("Unsupported file format. Please upload PDF or DOCX.");
  }
}
```

---

## ❓ Interview Questions & Answers

### Q1: How does `StorageService` implement graceful degradation between cloud and local storage?
**Answer**: `StorageService` checks if Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`) exist in process environment variables. If present, it initializes the Cloudinary SDK and uploads media assets to cloud storage. If missing, it automatically degrades to disk storage mode, saving files to `backend/public/uploads/` and serving them as static Express routes. This allows local development without mandatory cloud credentials.
