import React, { useState, useEffect } from "react";
import api from "../services/api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import CoverLetterModal from "./CoverLetterModal";
import { Search, MapPin, DollarSign, Briefcase, FileText, CheckCircle, Save, Share2, Compass, AlertCircle, Sparkles, Loader2 } from "lucide-react";

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters state
  const [filters, setFilters] = useState({
    query: "",
    location: "",
    workMode: "any",
    salary: "",
  });

  const [savingApp, setSavingApp] = useState(false);
  const [applyingApp, setApplyingApp] = useState(false);

  // Cover Letter Modal state
  const [isCLOpen, setIsCLOpen] = useState(false);

  const fetchJobs = async (searchFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      
      const queryParams = {};
      if (searchFilters.query) queryParams.query = searchFilters.query;
      if (searchFilters.location) queryParams.location = searchFilters.location;
      if (searchFilters.workMode && searchFilters.workMode !== "any") queryParams.workMode = searchFilters.workMode;
      if (searchFilters.salary) queryParams.salary = searchFilters.salary;

      const res = await api.get("/jobs", { params: queryParams });
      const jobList = res.data.data.jobs;
      setJobs(jobList);

      if (jobList.length > 0) {
        setSelectedJob(jobList[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load matching jobs catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleSaveJob = async (jobId) => {
    setSavingApp(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/applications", { jobId, status: "saved" });
      setSuccess("Job successfully bookmarked in your application tracker!");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save job.");
    } finally {
      setSavingApp(false);
    }
  };

  const handleApplyNow = async (jobId) => {
    setApplyingApp(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/applications", { jobId, status: "applied" });
      setSuccess("Success! Application package prepared and confirmation email sent. Redirecting to official application page...");
      
      // Redirect to official job page in a new tab
      if (selectedJob && selectedJob.applyUrl) {
        setTimeout(() => {
          window.open(selectedJob.applyUrl, "_blank");
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Application submission failed.");
    } finally {
      setApplyingApp(false);
    }
  };

  const handleShare = (job) => {
    const shareText = `Check out this job: ${job.title} at ${job.companyName}. Match score: ${job.matchPercentage}%!`;
    navigator.clipboard.writeText(shareText);
    setSuccess("Job details copied to clipboard!");
  };

  // Color helper for match badge
  const getMatchColor = (score) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-rose-500/10 border-rose-500/20 text-rose-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative overflow-hidden flex flex-col">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 flex-1 flex flex-col">
        {/* Filters bar */}
        <Card className="p-4 mb-8">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
              placeholder="e.g. Pune india, Remote"
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
            <Button type="submit" variant="primary" className="py-3.5">
              <Search className="h-4.5 w-4.5" /> Search Jobs
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

        {/* Dashboard Split Panel */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-500 text-sm animate-pulse">Running AI job matching checks...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="flex-1 flex flex-col items-center justify-center py-24 text-center">
            <Compass className="h-16 w-16 text-slate-700 mb-4 animate-spin-slow" />
            <h3 className="text-xl font-bold">No Matching Jobs Discovered</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm px-6">
              Adjust your search keywords, location filters, or onboarding Wizard preferences.
            </p>
          </Card>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left list: 5 Columns */}
            <div className="lg:col-span-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    selectedJob?.id === job.id
                      ? "bg-blue-600/5 border-blue-500/30 shadow-lg shadow-blue-500/5"
                      : "bg-slate-900/40 border-white/5 hover:border-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="h-11 w-11 rounded-lg bg-slate-950 border border-slate-900 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-base text-white truncate">{job.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{job.companyName}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-3.5 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                        <span className="flex items-center gap-1 uppercase"><Briefcase className="h-3.5 w-3.5" />{job.workMode}</span>
                      </div>
                    </div>

                    {/* Match Badge */}
                    {job.matchPercentage !== undefined && (
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getMatchColor(job.matchPercentage)}`}>
                        {job.matchPercentage}% Match
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right details: 7 Columns */}
            <div className="lg:col-span-7 h-full">
              {selectedJob && (
                <Card className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                  {/* Job Header Details */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedJob.companyLogo}
                        alt={selectedJob.companyName}
                        className="h-14 w-14 rounded-xl bg-slate-950 border border-slate-900 object-cover"
                      />
                      <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{selectedJob.title}</h2>
                        <span className="text-xs text-blue-400 font-semibold mt-1 block">{selectedJob.companyName}</span>
                        <p className="text-xs text-slate-500 mt-1">
                          Posted: {new Date(selectedJob.postedDate).toLocaleDateString()} • Source: {selectedJob.source.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Button
                        type="button"
                        variant="glass"
                        onClick={() => handleShare(selectedJob)}
                        className="p-3"
                      >
                        <Share2 className="h-4.5 w-4.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleSaveJob(selectedJob.id)}
                        loading={savingApp}
                        className="flex-1 md:flex-initial"
                      >
                        <Save className="h-4.5 w-4.5" /> Save
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleApplyNow(selectedJob.id)}
                        loading={applyingApp}
                        className="flex-1 md:flex-initial"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>

                  {/* AI Match Stats Popover block */}
                  {selectedJob.matchDetails && (
                    <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-5 flex flex-col gap-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-blue-400" />
                          <h3 className="text-sm font-extrabold text-blue-400 uppercase tracking-wider">AI Compatibility Report</h3>
                        </div>
                        <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">
                          {selectedJob.matchPercentage}% Compatibility
                        </span>
                      </div>

                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                        {selectedJob.matchDetails.explanation}
                      </p>

                      {/* Cover letter generate quick link */}
                      <div className="flex flex-wrap items-center justify-between border-t border-blue-500/5 pt-3 mt-1 gap-4">
                        <span className="text-xs text-slate-500 font-medium">
                          Need a personalized introduction packet?
                        </span>
                        <Button
                          type="button"
                          variant="glass"
                          onClick={() => setIsCLOpen(true)}
                          className="py-2.5 px-4 text-xs font-bold border border-blue-500/20 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10"
                          iconBefore={<FileText className="h-3.5 w-3.5" />}
                        >
                          Generate Cover Letter
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Core details */}
                  <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-6 text-xs md:text-sm font-semibold text-slate-400">
                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-900">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Salary Range</span>
                      <span className="text-slate-200 font-bold flex items-center">
                        <DollarSign className="h-4 w-4 text-slate-500 -ml-1" />
                        {selectedJob.salary ? selectedJob.salary.toLocaleString() : "Confidential"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-900">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Location Mode</span>
                      <span className="text-slate-200 font-bold flex items-center gap-1 capitalize">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        {selectedJob.workMode}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-900">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Experience Range</span>
                      <span className="text-slate-200 font-bold flex items-center gap-1 truncate">
                        <Briefcase className="h-4 w-4 text-slate-500" />
                        {selectedJob.experienceLevel || "Not Listed"}
                      </span>
                    </div>
                  </div>

                  {/* Job Description Text */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Job Description</h3>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {selectedJob.description}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cover Letter Modal Wrapper */}
      {selectedJob && (
        <CoverLetterModal
          isOpen={isCLOpen}
          onClose={() => setIsCLOpen(false)}
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          companyName={selectedJob.companyName}
        />
      )}
    </div>
  );
};

export default JobSearch;
