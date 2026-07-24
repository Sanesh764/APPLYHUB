# Data Models & Schemas Reference

This document provides detailed field-level documentation for all 10 Mongoose models defined in `backend/models/`.

---

## 1. User Model (`models/User.js`)

Represents user authentication accounts and platform roles.

| Field Name | Data Type | Validation / Options | Description |
|---|---|---|---|
| `name` | `String` | Required, Trim | Full name of the user. |
| `email` | `String` | Required, Unique, Lowercase, Trim | User email address. |
| `passwordHash` | `String` | Required | `bcryptjs` hashed password string. |
| `phone` | `String` | Unique, Sparse, Trim | Optional phone number for SMS OTP login. |
| `role` | `String` | Enum: `['user', 'admin']`, Default: `'user'` | Role-based authorization tier. |
| `isEmailVerified` | `Boolean` | Default: `false` | Email verification status flag. |
| `isPhoneVerified` | `Boolean` | Default: `false` | Phone OTP verification status flag. |
| `isBlocked` | `Boolean` | Default: `false` | Account lock flag. |
| `refreshTokens` | `[String]` | Default: `[]` | Array of active refresh token hashes. |

---

## 2. Job Model (`models/Job.js`)

Represents cached, enriched job listings aggregated from external providers.

| Field Name | Data Type | Description |
|---|---|---|
| `title` | `String` | Job position title. |
| `company` | `String` | Company or organization name. |
| `logo` | `String` | URL of company logo image. |
| `location` | `String` | Location string (city, state, country). |
| `remoteType` | `String` | Enum: `['remote', 'hybrid', 'onsite']`. |
| `employmentType` | `String` | Employment mode (Full-time, Internship, etc.). |
| `experience` | `String` | Required experience level string. |
| `salary` | `String` | Human-readable formatted salary string. |
| `salaryMin` / `salaryMax` | `Number` | Numeric salary bounds for filtering/sorting. |
| `skills` / `technologies` | `[String]` | Array of extracted skill/technology keywords. |
| `summary` | `String` | AI-generated summary of the job listing. |
| `description` | `String` | Full raw HTML/text job description. |
| `companyWebsite` | `String` | Company official URL. |
| `companySize` | `String` | Employee count range. |
| `companyIndustry` | `String` | Industry classification. |
| `benefits` | `[String]` | Extracted employee benefits list. |
| `visaSponsorship` | `String` | Visa sponsorship availability status. |
| `indiaEligible` | `String` | India candidate eligibility flag. |
| `isInternship` | `Boolean` | Flag indicating internship role. |
| `internshipDetails` | `Object` | Object containing stipend, duration, PPO status. |
| `source` | `String` | Provider machine name (adzuna, remotive, etc.). |
| `externalId` | `String` | Unique ID assigned by provider. |
| `applyUrl` | `String` | Redirect link to official application page. |

---

## 3. Resume Model (`models/Resume.js`)

Stores uploaded candidate resumes, parsed text, and ATS scores.

| Field Name | Data Type | Description |
|---|---|---|
| `userId` | `ObjectId` | Reference to owner `User`. |
| `version` | `Number` | Sequential version number (V1, V2, etc.). |
| `fileUrl` | `String` | URL to resume file (Cloudinary or local static path). |
| `cloudinaryId` | `String` | Public ID of Cloudinary media asset. |
| `fileName` | `String` | Original uploaded file name. |
| `rawExtractedText` | `String` | Extracted plain text from PDF/DOCX. |
| `parsedData` | `Object` | Zod-validated parsed resume structure (skills, education, projects). |
| `atsAnalysis` | `Object` | ATS score (0-100), strong/missing skills, suggestions. |
| `isActive` | `Boolean` | Flag identifying current active resume for matching. |

---

## 4. Application Model (`models/Application.js`)

Tracks candidate job application pipeline states.

| Field Name | Data Type | Description |
|---|---|---|
| `userId` | `ObjectId` | Reference to candidate `User`. |
| `jobId` | `ObjectId` | Reference to applied `Job`. |
| `resumeId` | `ObjectId` | Reference to `Resume` version used. |
| `status` | `String` | Enum: `['saved', 'applied', 'pending', 'interview', 'offer', 'rejected']`. |
| `notes` | `String` | User notes regarding the application. |
| `matchScore` | `Number` | AI match score at time of application. |
| `coverLetterText` | `String` | AI-generated cover letter text. |

