# Frontend Architecture & Implementation

This document details the frontend implementation of **ApplyHub**, built using **React 19**, **Vite 8**, **TailwindCSS 4**, and **TanStack React Query v5**.

---

## 🎨 Overview

The frontend is a fast, responsive Single Page Application (SPA). It communicates with the backend REST API via a configured Axios instance (`src/services/api.js`) that supports automatic HttpOnly cookie credentials and response error interceptors.

---

## 🏛 Application Shell & Layout Structure

The main application component (`src/App.jsx`) defines the router configuration, client-side route guards, and page layouts.

```javascript
// App.jsx layout wrapper snippet
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-10">
        {/* Navigation header */}
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};
```

---

## 📄 Key Pages & Views

| Page Component | Path | Description | Key Features |
|---|---|---|---|
| **Login** | `/login` | User login view. | Supports email/password & phone number OTP sign-in modes. |
| **Register** | `/register` | Account signup view. | Account creation with form validation & password strength bar. |
| **VerifyOTP** | `/verify-otp` | Phone OTP input view. | Enter 6-digit verification code. |
| **Onboarding** | `/onboarding` | User preferences form. | Collects preferred role, experience level, expected salary, and work mode. |
| **Dashboard** | `/` | Candidate Overview. | Activity metrics, weekly application charts (`Recharts`), recommended matches, in-app alerts. |
| **JobSearch** | `/jobs` | Job Discovery. | Filterable job search list (keywords, location, work mode, salary) with AI match scores. |
| **JobDetails** | `/jobs/:jobId` | Job Details Page. | Complete job description, company details, internship stats, AI match report, preparation roadmap. |
| **Resumes** | `/resumes` | ATS Resume Hub. | Upload PDF/DOCX, active version selection, ATS score gauge, version history table. |
| **Tracker** | `/tracker` | Application Pipeline. | Kanban board with 6 status columns (`saved`, `applied`, `pending`, `interview`, `offer`, `rejected`). |
| **Profile** | `/profile` | Account Settings. | Identity details, preferences, active sessions device list. |
| **AdminDashboard** | `/admin` | Administrator Console. | System health status, provider health metrics, user role management, system logs. |

---

## 🔒 Route Guards (`src/components/`)

- **`ProtectedRoute.jsx`**: Checks if the user is authenticated via `AuthContext`. If unauthenticated, redirects to `/login` saving the attempted location in navigation state.
- **`AdminRoute.jsx`**: Checks if the authenticated user has the `admin` role. If not, redirects to `/`.

---

## ⚙️ State Management & Data Fetching

1. **Authentication Context (`AuthContext.jsx`)**: Manages current user state, login, signup, OTP submission, and signout handlers.
2. **TanStack React Query (`queryClient`)**: Configured globally in `App.jsx` to cache server data, handle refetches, and manage asynchronous query states.
3. **Axios API Interceptor (`api.js`)**:
   - `withCredentials: true` ensures cookies are sent with requests.
   - Response interceptor automatically handles 401 Unauthorized errors by calling `/auth/refresh-token` or clearing auth state.

---

## ❓ Interview Questions & Answers

### Q1: How does React Router handles protected route redirection in ApplyHub?
**Answer**: `ProtectedRoute` checks the `user` object from `useAuth()`. If `loading` is true, it renders a loading spinner. If `user` is null, it renders `<Navigate to="/login" state={{ from: location }} replace />`. This ensures unauthenticated users are booted to login, while retaining their intended destination URL so they can be redirected back after successful sign-in.
