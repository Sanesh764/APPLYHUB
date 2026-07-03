import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { ShieldAlert, KeyRound, ArrowRight } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!email || !token) {
      setError("Invalid recovery link. Missing email or validation token.");
    }
  }, [email, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !token) {
      setError("Cannot submit. Missing verification context from link.");
      return;
    }

    if (!formData.password) {
      setError("New password is required.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const msg = await resetPassword(email, token, formData.password);
      setSuccess(msg || "Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 md:p-6 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-blue-600/10 blur-[80px] md:blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-indigo-600/10 blur-[80px] md:blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 animate-bounce">
            <KeyRound className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-2">
            Establish a strong, unique password for your account.
          </p>
        </div>

        <Card className="shadow-slate-900/50">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs md:text-sm mb-6 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-xs md:text-sm mb-6 font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              id="password"
              name="password"
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={!email || !token}
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              disabled={!email || !token}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
              disabled={!email || !token}
              iconAfter={<ArrowRight className="h-4 w-4" />}
            >
              Update Password
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6 text-xs md:text-sm text-slate-500 font-medium">
          Remembered your password?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-all duration-300">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