---

## 5. Profile Model (`models/Profile.js`)

Stores candidate job search criteria and preferences.

| Field Name | Data Type | Description |
|---|---|---|
| `userId` | `ObjectId` | Reference to `User` account. |
| `preferredRole` | `String` | Target position (e.g. "React Developer"). |
| `experienceLevel` | `String` | Enum: `['entry', 'mid', 'senior', 'lead', 'executive']`. |
| `skills` | `[String]` | Self-reported candidate skills list. |
| `preferredCountries` | `[String]` | Desired job location countries. |
| `workMode` | `String` | Enum: `['remote', 'hybrid', 'onsite', 'any']`. |
| `expectedSalary` | `Number` | Target compensation number. |

---

## 6. AIAnalysis Model (`models/AIAnalysis.js`)

Caches heavy AI semantic matching results per (user, resume, job) triple.

| Field Name | Data Type | Description |
|---|---|---|
| `userId` / `resumeId` / `jobId` | `ObjectId` | References to user, resume version, and target job listing. |
| `atsScore` | `Number` | Match score percentage. |
| `matchingSkills` / `missingSkills` | `[String]` | Array of matching and missing skill strings. |
| `recommendation` | `String` | AI advice string. |
| `interviewReadiness` | `String` | Readiness assessment (`Ready`, `Requires Prep`, etc.). |
| `difficultyLevel` | `String` | Estimated interview difficulty. |
| `interviewTopics` | `[String]` | Expected technical questions topics. |
| `prepRoadmap` | `[String]` | Actionable step-by-step preparation guide. |

---

## 7. Session Model (`models/Session.js`)

Tracks active user logins, devices, and refresh tokens.

| Field Name | Data Type | Description |
|---|---|---|
| `userId` | `ObjectId` | Reference to `User`. |
| `refreshTokenHash` | `String` | Cryptographic SHA-256 hash of refresh token. |
| `ipAddress` | `String` | IP address of request. |
| `deviceType` / `browser` / `os` | `String` | User agent details parsed via `express-useragent`. |
| `expiresAt` | `Date` | Expiration timestamp (TTL index). |

---

## 8. OTP Model (`models/OTP.js`)

Stores temporary 6-digit codes for phone login and password reset.

| Field Name | Data Type | Description |
|---|---|---|
| `phone` / `email` | `String` | Recipient identifier. |
| `otpHash` | `String` | `bcryptjs` hash of 6-digit OTP code. |
| `purpose` | `String` | Purpose (`login`, `register`, `password_reset`). |
| `attempts` | `Number` | Max attempt counter (locks after 5). |
| `expiresAt` | `Date` | 10-minute TTL expiry timestamp. |

---

## 9. Notification Model (`models/Notification.js`)

Stores in-app candidate notifications.

| Field Name | Data Type | Description |
|---|---|---|
| `userId` | `ObjectId` | Reference to recipient `User`. |
| `title` | `String` | Alert title string. |
| `message` | `String` | Alert description text. |
| `type` | `String` | Enum: `['info', 'success', 'warning', 'action']`. |
| `read` | `Boolean` | Read status flag. |

---

## 10. AuditLog Model (`models/AuditLog.js`)

Stores user security event audit logs for compliance.

| Field Name | Data Type | Description |
|---|---|---|
| `userId` | `ObjectId` | Reference to `User` who performed action. |
| `action` | `String` | Security action string (e.g. `user_login`, `password_change`). |
| `ipAddress` | `String` | Client IP address. |
| `metadata` | `Object` | Arbitrary event details object. |

---

## ❓ Interview Questions & Answers

### Q1: Why use references (`ObjectId`) in Application and Resume models instead of embedding them directly?
**Answer**: Referencing `jobId` and `resumeId` via `ObjectId` prevents data duplication and inconsistency. If a job listing's salary or description updates in the `Job` collection, all linked applications immediately reflect the fresh data without requiring mass document updates. Mongoose `populate('jobId')` seamlessly joins documents during query execution.
