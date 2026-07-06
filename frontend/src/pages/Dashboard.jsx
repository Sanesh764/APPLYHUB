import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Sparkles, FileText, CheckSquare, Users, Gift, Radio, Send, Bell, Settings, Target, ArrowRight, Loader2 } from "lucide-react";

const COLORS = ["#6366f1", "#2563eb", "#f59e0b", "#a855f7", "#10b981", "#ef4444"];

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingAutomation, setTogglingAutomation] = useState(false);

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch Profile onboarding status
      const profileRes = await api.get("/profile");
      const profileData = profileRes.data.data.profile;
      
      // If profile doesn't exist, redirect to onboarding wizard!
      if (!profileData || !profileData.isCompleted) {
        navigate("/onboarding");
        return;
      }
      setProfile(profileData);

      // 2. Fetch Analytics
      const analyticsRes = await api.get("/applications/analytics");
      setAnalytics(analyticsRes.data.data);

      // 3. Fetch recommended jobs (matches calculated dynamically on the active resume)
      const jobsRes = await api.get("/jobs");
      const jobList = jobsRes.data.data.jobs;
      setRecommendations(jobList.slice(0, 3)); // show top 3 recommendations

      // 4. Fetch in-app notifications
      const notifRes = await api.get("/notifications");
      setNotifications(notifRes.data.data.notifications.slice(0, 4)); // show top 4 notifications
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleAutomation = async () => {
    if (!profile) return;
    setTogglingAutomation(true);
    try {
      const updatedVal = !profile.isAutomationEnabled;
      const res = await api.post("/profile", {
        ...profile,
        isAutomationEnabled: updatedVal,
      });
      setProfile(res.data.data.profile);
      
      // Add a local notification trace
      fetchDashboardData();
    } catch (err) {
      alert("Failed to toggle automation settings.");
    } finally {
      setTogglingAutomation(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.post("/notifications/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-white min-h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-slate-500 text-sm animate-pulse">Assembling SaaS Workspace...</p>
      </div>
    );
  }

  // Formatting data for Recharts Pie chart
  const pieData = analytics
    ? [
        { name: "Saved", value: analytics.counts.saved },
        { name: "Applied", value: analytics.counts.applied },
        { name: "Pending", value: analytics.counts.pending },
        { name: "Interview", value: analytics.counts.interview },
        { name: "Offer", value: analytics.counts.offer },
        { name: "Rejected", value: analytics.counts.rejected },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative overflow-hidden flex flex-col">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 flex-1 flex flex-col gap-8">
        {/* Banner header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400">
              Welcome, {profile?.preferredRole ? `Job Seeker` : "User"}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Your AI career companion pipeline overview for today.
            </p>
          </div>

          {/* Automation Control Box */}
          <Card className="p-4 py-3 flex items-center gap-4 border-blue-500/20 bg-blue-600/5 max-w-sm md:w-auto w-full">
            <Radio className={`h-5 w-5 ${profile?.isAutomationEnabled ? "text-emerald-400 animate-pulse" : "text-slate-600"}`} />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Daily AI Auto-Discovery</span>
              <span className="text-xs font-semibold text-slate-300">
                {profile?.isAutomationEnabled ? "Active (Midnight scans)" : "Inactive"}
              </span>
            </div>
            <button
              onClick={handleToggleAutomation}
              disabled={togglingAutomation}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                profile?.isAutomationEnabled
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {profile?.isAutomationEnabled ? "Disable" : "Enable"}
            </button>
          </Card>
        </div>

        {/* Analytics Counter Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ATS Score</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-black text-blue-400">{analytics?.atsScore || 0}</span>
              <span className="text-xs text-slate-500 font-medium">/100</span>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Apps</span>
            <span className="text-3xl font-black text-indigo-400 mt-4">{analytics?.totalApplications || 0}</span>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Interviews</span>
            <span className="text-3xl font-black text-purple-400 mt-4">{analytics?.counts.interview || 0}</span>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Offers</span>
            <span className="text-3xl font-black text-emerald-400 mt-4">{analytics?.counts.offer || 0}</span>
          </Card>

          <Card className="p-5 flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Response Rate</span>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-3xl font-black text-white">{analytics?.responseRate || 0}%</span>
              <span className="text-xs text-slate-500 font-medium">rate</span>
            </div>
          </Card>
        </div>

        {/* Charts & Notifications split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Bar Chart (2 Columns width on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Weekly Application Activity</h3>
                <span className="text-xs text-slate-500 font-medium">Last 7 Days</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.weeklyTimeline || []}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }} />
                    <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Pie Chart / Distribution (1 Column width on lg) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pipeline Share</h3>
                <span className="text-xs text-slate-500 font-medium">Status Split</span>
              </div>
              <div className="h-64 w-full flex items-center justify-center">
                {pieData.length === 0 ? (
                  <div className="text-xs text-slate-600 font-bold">No active pipeline segments.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Recommended jobs & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          {/* Recommended Jobs: 7 columns */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-white/5 p-6 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Top Recommended Matches</h3>
                <Link to="/jobs" className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                  Explore Job Search <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-white/5">
                {recommendations.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-600">
                    No recommendations found. Please upload resume first.
                  </div>
                ) : (
                  recommendations.map((job) => (
                    <div key={job.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <img
                          src={job.companyLogo}
                          alt={job.companyName}
                          className="h-10 w-10 rounded bg-slate-950 border border-slate-900 object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-xs md:text-sm text-white">
                            <Link to={`/jobs/${job.id}`} className="hover:text-blue-400 transition-colors">
                              {job.title}
                            </Link>
                          </h4>
                          <span className="text-[10px] text-slate-500 mt-1 block">{job.companyName} • {job.location}</span>
                        </div>
                      </div>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {job.matchPercentage}% Match
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* In-app Notifications: 5 columns */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-white/5 p-6 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">In-App Notifications</h3>
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-600">
                    You're all caught up! No recent alerts.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-4 flex items-start gap-3 transition-all duration-200 ${
                        !notif.read ? "bg-blue-600/[0.02]" : ""
                      }`}
                    >
                      <Bell className={`h-4.5 w-4.5 mt-0.5 ${!notif.read ? "text-blue-400 animate-pulse" : "text-slate-600"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className={`text-xs ${!notif.read ? "font-bold text-white" : "font-semibold text-slate-300"}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[9px] text-slate-600 font-medium">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
