import React, { useState, useEffect } from "react";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Users, Shield, Clock, ShieldAlert, CheckCircle2, XCircle, Search, RefreshCw } from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users"); // users | logs
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [usersSearch, setUsersSearch] = useState("");
  const [logsSearch, setLogsSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const usersResponse = await api.get("/auth/admin/users");
      setUsers(usersResponse.data.data.users);

      const logsResponse = await api.get("/auth/admin/audit-logs?limit=50");
      setLogs(logsResponse.data.data.logs);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter((u) => {
    const term = usersSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term)) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const filteredLogs = logs.filter((l) => {
    const term = logsSearch.toLowerCase();
    return (
      l.event.toLowerCase().includes(term) ||
      l.status.toLowerCase().includes(term) ||
      (l.identifier && l.identifier.toLowerCase().includes(term)) ||
      l.ipAddress.includes(term) ||
      l.device.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative overflow-hidden">
      {/* Glow Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400">
              Admin Control Center
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">
              System monitoring, audit logs, security history, and user role management.
            </p>
          </div>
          <Button variant="secondary" onClick={fetchData} className="w-full md:w-auto" iconBefore={<RefreshCw className="h-4 w-4" />}>
            Refresh Console
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="flex items-center gap-5 p-6">
            <div className="p-4 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Total Users</span>
              <span className="text-2xl font-black mt-1 block">{users.length}</span>
            </div>
          </Card>

          <Card className="flex items-center gap-5 p-6">
            <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Admin Staff</span>
              <span className="text-2xl font-black mt-1 block">
                {users.filter((u) => u.role === "admin").length}
              </span>
            </div>
          </Card>

          <Card className="flex items-center gap-5 p-6">
            <div className="p-4 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Recent Audits</span>
              <span className="text-2xl font-black mt-1 block">{logs.length}</span>
            </div>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 mb-8">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-bold text-sm md:text-base transition-all duration-300 cursor-pointer ${
              activeTab === "users"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            Users Inventory
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-bold text-sm md:text-base transition-all duration-300 cursor-pointer ${
              activeTab === "logs"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-4.5 w-4.5" />
            Security Audit Logs
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="text-slate-500 text-sm animate-pulse">Loading console records...</p>
          </div>
        ) : activeTab === "users" ? (
          <div>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search users by name, email, phone or role..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
              />
            </div>

            {/* Users Inventory Table */}
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/40 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <th className="py-4.5 px-6">Name</th>
                      <th className="py-4.5 px-6">Email Address</th>
                      <th className="py-4.5 px-6">Phone Number</th>
                      <th className="py-4.5 px-6">Account Role</th>
                      <th className="py-4.5 px-6">Verifications</th>
                      <th className="py-4.5 px-6">Date Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500">
                          No users matched your query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-white/[0.01] transition-all duration-200">
                          <td className="py-4 px-6 text-white font-bold">{user.name}</td>
                          <td className="py-4 px-6">{user.email}</td>
                          <td className="py-4 px-6">{user.phone || "—"}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                user.role === "admin"
                                  ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                  : "bg-slate-800/80 border-slate-700 text-slate-400"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  user.isEmailVerified
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                }`}
                              >
                                Email
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  user.isPhoneVerified
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                }`}
                              >
                                Phone
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-500 text-xs">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <div>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search audit events by keyword, IP, device, status..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
              />
            </div>

            {/* Audit Logs Table */}
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/40 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <th className="py-4.5 px-6">Timestamp</th>
                      <th className="py-4.5 px-6">Event Name</th>
                      <th className="py-4.5 px-6">Target User/ID</th>
                      <th className="py-4.5 px-6">Status</th>
                      <th className="py-4.5 px-6">IP Address</th>
                      <th className="py-4.5 px-6">Client Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300 font-medium">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500">
                          No audit entries found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-white/[0.01] transition-all duration-200">
                          <td className="py-4 px-6 text-xs text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-white font-semibold">
                            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-xs font-mono">
                              {log.event.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-400 text-xs truncate max-w-[150px]" title={log.identifier}>
                            {log.userId?.email || log.identifier || "System"}
                          </td>
                          <td className="py-4 px-6">
                            <span className="flex items-center gap-1.5 text-xs">
                              {log.status === "success" ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">Success</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-rose-400" />
                                  <span className="text-rose-400 font-semibold">Failed</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs font-mono text-slate-400">{log.ipAddress}</td>
                          <td className="py-4 px-6 text-xs text-slate-500 truncate max-w-[200px]" title={log.device}>
                            {log.device}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
