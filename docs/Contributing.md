# Contributing Guidelines

Thank you for your interest in contributing to **ApplyHub**! This document provides guidelines and workflows for submitting bug reports, feature requests, and pull requests.

---

## 🛠 Local Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/Sanesh764/APPLYHUB.git
   cd ApplyHub
   ```

2. Install dependencies for both backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Ensure code quality and syntax checks pass:
   ```bash
   # Backend Syntax Verification
   cd backend
   node -c app.js server.js services/*.js controllers/*.js
   
   # Frontend Linting & Production Build Check
   cd ../frontend
   npm run lint
   npm run build
   ```

---

## 🌿 Git Branching & Commit Conventions

Create feature branches off `main`:

```bash
git checkout -b feature/add-new-job-provider
```

### Commit Message Format
Follow conventional commits syntax:
- `feat: add LinkedIn public scraper provider`
- `fix: resolve JWT cookie expiration calculation bug`
- `docs: update API documentation for job details endpoint`
- `refactor: optimize Jaccard deduplication loop`

---

## 🔄 Pull Request (PR) Checklist

Before submitting a Pull Request, ensure:
1. Your code follows existing code styles and design patterns.
2. All modified backend JavaScript files pass syntax checks (`node -c`).
3. Frontend builds cleanly with zero bundler errors (`npm run build`).
4. Documentation in `docs/` is updated if new APIs or features were introduced.
