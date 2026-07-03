import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, ShieldCheck, Target, RefreshCcw, Loader2 } from "lucide-react";

const Resumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [targetRoleInput, setTargetRoleInput] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);

  const fileInputRef = useRef(null);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/resumes");
      setResumes(res.data.data.resumes);
    } catch (err) {
      setError("Failed to fetch resumes history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUpload(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processUpload(files[0]);
    }
  };

  const processUpload = async (file) => {
    // Basic file checks
    const allowedExtensions = ["pdf", "docx", "doc", "txt"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError("Invalid file format. Only PDF, DOC, and DOCX are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await api.post("/resumes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      setSuccess(`Resume "${file.name}" uploaded and parsed successfully!`);
      fetchResumes();
    } catch (err) {
      setError(err.response?.data?.message || "Resume upload and parsing failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (resumeId) => {
    try {
      await api.post(`/resumes/${resumeId}/active`);
      setSuccess("Active resume updated.");
      fetchResumes();
    } catch (err) {
      setError("Failed to update active resume.");
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume version?")) return;
    try {
      await api.delete(`/resumes/${resumeId}`);
      setSuccess("Resume version removed.");
      fetchResumes();
    } catch (err) {
      setError("Failed to delete resume.");
    }
  };

  const handleReanalyze = async (e, resumeId) => {
    e.preventDefault();
    if (!targetRoleInput.trim()) return;

    setReanalyzing(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/resumes/${resumeId}/analyze`, { targetRole: targetRoleInput });
      setSuccess(`ATS analysis updated for role: ${targetRoleInput}`);
      setTargetRoleInput("");
      fetchResumes();
    } catch (err) {
      setError(err.response?.data?.message || "Analysis request failed.");
    } finally {
      setReanalyzing(false);
    }
  };

  const activeResume = resumes.find((r) => r.isActive);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-white/5">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400">
            Resume Center
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Upload your resume to parse your skills and analyze your ATS keyword compatibility.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm mb-6 font-medium animate-shake">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-sm mb-6 font-medium">
            {success}
          </div>
        )}

        {/* Top Grid: Drag & Drop + Active Resume ATS Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Upload Area Card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="flex flex-col justify-center items-center h-80 min-h-80 border-dashed border-white/10 hover:border-blue-500/30 transition-all duration-300 relative">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className="absolute inset-0 flex flex-col justify-center items-center cursor-pointer p-6 text-center select-none"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-4 w-full px-8">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <p className="text-sm font-semibold">Parsing Document...</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">{uploadProgress}% uploaded</span>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-4 hover:scale-110 transition-all duration-300">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold">Drag & Drop Resume</h3>
                    <p className="text-xs text-slate-500 mt-2 px-4">
                      Supports PDF, DOCX or TXT files up to 5MB. AI will automatically extract tech stack details.
                    </p>
                  </>
                )}
              </div>
            </Card>

            {/* Custom Scan Form */}
            {activeResume && (
              <Card>
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                  <Target className="h-4.5 w-4.5 text-blue-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Scan for Specific Job Role</h3>
                </div>
                <form onSubmit={(e) => handleReanalyze(e, activeResume._id)} className="flex flex-col gap-4">
                  <Input
                    id="targetRoleInput"
                    placeholder="e.g. Senior Backend Architect"
                    value={targetRoleInput}
                    onChange={(e) => setTargetRoleInput(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="secondary" loading={reanalyzing} className="w-full">
                    Recalculate ATS Score
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Active Resume ATS Metrics */}
          <div className="lg:col-span-2">
            {loading ? (
              <Card className="h-full flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </Card>
            ) : !activeResume ? (
              <Card className="h-full flex flex-col items-center justify-center py-20 text-center">
                <FileText className="h-16 w-16 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold">No Resume Found</h3>
                <p className="text-slate-500 text-sm mt-2 max-w-sm px-6">
                  Please upload your resume in the dropzone to evaluate your profile score and keywords.
                </p>
              </Card>
            ) : (
              <Card className="h-full">
                {/* ATS Header Details */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white truncate max-w-[250px] md:max-w-md">
                        {activeResume.fileName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Active Resume Version {activeResume.version} • Uploaded {new Date(activeResume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* ATS Circle Gauge */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      {/* Gauge Ring */}
                      <svg className="absolute transform -rotate-95 h-full w-full">
                        <circle cx="40" cy="40" r="34" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          stroke="#2563eb"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 34}
                          strokeDashoffset={2 * Math.PI * 34 * (1 - activeResume.atsAnalysis.atsScore / 100)}
                        />
                      </svg>
                      <span className="text-lg font-black text-white">{activeResume.atsAnalysis.atsScore}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">ATS Match Score</span>
                      <span className="text-sm font-semibold text-blue-400 mt-0.5 block capitalize">
                        {activeResume.atsAnalysis.quality || "Moderate"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score breakdown tabs/sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strong Skills */}
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Strong Assets</span>
                    <div className="flex flex-wrap gap-2">
                      {activeResume.atsAnalysis.strongSkills.map((s, i) => (
                        <span key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-lg font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Skills Gaps</span>
                    <div className="flex flex-wrap gap-2">
                      {activeResume.atsAnalysis.missingSkills.map((s, i) => (
                        <span key={i} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-2.5 py-1 rounded-lg font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="md:col-span-2 border-t border-white/5 pt-6 mt-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-3">AI Suggestions for Improvement</span>
                    <ul className="flex flex-col gap-2.5">
                      {activeResume.atsAnalysis.improvementSuggestions.map((s, i) => (
                        <li key={i} className="flex gap-2.5 text-xs md:text-sm text-slate-300">
                          <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Panel: Version History */}
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-white/5 p-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Upload History & Versioning</h3>
            <span className="bg-slate-900 border border-slate-800 text-xs text-slate-400 px-3 py-1 rounded-full font-semibold">
              {resumes.length} total versions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <th className="py-4.5 px-6">Version</th>
                  <th className="py-4.5 px-6">File Name</th>
                  <th className="py-4.5 px-6">Upload Date</th>
                  <th className="py-4.5 px-6">ATS Score</th>
                  <th className="py-4.5 px-6">Status</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300 font-medium">
                {resumes.map((resume) => (
                  <tr key={resume._id} className="hover:bg-white/[0.01] transition-all duration-200">
                    <td className="py-4 px-6 text-white font-bold">V{resume.version}</td>
                    <td className="py-4 px-6 truncate max-w-xs">{resume.fileName}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-blue-400">{resume.atsAnalysis?.atsScore || 0}</span>
                    </td>
                    <td className="py-4 px-6">
                      {resume.isActive ? (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActive(resume._id)}
                          className="text-xs text-slate-500 hover:text-white transition-all duration-300 cursor-pointer"
                        >
                          Mark Active
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-3">
                        <a
                          href={resume.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-white transition-all duration-300"
                        >
                          View Link
                        </a>
                        <button
                          onClick={() => handleDelete(resume._id)}
                          className="text-slate-500 hover:text-rose-400 transition-all duration-300 cursor-pointer"
                          title="Delete version"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Resumes;
