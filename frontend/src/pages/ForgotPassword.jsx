import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { ShieldQuestion, ArrowLeft, ArrowRight } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email address is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const msg = await forgotPassword(email);
      setSuccess(msg || "If the email exists, a password reset link has been sent.");
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
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs md:text-sm text-slate-400 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 animate-pulse">
            <ShieldQuestion className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Forgot Password
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-2">
            No worries! Enter your email and we'll send you recovery steps.
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
              id="email"
              name="email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2" iconAfter={<ArrowRight className="h-4 w-4" />}>
              Send Reset Link
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
