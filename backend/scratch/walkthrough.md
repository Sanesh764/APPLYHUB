# ApplyHub System Walkthrough

This document guides you through the architecture, features, and verification of the completed modules for the **ApplyHub** platform: the **User Authentication System**, the **Storage Layer**, the **AI Provider Architecture**, the **Job Aggregation & Matching System**, and our new **India-First, Country-Agnostic Job Search Engine**.

---

## 💼 Job Aggregation & Application System (New Refactor)

We have refactored the Job Search Engine into a production-grade, AI-powered system that supports multiple countries while making India the default.

### 1. Country-Agnostic Architecture (Requirement 1)
- **Dynamic Scoping**: Country filtering is parameterized. If the user changes the country in the future (e.g. from "India" to "United States"), the system automatically updates the search scopes, currency normalization, and eligibility checks without requiring code changes.
- **Dynamic Matching**: Checks if candidates from the target country are eligible to apply (taking into account remote timezones, visa sponsorship, or local presence).

### 2. Supported Job Providers (Requirement 7)
- **Greenhouse / Lever / Ashby / Recruitee / SmartRecruiters**: Dynamically fetch postings boards for popular startups and companies.
- **Adzuna**: Queries country-scoped openings (e.g. `in` for India).
- **Remotive / Arbeitnow**: Curates remote developer positions globally.
- **LinkedIn / Indeed / Naukri / Foundit / Cutshort / Instahyre / Wellfound / YC Jobs** *(new)*: Modular adapters added and registered in the provider registry to aggregate public postings.

### 3. Better Duplicate Detection (Requirement 6)
- **Description Similarity**: Calculates Jaccard word overlaps over job descriptions (threshold > 75%).
- **Multi-key check**: Resolves duplicates sharing identical apply URLs, title/company/location combinations, or high description overlap. Merges listings and keeps the newest posting.

### 4. Smart Ranking Algorithm (Requirement 8)
Replaces simple sorting with a weighted multi-signal relevance formula:
- **40% Resume Match**: Fast local Jaccard skill/technology overlap against candidate's active resume.
- **20% Country Priority**: Boosts jobs that match the target country (Tier 0: local onsite/hybrid; Tier 1: local remote; Tier 2: global remote open to country; Tier 3: other).
- **15% Freshness**: Boosts newer postings (decaying over 30 days).
- **10% Salary**: Boosts jobs specifying higher compensation bounds.
- **10% Skill Match**: Boosts jobs matching query keywords in title, description, and tags.
- **5% Company Quality**: Boosts postings from top brand names or having logos/websites.

### 5. AI Job Enrichment (Requirement 3 & 11)
For every fetched job, our AI models (NVIDIA Llama fallback to DeepSeek / Gemini) extract and normalize:
- **General info**: Complete description, responsibilities, skills, technologies, salary, experience, education, benefits, and visa sponsorship status.
- **Company info**: Website, size, industry, and description.
- **Internship details**: Surfaced fields for stipend, duration, internship type (Paid/Unpaid), PPO availability, start date, and eligibility. Defaults to `"Not Disclosed"` or `"Not Specified"` when unavailable.

### 6. Dedicated Job Details Page (Requirement 9 & 10)
- **Dedicated Route**: `/jobs/:jobId` is registered as a standalone details route.
- **AI Career Assistant**: Surfaces candidate-specific matching details on the page:
  - **Why this job matches**: Overall compatibility explanation.
  - **Interview Readiness**: Custom readiness check ("Ready", "Requires Prep", "Not Ready").
  - **Difficulty Level**: Estimations for candidate's level ("Entry", "Medium", "Hard").
  - **Interview Topics**: List of expected technical or behavioral questions.
  - **Prep Roadmap**: Personalized preparation guide.
  - **Suggested Resources**: Clickable links for target learning.
- **Official Apply Redirect**: The page includes an **Apply Now** button that opens the official link in a new tab (no auto-submitting).

---

## 🧪 Verification & Validation Results

### 1. Build Verification
We ran full production compiler builds on the frontend:
- **Command**: `npm run build`
- **Status**: **PASS** (Zero compile/bundler errors, completed in 1.34s)

### 2. Syntax Verification
We ran compiler syntax checks on all modified backend JavaScript files:
- **Command**: `node -c app.js ...`
- **Status**: **PASS** (100% correct JS syntax, zero errors)

---

## 🚀 Local Launch & Walkthrough

### Step 1: Start Backend Server
1. Go to `backend/` and launch the dev server:
   ```bash
   cd backend
   npm run dev
   ```
2. The server will start and print connection details.

### Step 2: Start Frontend Client
1. Go to `frontend/` and launch Vite:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

### Step 3: Discover & View Details
1. **Search**: Go to `/jobs`, search for "React Developer", and view search results matching India (default) and sorted by compatibility.
2. **Dedicated Details Page**: Click on any job card title. It will take you to `/jobs/<id>`, displaying the full description, company metadata, internship stats, and the complete AI Career Assistant interview roadmap and preparation resources.
3. **Redirect Apply**: Click **Apply Now** to open the official company page in a new window.
