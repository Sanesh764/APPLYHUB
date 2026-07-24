# Deployment & Production Setup Guide

This document provides step-by-step instructions for deploying **ApplyHub** to production cloud environments.

---

## 🏗 Deployment Architecture

```
                                 ┌─────────────────────────┐
                                 │     AWS Amplify /       │
                                 │    Vercel / Netlify     │
                                 │  (React 19 Frontend SPA)│
                                 └────────────┬────────────┘
                                              │ HTTPS REST
                                              ▼
┌──────────────────────────┐     ┌─────────────────────────┐
│     Cloudinary Media     │◄────┤  Render / AWS EC2 /     │
│   (Resume File Storage)  │     │  Node.js Express Backend│
└──────────────────────────┘     └────────────┬────────────┘
                                              │ Mongoose
                                              ▼
                                 ┌─────────────────────────┐
                                 │  MongoDB Atlas Cluster  │
                                 │   (Cloud Database)      │
                                 └─────────────────────────┘
```

---

## ⚡ 1. Backend Deployment (Render / Railway / AWS EC2)

### Build Settings
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Node Version**: `20.x`

### Production Environment Setup
Set the following environment variables in your hosting provider's dashboard:

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/applyhub?retryWrites=true&w=majority
FRONTEND_URL=https://main.ddzv29gajckkr.amplifyapp.com
JWT_ACCESS_SECRET=complex_production_access_secret_987!
JWT_REFRESH_SECRET=complex_production_refresh_secret_654!
JWT_ACCESS_EXPIRY=25m
JWT_REFRESH_EXPIRY=7d

# AI Providers
NVIDIA_API_KEY=nvapi-...
GEMINI_API_KEY=AIzaSy...

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=your_secret

# SMTP Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key
SMTP_FROM=noreply@applyhub.com
```

---

## 🌐 2. Frontend Deployment (AWS Amplify / Vercel)

### Build Settings
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: `20.x`

### Amplify Build Specification (`amplify.yml`)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

---

## 🗄 3. Database Setup (MongoDB Atlas)

1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, add IP whitelist rules for your backend hosting server (or `0.0.0.0/0` with strong password authentication).
3. Under **Database Access**, create a user with `readWrite` permissions on `applyhub`.
4. Copy the connection string into `MONGODB_URI`.

---

## 🛡 Production Checklist

- [x] Set `NODE_ENV=production` in backend configuration.
- [x] Configure strong, unique strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- [x] Verify CORS origin allows only your production frontend domain.
- [x] Ensure MongoDB Atlas IP whitelist covers production backend IPs.
- [x] Enable Cloudinary credentials to avoid storing production files on local server disk.

---

## ❓ Interview Questions & Answers

### Q1: How does ApplyHub handle SPA routing during frontend deployment on AWS Amplify / Vercel?
**Answer**: Single Page Applications rely on client-side routing (`react-router-dom`). When a user refreshes `/jobs/123`, the web server attempts to find a file at `/jobs/123/index.html`. To prevent 404 errors, rewrites/redirect rules are configured on the hosting platform (e.g. Amplify redirect rule `</*> -> /index.html 200`), serving `index.html` for all subpaths so React Router handles routing natively.
