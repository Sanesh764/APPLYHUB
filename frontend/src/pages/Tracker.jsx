import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { FolderHeart, CheckSquare, Clock, Users, Gift, XCircle, ChevronRight, ChevronLeft, Calendar, FileText, Loader2 } from "lucide-react";

const Tracker = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const columns = [
    { id: "saved", title: "Saved Jobs", icon: <FolderHeart className="h-5 w-5 text-indigo-400" /> },
    { id: "applied", title: "Applied", icon: <CheckSquare className="h-5 w-5 text-blue-400" /> },
    { id: "pending", title: "Pending Review", icon: <Clock className="h-5 w-5 text-amber-400" /> },
    { id: "interview", title: "Interviews", icon: <Users className="h-5 w-5 text-purple-400" /> },
    { id: "offer", title: "Offers", icon: <Gift className="h-5 w-5 text-emerald-400" /> },
    { id: "rejected", title: "Rejected", icon: <XCircle className="h-5 w-5 text-rose-400" /> },
  ];

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/applications");
      setApplications(res.data.data.applications);
    } catch (err) {
      setError("Failed to fetch applications pipeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleMoveStatus = async (appId, newStatus) => {
    try {
      setError("");
      await api.put(`/applications/${appId}/status`, { status: newStatus });
      fetchApplications();
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const getNextStatus = (current) => {
    const list = ["saved", "applied", "pending", "interview", "offer"];
    const idx = list.indexOf(current);
    return idx !== -1 && idx < list.length - 1 ? list[idx + 1] : null;
  };

  const getPrevStatus = (current) => {
    const list = ["saved", "applied", "pending", "interview", "offer"];
    const idx = list.indexOf(current);
    return idx > 0 ? list[idx - 1] : null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative overflow-hidden flex flex-col">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-white/5">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400">
            Application Pipeline
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Track and update your job application progression stages.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm mb-6 font-medium animate-shake">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-500 text-sm animate-pulse">Loading pipeline board...</p>
          </div>
        ) : (
          /* Kanban Board Scrollable Container */
          <div className="flex-1 overflow-x-auto pb-6">
            <div className="flex gap-6 min-w-[1200px] h-full items-start">
              {columns.map((col) => {
                const colApps = applications.filter((app) => app.status === col.id);

                return (
                  <div key={col.id} className="flex-1 bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto min-w-[260px]">
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        {col.icon}
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{col.title}</h3>
                      </div>
                      <span className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded-full font-bold">
                        {colApps.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-3">
                      {colApps.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-600 font-medium">
                          No jobs in this stage.
                        </div>
                      ) : (
                        colApps.map((app) => (
                          <div key={app._id} className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 hover:border-slate-800">
                            {/* Card Header */}
                            <div className="flex items-start gap-3">
                              <img
                                src={app.jobId.companyLogo}
                                alt={app.jobId.companyName}
                                className="h-9 w-9 rounded bg-slate-900 border border-slate-800 object-cover flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-xs md:text-sm text-white truncate" title={app.jobId.title}>
                                  <Link to={`/jobs/${app.jobId._id || app.jobId.id || app.jobId}`} className="hover:text-blue-400 transition-colors">
                                    {app.jobId.title}
                                  </Link>
                                </h4>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                                  {app.jobId.companyName}
                                </p>
                              </div>
                            </div>

                            {/* Info row */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-white/5 pt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(app.updatedAt).toLocaleDateString()}
                              </span>
                              {app.jobId.salary && (
                                <span>${(app.jobId.salary / 1000).toFixed(0)}k</span>
                              )}
                            </div>

                            {/* Actions / Move buttons */}
                            <div className="flex justify-between items-center bg-slate-900/40 rounded-lg p-1.5 border border-white/5 mt-1">
                              {/* Left Shift */}
                              {getPrevStatus(col.id) ? (
                                <button
                                  onClick={() => handleMoveStatus(app._id, getPrevStatus(col.id))}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all cursor-pointer"
                                  title={`Move to ${getPrevStatus(col.id)}`}
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <div className="w-5.5 h-5.5"></div>
                              )}

                              {/* Reject action toggle */}
                              {col.id !== "rejected" ? (
                                <button
                                  onClick={() => handleMoveStatus(app._id, "rejected")}
                                  className="text-[10px] font-bold text-rose-500 hover:text-rose-400 transition-all px-2 cursor-pointer"
                                >
                                  Reject
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMoveStatus(app._id, "applied")}
                                  className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-all px-2 cursor-pointer"
                                >
                                  Restore
                                </button>
                              )}

                              {/* Right Shift */}
                              {getNextStatus(col.id) ? (
                                <button
                                  onClick={() => handleMoveStatus(app._id, getNextStatus(col.id))}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all cursor-pointer"
                                  title={`Move to ${getNextStatus(col.id)}`}
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <div className="w-5.5 h-5.5"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracker;
