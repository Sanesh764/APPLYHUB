# Role-Based Authorization (RBAC) Documentation

This document describes the role-based authorization system implemented in **ApplyHub**.

---

## 👥 User Roles

ApplyHub defines two primary user roles in `User.js`:

1. **`user` (Standard Candidate)**:
   - Default role assigned upon registration.
   - Access to Job Search, ATS Resume Uploads, Application Pipeline Tracker, Personal Profile, and AI Cover Letter generation.
2. **`admin` (Administrator)**:
   - Elevated privilege role.
   - Access to all standard user features PLUS System Diagnostics (`/system/health`), System Performance Metrics (`/system/metrics`), User Management (`/system/users`), Audit Logs, and User Role Mutation.

---

## 🔒 Server-Side Authorization Middleware (`backend/middleware/auth.js`)

Server-side route authorization is handled by combining two middleware functions:
1. `protect`: Verifies JWT authentication and attaches `req.user`.
2. `authorize(...roles)`: Checks if `req.user.role` matches the required role.

### Middleware Code Snippet
```javascript
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required.");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `User role '${req.user.role}' is not authorized to access this resource.`
      );
    }
    next();
  };
};
```

---

## 🛡 API Route Protection Examples

### Standard Protected Route (`backend/routes/resume.routes.js`)
```javascript
// Requires any authenticated user (user or admin)
router.use(protect);
router.post("/upload", upload.single("resume"), resumeController.uploadResume);
```

### Admin-Only Protected Route (`backend/routes/system.routes.js`)
```javascript
// Requires authenticated user AND admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/health", systemController.getSystemHealth);
router.get("/users", systemController.getUsers);
router.patch("/users/:userId/role", systemController.updateUserRole);
```

---

## 🎨 Client-Side Route Protection (`frontend/src/components/`)

### 1. `ProtectedRoute.jsx`
Guards candidate routes (Dashboard, Search, Tracker, Resumes, Profile).

```jsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
};
```

### 2. `AdminRoute.jsx`
Guards administrative routes (`/admin`).

```jsx
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children;
};
```

---

## ❓ Interview Questions & Answers

### Q1: What is the difference between Authentication and Authorization in ApplyHub?
**Answer**: **Authentication** (`protect` middleware) answers "Who are you?" by verifying the user's JWT token or session credentials. **Authorization** (`authorize` middleware) answers "What are you allowed to do?" by inspecting `req.user.role` (e.g., verifying if the candidate has the `admin` role before granting access to `/api/v1/system/users`).

### Q2: Why is client-side route guarding alone insufficient for security?
**Answer**: Client-side route guards (`AdminRoute.jsx`) only control what views are rendered in the browser DOM. Since client-side code can be inspected or bypassed by a user, every administrative or sensitive backend API endpoint MUST enforce server-side authorization middleware (`authorize("admin")`) to prevent unauthorized API requests.
