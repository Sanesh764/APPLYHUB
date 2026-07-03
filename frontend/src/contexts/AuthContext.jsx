import React, { createContext, useState, useEffect, useContext } from "react";
import api, { setAccessToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attempt to restore session on mount (Silent Refresh)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Trigger token refresh endpoint to check if httpOnly refresh cookie is valid
        const response = await api.post("/auth/refresh-token");
        const { accessToken } = response.data.data;
        setAccessToken(accessToken);

        // Fetch user profile
        const userResponse = await api.get("/auth/me");
        setUser(userResponse.data.data.user);
      } catch (err) {
        // Silent fail: User is not logged in or cookie expired
        setAccessToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for unauthorized events from Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken("");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  // Email Login
  const loginEmail = async (email, password) => {
    try {
      const response = await api.post("/auth/login/email", { email, password });
      
      // If 2FA required, return that information to the UI
      if (response.data.data.twoFactorRequired) {
        return response.data.data;
      }

      const { user, accessToken } = response.data.data;
      setAccessToken(accessToken);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      throw error.response?.data?.message || "Login failed";
    }
  };

  // Phone Signup
  const registerPhone = async (name, email, phone) => {
    try {
      const response = await api.post("/auth/signup/phone", { name, email, phone });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || "Registration failed";
    }
  };

  // Phone Login OTP trigger
  const sendPhoneOTP = async (phone) => {
    try {
      const response = await api.post("/auth/otp/send", { phone });
      return response.data.message;
    } catch (error) {
      throw error.response?.data?.message || "Failed to send OTP";
    }
  };

  // Verify Phone OTP (completes signup/login)
  const verifyPhoneOTP = async (phone, code) => {
    try {
      const response = await api.post("/auth/otp/verify", { phone, code });
      const { user, accessToken } = response.data.data;
      setAccessToken(accessToken);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      throw error.response?.data?.message || "Verification failed";
    }
  };

  // Email Signup
  const registerEmail = async (name, email, password) => {
    try {
      const response = await api.post("/auth/signup/email", { name, email, password });
      return response.data.message;
    } catch (error) {
      throw error.response?.data?.message || "Registration failed";
    }
  };

  // Verify Email Link (POST request triggered by verification page)
  const verifyEmail = async (email, token) => {
    try {
      const response = await api.post(`/auth/verify-email?email=${encodeURIComponent(email)}&token=${token}`);
      return response.data.message;
    } catch (error) {
      throw error.response?.data?.message || "Verification failed";
    }
  };

  // Logout current device
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout API call failed:", err);
    } finally {
      setAccessToken("");
      setUser(null);
    }
  };

  // Logout all devices
  const logoutAll = async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (err) {
      console.error("Logout all API call failed:", err);
    } finally {
      setAccessToken("");
      setUser(null);
    }
  };

  // Check active sessions
  const getSessions = async () => {
    try {
      const response = await api.get("/auth/sessions");
      return response.data.data.sessions;
    } catch (error) {
      throw error.response?.data?.message || "Failed to retrieve sessions";
    }
  };

  // Revoke device session
  const revokeSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      return true;
    } catch (error) {
      throw error.response?.data?.message || "Failed to revoke session";
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data.message;
    } catch (error) {
      throw error.response?.data?.message || "Password reset request failed";
    }
  };

  // Reset password
  const resetPassword = async (email, token, newPassword) => {
    try {
      const response = await api.post("/auth/reset-password", { email, token, newPassword });
      return response.data.message;
    } catch (error) {
      throw error.response?.data?.message || "Password reset failed";
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.post("/auth/change-password", { currentPassword, newPassword });
      // Change password revokes all tokens, so reset local state
      setUser(null);
      setAccessToken("");
      return response.data.message;
    } catch (error) {
      throw error.response?.data?.message || "Failed to change password";
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    loginEmail,
    registerEmail,
    registerPhone,
    sendPhoneOTP,
    verifyPhoneOTP,
    verifyEmail,
    logout,
    logoutAll,
    getSessions,
    revokeSession,
    forgotPassword,
    resetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
