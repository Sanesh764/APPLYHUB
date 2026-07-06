import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import CoverLetterModal from "./CoverLetterModal";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Building,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Bookmark,
  Share2,
  Compass,
  Link2,
} from "lucide-react";

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isCLOpen, setIsCLOpen] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/jobs/${jobId}`);
        const { job: jobData } = res.data.data;
        setJob(jobData);
        
        // Check if this job is already saved in applications
        const appsRes = await api.get("/applications");
        const alreadySaved = (appsRes.data.data || []).some(
          (app) => app.jobId?._id === jobId || app.jobId === jobId
        );
        setSaved(alreadySaved);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load job details.");
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchDetails();
  }, [jobId]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/applications", { jobId, status: "saved" });
      setSaved(true);
      setSuccess("Job saved to your application tracker.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save job.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (!job) return;
    const shareText = `Check out this job: ${job.title} at ${job.company} — ${window.location.href}`;
    navigator.clipboard.writeText(shareText);
    setSuccess("Job details page URL copied to clipboard!");
  };

  const getMatchColor = (score) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-rose-500/10 border-rose-500/20 text-rose-400";
  };

  const formatSalary = (j) => {
    const currency = j.currency || "$";
    const fmt = (n) => Number(n).toLocaleString();
    if (j.salaryMin && j.salaryMax) return `${currency}${fmt(j.salaryMin)} – ${currency}${fmt(j.salaryMax)}`;
    if (j.salaryMax) return `Up to ${currency}${fmt(j.salaryMax)}`;
    if (j.salaryMin) return `From ${currency}${fmt(j.salaryMin)}`;
    return j.salary || "Not Specified";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-slate-500 text-sm animate-pulse">Loading AI compatibility & enrichment...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold">Failed to load Job Details</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">{error || "The job posting could not be found."}</p>
        <Link to="/jobs" className="mt-6">
          <Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back to Job Search</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex flex-col gap-6">
        {/* Back Button */}
        <div>
          <Link to="/jobs" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" /> Back to Discover Jobs
          </Link>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-sm font-medium">
            {success}
          </div>
        )}

        {/* Header Section */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            {job.logo ? (
              <img
                src={job.logo}
                alt={job.company}
                className="h-16 w-16 rounded-2xl bg-slate-950 border border-slate-900 object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-slate-950 border border-slate-900 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-7 w-7 text-slate-600" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">{job.title}</h1>
                {job.isInternship && (
                  <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Internship
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-blue-400 mt-1">{job.company}</p>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-3">
                <span>Source: {job.source.toUpperCase()}</span>
                <span>•</span>
                <span>Posted: {new Date(job.postedAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Button variant="glass" onClick={handleShare} className="p-3" aria-label="Share">
              <Share2 className="h-4.5 w-4.5" />
            </Button>
            <Button variant="glass" onClick={() => setIsCLOpen(true)} className="p-3" aria-label="Cover Letter">
              <FileText className="h-4.5 w-4.5" />
            </Button>
            <Button
              variant="secondary"
              onClick={handleSave}
              loading={saving}
              disabled={saved}
              className="flex-1 md:flex-initial"
            >
              <Bookmark className="h-4.5 w-4.5" /> {saved ? "Saved" : "Save Job"}
            </Button>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial"
            >
              <Button variant="primary" className="w-full">
                Apply Now <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Description & Details */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Meta Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm font-semibold text-slate-400">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-900/40 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Salary Range</span>
                <span className="text-slate-200 font-bold flex items-center gap-0.5">
                  <DollarSign className="h-4 w-4 text-slate-500 -ml-1" />
                  {formatSalary(job)}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-900/40 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Work Mode</span>
                <span className="text-slate-200 font-bold flex items-center gap-1.5 capitalize">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  {job.remoteType || "onsite"}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-900/40 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Experience Range</span>
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  {job.experience || "Not Specified"}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-900/40 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Education</span>
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-slate-500" />
                  {job.education || "Not Specified"}
                </span>
              </div>
            </div>

            {/* Internship details section if applicable */}
            {job.isInternship && (
              <Card className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  Internship Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs md:text-sm">
                  <div>
                    <span className="text-slate-500 block">Stipend</span>
                    <span className="text-white font-semibold">{job.internshipDetails?.stipend}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Duration</span>
                    <span className="text-white font-semibold">{job.internshipDetails?.duration}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Type</span>
                    <span className="text-white font-semibold">{job.internshipDetails?.internshipType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">PPO Availability</span>
                    <span className="text-white font-semibold">{job.internshipDetails?.ppoAvailability}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Start Date</span>
                    <span className="text-white font-semibold">{job.internshipDetails?.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Eligibility</span>
                    <span className="text-white font-semibold">{job.internshipDetails?.eligibility}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Job Description */}
            <Card className="flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                Job Description
              </h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </Card>

            {/* Responsibilities */}
            {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
              <Card className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  Key Responsibilities
                </h3>
                <ul className="list-disc list-inside flex flex-col gap-2.5 text-xs md:text-sm text-slate-300">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="leading-relaxed">{resp}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Skills & Technologies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(job.skills) && job.skills.length > 0 ? (
                    job.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Not Specified</span>
                  )}
                </div>
              </Card>

              <Card className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(job.technologies) && job.technologies.length > 0 ? (
                    job.technologies.map((tech) => (
                      <span key={tech} className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-900 text-xs font-semibold text-blue-400">
                        {tech}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Not Specified</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Benefits & Perks */}
            {Array.isArray(job.benefits) && job.benefits.length > 0 && (
              <Card className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  Benefits & Perks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map((benefit, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/30 text-xs font-semibold text-emerald-400">
                      {benefit}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column (4 cols): AI compatibility & Company Info */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* AI Match Card */}
            {job.matchScore != null && (
              <Card className="flex flex-col gap-4 border border-blue-500/20 bg-blue-600/5">
                <div className="flex items-center justify-between border-b border-blue-500/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">AI Match Details</h3>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getMatchColor(job.matchScore)}`}>
                    {job.matchScore}% Score
                  </span>
                </div>

                {/* AI Recommendation summary */}
                <div className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed">
                  {job.recommendation}
                </div>

                <div className="text-xs text-slate-300 leading-relaxed italic border-t border-blue-500/10 pt-3">
                  "{job.why}"
                </div>

                {/* Missing skills overlap */}
                {Array.isArray(job.missingSkills) && job.missingSkills.length > 0 && (
                  <div className="border-t border-blue-500/10 pt-3 flex flex-col gap-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Missing Skill Gaps</span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.missingSkills.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/30 text-[10px] font-semibold text-rose-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {Array.isArray(job.resumeSuggestions) && job.resumeSuggestions.length > 0 && (
                  <div className="border-t border-blue-500/10 pt-3 flex flex-col gap-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Resume Suggestions</span>
                    <ul className="list-disc list-inside flex flex-col gap-1.5 text-xs text-slate-300">
                      {job.resumeSuggestions.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {/* AI Career Assistant */}
            {job.matchScore != null && (
              <Card className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  AI Career Assistant
                </h3>
                <div className="flex flex-col gap-4 text-xs md:text-sm">
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] tracking-wider font-bold mb-1">Interview Readiness</span>
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-blue-400" /> {job.interviewReadiness}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] tracking-wider font-bold mb-1">Difficulty Level</span>
                    <span className="text-white font-semibold capitalize">{job.difficultyLevel}</span>
                  </div>
                  
                  {Array.isArray(job.interviewTopics) && job.interviewTopics.length > 0 && (
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px] tracking-wider font-bold mb-1">Expected Topics</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {job.interviewTopics.map((topic, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(job.prepRoadmap) && job.prepRoadmap.length > 0 && (
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px] tracking-wider font-bold mb-1">Prep Roadmap</span>
                      <ol className="list-decimal list-inside flex flex-col gap-1.5 mt-1 text-slate-300 text-xs leading-relaxed">
                        {job.prepRoadmap.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {Array.isArray(job.learningResources) && job.learningResources.length > 0 && (
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px] tracking-wider font-bold mb-1">Suggested Resources</span>
                      <div className="flex flex-col gap-2 mt-1.5">
                        {job.learningResources.map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            <Link2 className="h-3.5 w-3.5" /> {res.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* AI Summary Card */}
            {job.summary && (
              <Card className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  AI Summary
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  {job.summary}
                </p>
              </Card>
            )}

            {/* Company Info Card */}
            <Card className="flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                Company Information
              </h3>
              <div className="flex flex-col gap-3 text-xs md:text-sm">
                <div>
                  <span className="text-slate-500 block">Industry</span>
                  <span className="text-white font-semibold">{job.companyIndustry}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Company Size</span>
                  <span className="text-white font-semibold">{job.companySize}</span>
                </div>
                {job.companyWebsite && job.companyWebsite !== "Not Specified" && (
                  <div>
                    <span className="text-slate-500 block">Website</span>
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 mt-0.5"
                    >
                      Visit site <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Description</span>
                  <p className="text-slate-300 mt-1 leading-relaxed">{job.companyDescription}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Visa Sponsorship</span>
                  <span className="text-white font-semibold block mt-0.5">{job.visaSponsorship}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Eligible Countries</span>
                  <span className="text-white font-semibold block mt-0.5">India Eligible: {job.indiaEligible}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Cover Letter Modal Wrapper */}
      <CoverLetterModal
        isOpen={isCLOpen}
        onClose={() => setIsCLOpen(false)}
        jobId={jobId}
        jobTitle={job.title}
        companyName={job.company}
      />
    </div>
  );
};

export default JobDetails;
