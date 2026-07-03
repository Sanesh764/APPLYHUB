import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { User, ShieldAlert, Monitor, LogOut, KeyRound, CheckCircle, ShieldCheck } from "lucide-react";

const Profile = () => {
  const { user, logout, logoutAll, getSessions, revokeSession, changePassword } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      setSessionsError(err || "Failed to load sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const msg = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess(msg || "Password changed successfully! You will be logged out shortly.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      // Redirect to login occurs automatically since changePassword calls revokeAllUserSessions
    } catch (err) {
      setPasswordError(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      // Refresh session list
      fetchSessions();
    } catch (err) {
      alert("Failed to revoke session: " + err);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (window.confirm("Are you sure you want to log out of all devices? This will also log you out of your current session.")) {
      await logoutAll();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto z-10 relative">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400">
              Account Settings
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">
              Manage your personal identity, credentials, active devices, and session security.
            </p>
          </div>
          <Button variant="danger" onClick={logout} className="md:w-auto w-full" iconBefore={<LogOut className="h-4 w-4" />}>
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Info Card */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Card>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white border border-white/10 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                  <span className="inline-block mt-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {user?.role} Account
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/5 pt-6">
                <div>
                  <span className="text-xs text-slate-500 font-bold block mb-1">Email Address</span>
                  <div className="flex items-center justify-between bg-slate-950/60 border border-slate-900 rounded-xl px-4 py-3 text-sm">
                    <span className="text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">{user?.email}</span>
                    {user?.isEmailVerified ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" title="Verified" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-rose-400 flex-shrink-0" title="Unverified" />
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-bold block mb-1">Phone Number</span>
                  <div className="flex items-center justify-between bg-slate-950/60 border border-slate-900 rounded-xl px-4 py-3 text-sm">
                    <span className="text-slate-300">{user?.phone || "Not Configured"}</span>
                    {user?.phone && (
                      user?.isPhoneVerified ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" title="Verified" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-rose-400 flex-shrink-0" title="Unverified" />
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Column 2 & 3: Tabs / Action Panels */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Active Sessions Panel */}
            <Card>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <Monitor className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Active Device Sessions</h3>
                </div>
                <button
                  onClick={handleRevokeAllOthers}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-all duration-300 cursor-pointer"
                >
                  Log Out All Devices
                </button>
              </div>

              {sessionsLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
                </div>
              ) : sessionsError ? (
                <p className="text-sm text-rose-400">{sessionsError}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        sess.isCurrent
                          ? "bg-blue-600/5 border-blue-500/30"
                          : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${sess.isCurrent ? "bg-blue-600/10 text-blue-400" : "bg-slate-900 text-slate-400"}`}>
                          <Monitor className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-100">{sess.device}</span>
                            {sess.isCurrent && (
                              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Current Device
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            IP: {sess.ipAddress} • Active: {new Date(sess.lastActive).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 transition-all duration-300 rounded-lg hover:bg-rose-500/5 cursor-pointer"
                          title="Revoke Device Access"
                        >
                          <LogOut className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Change Password Panel */}
            <Card>
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-6">
                <KeyRound className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Change Password</h3>
              </div>

              {passwordError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs md:text-sm mb-6 font-medium">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-xs md:text-sm mb-6 font-medium">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="md:col-span-2"
                />

                <Input
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                />

                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                />

                <div className="md:col-span-2 flex justify-end mt-2">
                  <Button type="submit" variant="primary" loading={passwordLoading} className="w-full md:w-auto">
                    Change Password
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
