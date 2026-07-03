import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Resumes from "./pages/Resumes";
import JobSearch from "./pages/JobSearch";
import Tracker from "./pages/Tracker";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

import { Sparkles, Shield, User as UserIcon, LogOut, LayoutDashboard, Briefcase, FileText, CheckSquare } from "lucide-react";

// Initialize Query Client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// A premium navigation layout wrapper for protected routes
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-extrabold text-lg tracking-wider">
            <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            ApplyHub <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/10 font-bold font-mono">V1</span>
          </Link>

          {/* Nav Items */}
          <nav className="flex items-center gap-4 md:gap-6">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all duration-300"
            >
              <LayoutDashboard className="h-4 w-4 text-slate-400" />
              Dashboard
            </Link>

            <Link
              to="/jobs"
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all duration-300"
            >
              <Briefcase className="h-4 w-4 text-slate-400" />
              Search Jobs
            </Link>

            <Link
              to="/tracker"
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all duration-300"
            >
              <CheckSquare className="h-4 w-4 text-slate-400" />
              Tracker
            </Link>

            <Link
              to="/resumes"
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all duration-300"
            >
              <FileText className="h-4 w-4 text-slate-400" />
              Resumes
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all duration-300"
            >
              <UserIcon className="h-4 w-4 text-slate-400" />
              Profile
            </Link>

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-purple-400 hover:text-purple-300 transition-all duration-300"
              >
                <Shield className="h-4 w-4 text-purple-400" />
                Admin Panel
              </Link>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-400 hover:text-rose-400 transition-all duration-300 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Onboarding (Protected but outside dashboard layout) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Protected Pages */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Resumes />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <JobSearch />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Tracker />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </AdminRoute>
        }
      />

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
