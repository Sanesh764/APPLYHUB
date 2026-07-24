# Environment Variables Reference

This document details every environment variable used in **ApplyHub**, explaining its purpose, default value, and fallback behavior.

---

## 🔑 Backend Environment Variables (`backend/.env`)

| Variable Name | Required? | Default Value | Description |
|---|---|---|---|
| `PORT` | Optional | `8080` | Port on which the Express server listens. |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development`, `production`, `test`). |
| `MONGODB_URI` | **Required** | `mongodb://localhost:27017/applyhub` | MongoDB connection string (local or Atlas URL). |
| `FRONTEND_URL` | Optional | `http://localhost:5173` | Frontend URL for CORS origins and cookie domain scoping. |
| `JWT_ACCESS_SECRET` | **Required** | - | Secret key used to sign Access JWT tokens. |
| `JWT_REFRESH_SECRET` | **Required** | - | Secret key used to sign Refresh JWT tokens. |
| `JWT_ACCESS_EXPIRY` | Optional | `25m` | Expiration time for Access Tokens. |
| `JWT_REFRESH_EXPIRY` | Optional | `7d` | Expiration time for Refresh Tokens. |

---

## 🤖 AI Provider Configuration

ApplyHub uses a multi-provider fallback strategy (`NVIDIA` -> `DeepSeek` -> `Gemini` -> `OpenAI`).

| Variable Name | Required? | Default Value | Description |
|---|---|---|---|
| `AI_PROVIDER` | Optional | `nvidia` | Preferred primary AI provider (`nvidia`, `deepseek`, `gemini`, `openai`). |
| `NVIDIA_API_KEY` | Optional | - | API Key for NVIDIA NIM LLM endpoints. |
| `NVIDIA_MODEL` | Optional | `meta/llama-3.1-8b-instruct` | NVIDIA model identifier. |
| `DEEPSEEK_API_KEY` | Optional | - | API Key for DeepSeek API. |
| `DEEPSEEK_MODEL` | Optional | `deepseek-chat` | DeepSeek model identifier. |
| `GEMINI_API_KEY` | Optional | - | API Key for Google Gemini 1.5 Flash via `@google/generative-ai`. |
| `OPENAI_API_KEY` | Optional | - | API Key for OpenAI (`gpt-4o-mini`). |

> 💡 **Note**: If all AI keys are unconfigured or fail, ApplyHub seamlessly falls back to mock data generators to ensure uninterrupted application preview.

---

## ☁️ Cloud Storage (Cloudinary)

| Variable Name | Required? | Default Value | Description |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Optional | - | Cloudinary cloud account name. |
| `CLOUDINARY_API_KEY` | Optional | - | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET` | Optional | - | Cloudinary API Secret. |

> ℹ️ **Fallback**: If Cloudinary keys are missing, resumes are stored locally on disk under `backend/public/uploads/`.

---

## 📧 Email Configuration (SMTP)

| Variable Name | Required? | Default Value | Description |
|---|---|---|---|
| `SMTP_HOST` | Optional | `smtp.gmail.com` | SMTP host server. |
| `SMTP_PORT` | Optional | `587` | SMTP server port. |
| `SMTP_USER` | Optional | - | Sender email address. |
| `SMTP_PASS` | Optional | - | Sender app password or auth credential. |
| `SMTP_FROM` | Optional | - | Display email sender address. |

> ℹ️ **Fallback**: If SMTP keys are missing, transactional emails (verification, alerts, cover letters) are logged to Winston console.

---

## 💼 External Job Aggregator Providers

| Variable Name | Required? | Default Value | Description |
|---|---|---|---|
| `ADZUNA_APP_ID` | Optional | - | Adzuna developer API App ID. |
| `ADZUNA_APP_KEY` | Optional | - | Adzuna developer API Key. |
| `ADZUNA_COUNTRIES` | Optional | `in,us,gb` | ISO-2 country codes for Adzuna searches. |
| `GREENHOUSE_BOARDS` | Optional | `stripe,figma,gitlab,coinbase,dropbox` | Comma-separated Greenhouse company tokens. |
| `LEVER_BOARDS` | Optional | `netflix,spotify,leadiq,plaid` | Comma-separated Lever company handles. |
| `SMARTRECRUITERS_COMPANIES` | Optional | `Visa,Bosch,Ubisoft` | Comma-separated SmartRecruiters company handles. |
| `ASHBY_BOARDS` | Optional | `Ramp,Linear,Notion` | Comma-separated Ashby board handles. |
| `RECRUITEE_COMPANIES` | Optional | `recruitee,piktochart` | Comma-separated Recruitee handles. |

---

## ❓ Interview Questions & Answers

### Q1: Why are JWT secrets split into `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`?
**Answer**: Splitting access and refresh token secrets enforces security isolation. Access tokens are short-lived (25m) and signed with `JWT_ACCESS_SECRET`. Refresh tokens are long-lived (7d) and signed with `JWT_REFRESH_SECRET`. If an access token secret is compromised, an attacker cannot generate valid refresh tokens, limiting blast radius.
