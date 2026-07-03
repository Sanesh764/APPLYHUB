import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Sparkles, ArrowRight, ArrowLeft, Plus, X, Briefcase, MapPin, DollarSign } from "lucide-react";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    preferredRole: "",
    experienceLevel: "mid",
    skills: [],
    preferredCountries: [],
    preferredCities: [],
    workMode: "remote",
    expectedSalary: "",
    employmentType: "full-time",
    noticePeriod: "",
    workAuthorization: "",
    languages: [],
  });

  // Local helper states for tag inputs
  const [skillInput, setSkillInput] = useState("");
  const [countryInput, setCountryInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [langInput, setLangInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "expectedSalary" || name === "noticePeriod" ? (value === "" ? "" : Number(value)) : value,
    }));
    setError("");
  };

  // Tag list helpers
  const addTag = (field, value, setter) => {
    if (!value.trim()) return;
    const trimmed = value.trim();
    if (!formData[field].includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], trimmed],
      }));
    }
    setter("");
  };

  const removeTag = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const nextStep = () => {
    if (step === 1 && !formData.preferredRole) {
      setError("Please specify your preferred job role.");
      return;
    }
    setError("");
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Upsert profile data
      await api.post("/profile", {
        ...formData,
        expectedSalary: formData.expectedSalary ? Number(formData.expectedSalary) : undefined,
        noticePeriod: formData.noticePeriod ? Number(formData.noticePeriod) : 0,
      });

      // Redirect to resume page as step 2
      navigate("/resumes");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 md:p-6 overflow-hidden text-white">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10">
        {/* Wizard Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 animate-pulse">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400">
            Let's Set Up Your Profile
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Configure your matching preference parameters for AI job discovery.
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? "w-8 bg-blue-500" : s < step ? "w-2 bg-emerald-500" : "w-2 bg-slate-800"
                }`}
              ></div>
            ))}
          </div>
        </div>

        <Card className="shadow-slate-900/50">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs md:text-sm mb-6 font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* STEP 1: Core Preferences */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Job Details</h3>
                </div>

                <Input
                  id="preferredRole"
                  name="preferredRole"
                  label="Preferred Job Role / Title"
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.preferredRole}
                  onChange={handleInputChange}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm font-semibold text-slate-300">Experience Level</label>
                  <div className="grid grid-cols-5 bg-slate-950/80 rounded-xl p-1 border border-slate-900">
                    {["entry", "mid", "senior", "lead", "executive"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, experienceLevel: level }))}
                        className={`py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          formData.experienceLevel === level
                            ? "bg-blue-600 text-white"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills Tag Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm font-semibold text-slate-300">Core Skills</label>
                  <div className="flex gap-2">
                    <Input
                      id="skillInput"
                      type="text"
                      placeholder="e.g. React, Node.js, Docker"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("skills", skillInput, setSkillInput))}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => addTag("skills", skillInput, setSkillInput)}
                      className="px-4"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full"
                      >
                        {skill}
                        <button type="button" onClick={() => removeTag("skills", idx)} className="hover:text-white cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location Choices */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Location Preferences</h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm font-semibold text-slate-300">Preferred Countries</label>
                  <div className="flex gap-2">
                    <Input
                      id="countryInput"
                      placeholder="e.g. United States, Germany"
                      value={countryInput}
                      onChange={(e) => setCountryInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("preferredCountries", countryInput, setCountryInput))}
                    />
                    <Button type="button" variant="secondary" onClick={() => addTag("preferredCountries", countryInput, setCountryInput)}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.preferredCountries.map((c, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3 py-1 rounded-full">
                        {c}
                        <button type="button" onClick={() => removeTag("preferredCountries", idx)} className="hover:text-white cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm font-semibold text-slate-300">Preferred Cities</label>
                  <div className="flex gap-2">
                    <Input
                      id="cityInput"
                      placeholder="e.g. Berlin, New York, remote"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("preferredCities", cityInput, setCityInput))}
                    />
                    <Button type="button" variant="secondary" onClick={() => addTag("preferredCities", cityInput, setCityInput)}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.preferredCities.map((c, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3 py-1 rounded-full">
                        {c}
                        <button type="button" onClick={() => removeTag("preferredCities", idx)} className="hover:text-white cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-semibold text-slate-300">Work Mode</label>
                    <select
                      name="workMode"
                      value={formData.workMode}
                      onChange={handleInputChange}
                      className="rounded-xl bg-slate-900 border border-slate-800 py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer"
                    >
                      <option value="remote">Remote Only</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                      <option value="any">Open to Any</option>
                    </select>
                  </div>

                  <Input
                    id="workAuthorization"
                    name="workAuthorization"
                    label="Work Authorization / Visa Status"
                    type="text"
                    placeholder="e.g. US Citizen, EU Work Permit"
                    value={formData.workAuthorization}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Compensation & Languages */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Compensation & Details</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="expectedSalary"
                    name="expectedSalary"
                    label="Expected Annual Salary ($)"
                    type="number"
                    placeholder="e.g. 120000"
                    value={formData.expectedSalary}
                    onChange={handleInputChange}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-semibold text-slate-300">Employment Type</label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                      className="rounded-xl bg-slate-900 border border-slate-800 py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                <Input
                  id="noticePeriod"
                  name="noticePeriod"
                  label="Notice Period (in Days)"
                  type="number"
                  placeholder="e.g. 30 (0 for immediate)"
                  value={formData.noticePeriod}
                  onChange={handleInputChange}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm font-semibold text-slate-300">Spoken Languages</label>
                  <div className="flex gap-2">
                    <Input
                      id="langInput"
                      placeholder="e.g. English, French"
                      value={langInput}
                      onChange={(e) => setLangInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("languages", langInput, setLangInput))}
                    />
                    <Button type="button" variant="secondary" onClick={() => addTag("languages", langInput, setLangInput)}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.languages.map((l, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3 py-1 rounded-full">
                        {l}
                        <button type="button" onClick={() => removeTag("languages", idx)} className="hover:text-white cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-6 border-t border-white/5 pt-6">
              {step > 1 ? (
                <Button type="button" variant="secondary" onClick={prevStep} iconBefore={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <Button type="button" variant="primary" onClick={nextStep} iconAfter={<ArrowRight className="h-4 w-4" />}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" variant="primary" loading={loading}>
                  Complete Onboarding
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
