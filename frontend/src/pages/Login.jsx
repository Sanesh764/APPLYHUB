import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Mail, Phone, Lock, Sparkles, ArrowRight } from "lucide-react";

const Login = () => {
  const [method, setMethod] = useState("email"); // email | phone
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loginEmail, sendPhoneOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route to redirect to after login
  const from = location.state?.from?.pathname || "/";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (method === "email") {
      if (!formData.email) return "Email is required";
      if (!/\S+@\S+\.\S+/.test(formData.email)) return "Provide a valid email address";
      if (!formData.password) return "Password is required";
    } else {
      if (!formData.phone) return "Phone number is required";
      if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
        return "Phone number must be in international E.164 format (e.g. +1234567890)";
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (method === "email") {
        const result = await loginEmail(formData.email, formData.password);
        if (result.twoFactorRequired) {
          // Future expansion: redirect to 2FA page
          alert("2FA is required for this account (feature coming soon).");
        } else {
          // Success, navigate to dashboard
          navigate(from, { replace: true });
        }
      } else {
        // Send OTP and navigate to verification screen
        await sendPhoneOTP(formData.phone);
        navigate("/verify-otp", { state: { phone: formData.phone, from } });
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 md:p-6 overflow-hidden">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-blue-600/10 blur-[80px] md:blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-indigo-600/10 blur-[80px] md:blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg z-10">
        {/* Title Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 animate-bounce">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Secure login to your ApplyHub dashboard and tracking workspace.
          </p>
        </div>

        <Card className="shadow-slate-900/50">
          {/* Method Selector Tabs */}
          <div className="flex bg-slate-950/80 rounded-xl p-1 border border-slate-900 mb-6">
            <button
              type="button"
              onClick={() => {
                setMethod("email");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                method === "email"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("phone");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                method === "phone"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone Sign In (OTP)
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs md:text-sm mb-6 font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {method === "email" ? (
              <>
                <Input
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="text-xs md:text-sm font-semibold text-slate-300 tracking-wide">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-all duration-300">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            ) : (
              <Input
                id="phone"
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            )}

            {method === "email" && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4.5 w-4.5 rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-slate-950 accent-blue-600"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs md:text-sm text-slate-400 font-medium cursor-pointer select-none">
                  Remember my session
                </label>
              </div>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2" iconAfter={<ArrowRight className="h-4 w-4" />}>
              {method === "email" ? "Sign In" : "Request OTP Code"}
            </Button>
          </form>

          {/* Social Logins */}
          <div className="mt-8 flex flex-col gap-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <span className="relative bg-transparent px-4 text-xs text-slate-500 uppercase tracking-widest font-semibold">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => alert("Google login is configured for production. Please use Email/Phone for local developer preview.")}
                className="flex items-center justify-center gap-3 py-3 border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 font-medium text-xs md:text-sm cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => alert("GitHub login is configured for production. Please use Email/Phone for local developer preview.")}
                className="flex items-center justify-center gap-3 py-3 border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 font-medium text-xs md:text-sm cursor-pointer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </Card>

        <div className="text-center mt-6 text-xs md:text-sm text-slate-500 font-medium">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-all duration-300">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
