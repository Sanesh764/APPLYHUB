# Installation & Local Setup Guide

This document provides step-by-step instructions to clone, configure, install, and run **ApplyHub** on your local development machine.

---

## 📋 System Prerequisites

Before installing ApplyHub, ensure you have the following installed on your operating system:

- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x LTS`)
- **npm**: `v9.0.0` or higher
- **MongoDB**: A running local MongoDB instance (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URL.
- **Git**: Installed for repository cloning.

---

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Sanesh764/APPLYHUB.git
cd ApplyHub
```

---

### Step 2: Backend Setup & Installation

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the provided template:
   ```bash
   cp .env.Example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   PORT=8080
   MONGODB_URI=mongodb://localhost:27017/applyhub
   JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_123!
   JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_456!
   JWT_ACCESS_EXPIRY=25m
   JWT_REFRESH_EXPIRY=7d
   FRONTEND_URL=http://localhost:5173
   
   # Optional: Configure AI provider (Gemini recommended for free tier)
   GEMINI_API_KEY=your_gemini_api_key_here
   AI_PROVIDER=gemini
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:8080` and connect to MongoDB.*

---

### Step 3: Frontend Setup & Installation

1. Open a new terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Vite will launch the single page app at `http://localhost:5173`.*

---

## 🧪 Verification & Health Checks

Once both servers are running, verify your installation:

1. **Backend Health Check**:
   Open `http://localhost:8080/health` in your browser. Expected response:
   ```json
   {
     "status": "UP",
     "timestamp": "2026-07-24T12:00:00.000Z"
   }
   ```

2. **Provider Health Check**:
   Send an authenticated request to `http://localhost:8080/api/v1/jobs/providers/health` to see active job scrapers.

3. **Frontend Application**:
   Open `http://localhost:5173` in your browser to view the login/registration screen.

---

## 🛠 Common Troubleshooting

### 1. MongoDB Connection Failed (`MongooseServerSelectionError`)
- Ensure your local MongoDB service is running (`mongod` or via Windows Services / systemd).
- Verify the connection string in `backend/.env`.

### 2. CORS Error (`CORS Policy Violation`)
- Verify that `FRONTEND_URL` in `backend/.env` matches `http://localhost:5173`.

### 3. File Upload Issues
- If Cloudinary keys are not provided, uploaded resumes are saved to `backend/public/uploads/`. Ensure the directory has write permissions.

---

## ❓ Interview Questions & Answers

### Q1: How does ApplyHub handle environment configuration fallback for optional services?
**Answer**: ApplyHub uses defensive initialization. For instance, if Cloudinary credentials are missing from `.env`, `storage.service.js` automatically switches to local disk storage in `backend/public/uploads/`. Similarly, if SMTP credentials are missing, `email.service.js` routes transaction emails directly to Winston console logger.
