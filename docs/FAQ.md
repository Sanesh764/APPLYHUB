# Frequently Asked Questions (FAQ)

This document answers common questions regarding **ApplyHub's** architecture, features, troubleshooting, and setup.

---

## ❓ Frequently Asked Questions

### 1. Does ApplyHub automatically submit job applications on candidate job boards?
**No**. ApplyHub operates on a strict **Candidate-in-the-Loop** model. ApplyHub automatically aggregates job listings, calculates AI resume match scores, and writes tailored cover letters, but clicking **Apply Now** redirects the candidate directly to the employer's official application portal (`applyUrl`). ApplyHub never auto-submits applications.

### 2. What happens if an AI provider API key (like NVIDIA or Gemini) expires or hits quota limits?
ApplyHub features an automatic AI provider fallback chain (`NVIDIA` -> `DeepSeek` -> `Gemini` -> `OpenAI`). If the active provider fails or returns a HTTP 429 rate limit error, the system seamlessly swaps to the next provider. If all providers are unconfigured or fail, a deterministic mock fallback is returned so application features continue working cleanly.

### 3. Which job boards are aggregated by default?
ApplyHub aggregates listings from 15+ job scrapers in parallel, including **Adzuna**, **Remotive**, **Arbeitnow**, **Greenhouse**, **Lever**, **SmartRecruiters**, **Ashby**, **Recruitee**, **LinkedIn**, **Indeed**, **Naukri**, **Foundit**, **Cutshort**, **Instahyre**, **Wellfound**, and **YC Jobs**.

### 4. How does ApplyHub store uploaded resume files?
ApplyHub uses a dual-mode storage engine (`storage.service.js`). If Cloudinary credentials are set in `.env`, resumes are stored securely in cloud media storage. If Cloudinary credentials are missing, resumes fall back to being stored locally on disk under `backend/public/uploads/`.

### 5. Can I configure ApplyHub to search jobs in countries other than India?
**Yes**. ApplyHub uses a country-agnostic architecture (`CountryService.js`). While India is configured as the default country context, passing `country=United States` or `country=United Kingdom` in API requests dynamically updates search filters, currency symbols, location matching rules, and candidate eligibility criteria without backend code changes.
