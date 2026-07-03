import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { ShieldCheck, MessageSquare, ArrowLeft, RotateCw } from "lucide-react";

const VerifyOTP = () => {
  const [code, setCode] = useState(new Array(6).fill(""));
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyPhoneOTP, sendPhoneOTP } = useAuth();

  const phone = location.state?.phone;
  const redirectPath = location.state?.from || "/";

  // Redirect to login if phone is missing in state
  useEffect(() => {
    if (!phone) {
      navigate("/login", { replace: true });
    }
  }, [phone, navigate]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (element, index) => {
    const value = element.value;
    if (isNaN(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Move focus to next input if filled
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      setError("");

      // Move focus to previous input on backspace
      if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const newCode = pasteData.split("");
    setCode(newCode);
    inputRefs.current[5].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = code.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyPhoneOTP(phone, otpString);
      setSuccess("OTP verified! Redirecting...");
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError("");
    setSuccess("");

    try {
      await sendPhoneOTP(phone);
      setSuccess("A new OTP has been sent to your phone.");
      setCooldown(60);
      setCode(new Array(6).fill(""));
      inputRefs.current[0].focus();
    } catch (err) {
      setError(err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 md:p-6 overflow-hidden">
      {/* Background Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-blue-600/10 blur-[80px] md:blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-indigo-600/10 blur-[80px] md:blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg z-10">
        <div className="mb-6">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 text-xs md:text-sm text-slate-400 hover:text-white transition-all duration-300 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 animate-pulse">
            <ShieldCheck className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Security Verification
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-2">
            We sent a 6-digit OTP code to <strong className="text-slate-200">{phone}</strong>.
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* 6 digits input boxes */}
            <div className="flex justify-between gap-2 md:gap-4">
              {code.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="w-12 h-12 md:w-14 md:h-14 text-center rounded-xl bg-slate-900 border border-slate-800 text-lg md:text-xl font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                />
              ))}
            </div>

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
              Verify Code
            </Button>
          </form>

          <div className="flex justify-between items-center mt-6">
            <span className="text-xs md:text-sm text-slate-500 font-medium">
              Didn't receive code?
            </span>
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className={`inline-flex items-center gap-1.5 text-xs md:text-sm font-bold transition-all duration-300 cursor-pointer ${
                cooldown > 0 || resending
                  ? "text-slate-600 cursor-not-allowed"
                  : "text-blue-400 hover:text-blue-300"
              }`}
            >
              <RotateCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
              Resend OTP {cooldown > 0 ? `(${cooldown}s)` : ""}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;
