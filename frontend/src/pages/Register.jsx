import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Mail, Phone, Sparkles, ArrowRight, Rocket, Wand2, Clock } from "lucide-react";

const Register = () => {
  const [method, setMethod] = useState("email"); // email | phone
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { registerEmail, registerPhone } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name) return "Name is required";
    if (!formData.email) return "Email is required";
    if (method === "email") {
      if (!formData.password) return "Password is required";
      if (formData.password.length < 8) return "Password must be at least 8 characters";
      if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    } else {
      if (!formData.phone) return "Phone number is required";
      if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
        return "Phone number must be in international E.164 format (e.g., +1234567890)";
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
    setSuccess("");

    try {
      if (method === "email") {
        const msg = await registerEmail(formData.name, formData.email, formData.password);
        setSuccess(msg || "Registration successful! Please check your email to verify your account.");
        setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
      } else {
        const data = await registerPhone(formData.name, formData.email, formData.phone);
        setSuccess("Registration initiated. Sending OTP to your phone...");
        // Redirect to OTP verification after a short delay
        setTimeout(() => {
          navigate("/verify-otp", { state: { phone: formData.phone } });
        }, 1500);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex bg-slate-950 overflow-hidden">
      {/* ===== Left Brand Panel (desktop only) ===== */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden p-12 xl:p-16">
        {/* Layered animated backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 animate-gradient" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-400/20 blur-[120px] animate-float" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-blue-400/20 blur-[120px] animate-float-slow" />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">ApplyHub</span>
        </div>

        {/* Headline + feature highlights */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight text-white">
            Start applying smarter today.
          </h2>
          <p className="mt-4 text-blue-100/80 text-base leading-relaxed">
            Join thousands using AI to organize their search, stand out, and land interviews sooner.
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {[
              { icon: Rocket, title: "Set up in minutes", desc: "Create your account and start tracking instantly." },
              { icon: Wand2, title: "AI-powered tools", desc: "Resume tailoring and cover letters, on demand." },
              { icon: Clock, title: "Save hours weekly", desc: "Automate the busywork of every application." },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <div className="mt-0.5 inline-flex items-center justify-center p-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-blue-100/70">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-blue-100/50 font-medium">
          © {new Date().getFullYear()} ApplyHub. Your career, organized.
        </p>
      </div>

      {/* ===== Right Form Panel ===== */}
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-6 lg:p-10 overflow-hidden">
        {/* Decorative Blur Blobs (mobile / general ambience) */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-blue-600/10 blur-[80px] md:blur-[120px] pointer-events-none lg:hidden"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-indigo-600/10 blur-[80px] md:blur-[120px] pointer-events-none lg:hidden"></div>

        <div className="w-full max-w-md z-10 animate-fade-up">
          {/* Title Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 lg:hidden">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white tracking-tight">
              Create an Account
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Get started with ApplyHub AI-powered job application system.
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
                setSuccess("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                method === "email"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email Signup
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("phone");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                method === "phone"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone Signup (OTP)
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs md:text-sm mb-6 font-medium animate-shake">
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
              id="name"
              name="name"
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleInputChange}
              required
            />

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

            {method === "phone" && (
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
              <>
                <Input
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2" iconAfter={<ArrowRight className="h-4 w-4" />}>
              {method === "email" ? "Create Account" : "Initiate Verification"}
            </Button>
          </form>

          {/* Social Signups (Optional / Placeholders for UI completeness) */}
          <div className="mt-8 flex flex-col gap-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <span className="relative bg-transparent px-4 text-xs text-slate-500 uppercase tracking-widest font-semibold">Or join with</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => alert("Google signup is configured for production. Please use Email/Phone for local developer preview.")}
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
                onClick={() => alert("GitHub signup is configured for production. Please use Email/Phone for local developer preview.")}
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
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-all duration-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
