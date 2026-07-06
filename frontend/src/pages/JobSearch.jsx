import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import CoverLetterModal from "./CoverLetterModal";
import {
  Search,
  MapPin,
  DollarSign,
  Briefcase,
  FileText,
  Bookmark,
  CheckCircle,
  Share2,
  Compass,
  Sparkles,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";

const INITIAL_FILTERS = {
  query: "",
  location: "",
  workMode: "any",
  salary: "",
};

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Per-job "save to tracker" progress + which jobs are already saved.
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(() => new Set());

  // Cover letter modal is bound to a single job at a time.
  const [coverLetterJob, setCoverLetterJob] = useState(null);

  // Translate the filter form into the backend's query-param shape.
  const buildParams = useCallback((f, page) => {
    const params = { page, limit: 12 };
    if (f.query) params.query = f.query;
    if (f.location) params.location = f.location;
    if (f.workMode && f.workMode !== "any") params.remoteType = f.workMode;
    if (f.salary) params.salary = f.salary;
    return params;
  }, []);

  const fetchJobs = useCallback(
    async (searchFilters, page = 1, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError("");

        const res = await api.get("/jobs", {
          params: buildParams(searchFilters, page),
        });
        const { jobs: jobList = [], pagination: meta = null } = res.data.data;

        setJobs((prev) => (append ? [...prev, ...jobList] : jobList));
        setPagination(meta);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load matching jobs.");
        if (!append) setJobs([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    fetchJobs(INITIAL_FILTERS, 1, false);
  }, [fetchJobs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSuccess("");
    fetchJobs(filters, 1, false);
  };

  const handleLoadMore = () => {
    if (pagination?.hasMore) {
      fetchJobs(filters, pagination.page + 1, true);
    }
  };

  // Bookmark a job into the application tracker (status: saved).
  const handleSaveJob = async (jobId) => {
    setSavingId(jobId);
    setError("");
    setSuccess("");
    try {
      await api.post("/applications", { jobId, status: "saved" });
      setSavedIds((prev) => new Set(prev).add(jobId));
      setSuccess("Job saved to your application tracker.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save job.");
    } finally {
      setSavingId(null);
    }
  };

  // Apply = open the official posting only. No application record is created.
  const handleApply = (job) => {
    if (!job.applyUrl) {
      setError("No application link is available for this job.");
      return;
    }
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
  };

  const handleShare = (job) => {
    const parts = [`Check out this job: ${job.title} at ${job.company}`];
    if (job.matchScore != null) parts.push(`Match score: ${job.matchScore}%`);
    if (job.applyUrl) parts.push(job.applyUrl);
    navigator.clipboard.writeText(parts.join(" — "));
    setError("");
    setSuccess("Job details copied to clipboard!");
  };

  // Color helper for the match badge.
  const getMatchColor = (score) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-rose-500/10 border-rose-500/20 text-rose-400";
  };

  const formatSalary = (job) => {
    const currency = job.currency || "$";
    const fmt = (n) => Number(n).toLocaleString();
    if (job.salaryMin && job.salaryMax) return `${currency}${fmt(job.salaryMin)} – ${currency}${fmt(job.salaryMax)}`;
    if (job.salaryMax) return `Up to ${currency}${fmt(job.salaryMax)}`;
    if (job.salaryMin) return `From ${currency}${fmt(job.salaryMin)}`;
    if (job.salary) return typeof job.salary === "number" ? `${currency}${fmt(job.salary)}` : job.salary;
    return "Not disclosed";
  };

  const formatPosted = (date) => {
    if (!date) return "Recently";
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? "Recently" : d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 relative">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="h-7 w-7 text-blue-400" /> Discover Jobs
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Browse openings matched to your resume. Apply on the company's official page.
          </p>
        </div>

        {/* Filters bar */}
        <Card className="p-4 mb-8">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <Input
              id="query"
              name="query"
              label="Keywords / Job Title"
              placeholder="e.g. React Node.js"
              value={filters.query}
              onChange={handleInputChange}
            />
            <Input
              id="location"
              name="location"
              label="Location"
              placeholder="e.g. Pune, Remote"
              value={filters.location}
              onChange={handleInputChange}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs md:text-sm font-semibold text-slate-300">Work Mode</label>
              <select
                name="workMode"
                value={filters.workMode}
                onChange={handleInputChange}
                className="rounded-xl bg-slate-900 border border-slate-800 py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer"
              >
                <option value="any">Any Mode</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
            <Input
              id="salary"
              name="salary"
              type="number"
              label="Min Salary"
              placeholder="e.g. 50000"
              value={filters.salary}
              onChange={handleInputChange}
            />
            <Button type="submit" variant="primary" className="py-3.5">
              <Search className="h-4.5 w-4.5" /> Search
            </Button>
          </form>
        </Card>

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

        {/* Card grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-500 text-sm animate-pulse">Running AI job matching...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-24 text-center">
            <Compass className="h-16 w-16 text-slate-700 mb-4" />
            <h3 className="text-xl font-bold">No Matching Jobs Found</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm px-6">
              Adjust your search keywords, location, or work-mode filters and try again.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const saved = savedIds.has(job.id);
                return (
                  <Card key={job.id} className="flex flex-col gap-4 p-6" hoverEffect>
                    {/* Header: logo, title, company, match badge */}
                    <div className="flex items-start gap-4">
                      {job.logo ? (
                        <img
                          src={job.logo}
                          alt={job.company}
                          className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-900 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-5 w-5 text-slate-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-white leading-tight line-clamp-2">
                          <Link to={`/jobs/${job.id}`} className="hover:text-blue-400 transition-colors">
                            {job.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-blue-400 mt-1 font-semibold truncate">{job.company}</p>
                      </div>
                      {job.matchScore != null && (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider flex-shrink-0 ${getMatchColor(
                            job.matchScore
                          )}`}
                        >
                          {job.matchScore}%
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location || "Location N/A"}
                      </span>
                      {job.remoteType && (
                        <span className="flex items-center gap-1 capitalize">
                          <Briefcase className="h-3.5 w-3.5" />
                          {job.remoteType}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatPosted(job.postedAt)}
                      </span>
                    </div>

                    {/* Salary */}
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                      <DollarSign className="h-4 w-4 text-slate-500 -ml-0.5" />
                      {formatSalary(job)}
                    </div>

                    {/* Summary / description snippet */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 flex-1">
                      {job.summary || job.description || "No description provided for this posting."}
                    </p>

                    {/* AI match rationale */}
                    {job.why && (
                      <div className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-3 flex gap-2">
                        <Sparkles className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">{job.why}</p>
                      </div>
                    )}

                    {/* Skills tags */}
                    {Array.isArray(job.skills) && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-800 text-[10px] font-medium text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-auto">
                      <Button
                        type="button"
                        variant="glass"
                        onClick={() => handleShare(job)}
                        className="p-2.5"
                        aria-label="Share job"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="glass"
                        onClick={() => setCoverLetterJob(job)}
                        className="p-2.5"
                        aria-label="Generate cover letter"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleSaveJob(job.id)}
                        loading={savingId === job.id}
                        disabled={saved}
                        className="flex-1 py-2.5 text-xs"
                      >
                        {saved ? (
                          <>
                            <CheckCircle className="h-4 w-4" /> Saved
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-4 w-4" /> Save
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleApply(job)}
                        disabled={!job.applyUrl}
                        className="flex-1 py-2.5 text-xs"
                      >
                        Apply <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Load more */}
            {pagination?.hasMore && (
              <div className="flex justify-center mt-10">
                <Button type="button" variant="secondary" onClick={handleLoadMore} loading={loadingMore}>
                  Load More Jobs
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cover Letter Modal */}
      {coverLetterJob && (
        <CoverLetterModal
          isOpen={!!coverLetterJob}
          onClose={() => setCoverLetterJob(null)}
          jobId={coverLetterJob.id}
          jobTitle={coverLetterJob.title}
          companyName={coverLetterJob.company}
        />
      )}
    </div>
  );
};

export default JobSearch;
