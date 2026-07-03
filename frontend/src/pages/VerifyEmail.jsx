import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    const performVerification = async () => {
      if (!email || !token) {
        setStatus("error");
        setMessage("Invalid verification link. Missing email or token.");
        return;
      }

      try {
        const msg = await verifyEmail(email, token);
        setStatus("success");
        setMessage(msg || "Email verified successfully!");
      } catch (error) {
        setStatus("error");
        setMessage(error || "Verification failed. The link may have expired.");
      }
    };

    performVerification();
  }, [email, token, verifyEmail]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 md:p-6 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-blue-600/10 blur-[80px] md:blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-indigo-600/10 blur-[80px] md:blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <Card className="text-center shadow-slate-900/50">
          {status === "verifying" && (
            <div className="flex flex-col items-center gap-6 py-6">
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Verifying Email</h1>
                <p className="text-slate-400 text-sm mt-2">
                  Please wait while we confirm your email verification link...
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-16 w-16" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
                <p className="text-slate-400 text-sm mt-2">{message}</p>
              </div>
              <Link to="/login" className="w-full mt-2">
                <Button variant="primary" className="w-full">
                  Proceed to Login
                </Button>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="inline-flex p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="h-16 w-16" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
                <p className="text-slate-400 text-sm mt-2">{message}</p>
              </div>
              <div className="w-full flex flex-col gap-3 mt-2">
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
