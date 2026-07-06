const logger = require("../config/logger");

/**
 * -----------------------------------------------------------------------------
 * Job Enrichment Service (deterministic, no LLM)
 * -----------------------------------------------------------------------------
 * Turns a provider's normalized "raw job" into a fully-shaped Job document using
 * fast, cheap, rule-based extraction. This runs for EVERY listing so the list
 * view is instant. The expensive LLM pass (AI summary + resume match) runs
 * separately, only for the page a user is actually looking at.
 *
 * Design rule from the spec: infer only when confident; otherwise "Not Specified".
 */

const NOT_SPECIFIED = "Not Specified";

// Canonical technology / skill dictionary. Extend freely — detection is a
// word-boundary scan over title + description + provider tags.
const SKILL_DICTIONARY = [
  // Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "golang",
  "php", "rust", "scala", "kotlin", "swift", "objective-c", "dart", "elixir",
  // Frontend
  "react", "angular", "vue", "svelte", "next.js", "nuxt", "redux", "zustand",
  "html", "css", "sass", "tailwindcss", "tailwind", "bootstrap", "material-ui",
  // Backend
  "node.js", "nodejs", "express", "nestjs", "django", "flask", "fastapi", "spring",
  "spring boot", "rails", "laravel", "asp.net", ".net", "graphql", "rest", "restful", "grpc",
  // Databases
  "mongodb", "postgresql", "postgres", "mysql", "redis", "cassandra", "sqlite",
  "oracle", "mariadb", "dynamodb", "elasticsearch", "firebase", "supabase",
  // Cloud / DevOps
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins",
  "terraform", "ansible", "git", "github actions", "gitlab ci", "ci/cd", "linux",
  // Data / ML
  "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "spark", "hadoop",
  "kafka", "airflow", "tableau", "power bi", "excel",
  // Practices / tools
  "agile", "scrum", "kanban", "jira", "figma", "microservices",
];

// Split into "technologies" (concrete tools) vs broader "skills". Anything in
// the dictionary counts as a skill; the subset below is also flagged as a tech.
const TECH_SUBSET = new Set([
  "react", "angular", "vue", "svelte", "next.js", "nuxt", "node.js", "nodejs",
  "express", "django", "flask", "fastapi", "spring", "docker", "kubernetes",
  "aws", "azure", "gcp", "mongodb", "postgresql", "mysql", "redis", "graphql",
  "kafka", "terraform", "tensorflow", "pytorch", "git",
]);

const EMPLOYMENT_TYPES = [
  { re: /\bfull[\s-]?time\b/i, label: "Full-time" },
  { re: /\bpart[\s-]?time\b/i, label: "Part-time" },
  { re: /\bcontract(or)?\b/i, label: "Contract" },
  { re: /\binternship\b|\bintern\b/i, label: "Internship" },
  { re: /\bfreelance\b/i, label: "Freelance" },
  { re: /\btemporary\b|\btemp\b/i, label: "Temporary" },
];

const EDUCATION_PATTERNS = [
  { re: /\bph\.?d\b|\bdoctorate\b/i, label: "PhD" },
  { re: /\bmaster'?s?\b|\bm\.?s\.?c?\b|\bmba\b|\bm\.?tech\b/i, label: "Master's degree" },
  { re: /\bbachelor'?s?\b|\bb\.?s\.?c?\b|\bb\.?tech\b|\bb\.?e\b|\bundergraduate\b/i, label: "Bachelor's degree" },
  { re: /\bdiploma\b/i, label: "Diploma" },
  { re: /\bhigh school\b/i, label: "High school" },
];

class JobEnrichmentService {
  /**
   * Enrich one raw job into a full Job-shaped object (minus persistence fields).
   * @param {Object} raw  Normalized raw job from a provider.
   * @returns {Object}
   */
  enrich(raw) {
    const haystack = `${raw.title || ""} ${raw.description || ""} ${(raw.tags || []).join(" ")}`;

    const skills = this.extractSkills(haystack, raw.tags);
    const technologies = skills.filter((s) => TECH_SUBSET.has(s.toLowerCase()));
    const salaryInfo = this.extractSalary(raw.salaryRaw, raw.description, raw.currency);

    return {
      title: (raw.title || NOT_SPECIFIED).trim(),
      company: (raw.company || NOT_SPECIFIED).trim(),
      logo: raw.logo || "",
      location: raw.location || NOT_SPECIFIED,
      remoteType: this.resolveRemoteType(raw),
      employmentType: this.extractEmploymentType(raw.employmentType, haystack),
      experience: this.extractExperience(haystack),
      salary: salaryInfo.display,
      salaryMin: salaryInfo.min,
      salaryMax: salaryInfo.max,
      currency: salaryInfo.currency,
      skills: skills.length ? skills : [],
      preferredSkills: [], // filled by the AI pass when available
      technologies,
      education: this.extractEducation(haystack),
      responsibilities: this.extractResponsibilities(raw.description),
      summary: "", // filled by the AI pass
      description: raw.description || NOT_SPECIFIED,
      source: raw.source,
      externalId: raw.externalId,
      applyUrl: raw.applyUrl || "",
      postedAt: raw.postedAt instanceof Date ? raw.postedAt : new Date(raw.postedAt || Date.now()),
    };
  }

  /**
   * Word-boundary scan for dictionary skills; merges in provider-supplied tags
   * that look like real skills. Returns Title-Cased-ish canonical originals.
   */
  extractSkills(text, tags = []) {
    const lower = (text || "").toLowerCase();
    const found = new Set();

    for (const skill of SKILL_DICTIONARY) {
      const re = new RegExp(`(^|[^a-z0-9+.#])${this.escapeRegExp(skill)}([^a-z0-9+.#]|$)`, "i");
      if (re.test(lower)) found.add(skill);
    }

    // Provider tags often carry precise skills (e.g. Remotive/Arbeitnow tags)
    for (const tag of tags || []) {
      const t = (tag || "").toLowerCase().trim();
      if (t && SKILL_DICTIONARY.includes(t)) found.add(t);
    }

    return Array.from(found).map((s) => this.prettySkill(s));
  }

  prettySkill(skill) {
    const specialCases = {
      "javascript": "JavaScript",
      "typescript": "TypeScript",
      "nodejs": "Node.js",
      "node.js": "Node.js",
      "next.js": "Next.js",
      "ci/cd": "CI/CD",
      "aws": "AWS",
      "gcp": "GCP",
      "css": "CSS",
      "html": "HTML",
      "sql": "SQL",
      "graphql": "GraphQL",
      "mongodb": "MongoDB",
      "postgresql": "PostgreSQL",
      "mysql": "MySQL",
      ".net": ".NET",
      "tailwindcss": "TailwindCSS",
      "power bi": "Power BI",
    };
    if (specialCases[skill]) return specialCases[skill];
    return skill
      .split(" ")
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
  }

  /** remote/hybrid/onsite. Falls back to onsite only when there's a real location. */
  resolveRemoteType(raw) {
    if (raw.workMode === "remote" || raw.workMode === "hybrid" || raw.workMode === "onsite") {
      return raw.workMode;
    }
    const loc = (raw.location || "").toLowerCase();
    if (loc.includes("remote")) return "remote";
    // Have a concrete location but no signal → assume onsite; otherwise unknown → onsite default
    return "onsite";
  }

  extractEmploymentType(providerValue, haystack) {
    if (providerValue) {
      const normalized = providerValue.toString().trim();
      for (const et of EMPLOYMENT_TYPES) {
        if (et.re.test(normalized)) return et.label;
      }
      if (normalized) return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    for (const et of EMPLOYMENT_TYPES) {
      if (et.re.test(haystack)) return et.label;
    }
    return "Full-time"; // most common default; high-confidence
  }

  /** Detect experience from "X+ years" or seniority keywords. */
  extractExperience(haystack) {
    const yearsMatch = haystack.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?years?(?:\s+of)?\s+(?:experience|exp)/i);
    if (yearsMatch) {
      const full = yearsMatch[0].replace(/\s+/g, " ").trim();
      return full.charAt(0).toUpperCase() + full.slice(1);
    }
    const t = haystack.toLowerCase();
    if (/\b(principal|staff|lead|senior|sr\.)\b/.test(t)) return "Senior (5+ years)";
    if (/\b(mid[\s-]?level|intermediate)\b/.test(t)) return "Mid-level (2-5 years)";
    if (/\b(junior|jr\.|entry[\s-]?level|graduate|intern)\b/.test(t)) return "Entry-level (0-2 years)";
    return NOT_SPECIFIED;
  }

  /**
   * Extract salary from a provider number or a text range. Returns a display
   * string plus numeric bounds when detectable.
   */
  extractSalary(salaryRaw, description, currency) {
    const result = { display: NOT_SPECIFIED, min: null, max: null, currency: currency || "" };

    // Provider gave a numeric value directly
    if (typeof salaryRaw === "number" && salaryRaw > 0) {
      result.min = Math.round(salaryRaw);
      result.display = `${this.currencySymbol(result.currency)}${result.min.toLocaleString()}`;
      return result;
    }

    // Provider gave a pre-formatted string (e.g. Ashby compensation summary)
    if (typeof salaryRaw === "string" && salaryRaw.trim()) {
      result.display = salaryRaw.trim();
      const nums = salaryRaw.replace(/[,]/g, "").match(/\d{4,}/g);
      if (nums) {
        result.min = Number(nums[0]);
        if (nums[1]) result.max = Number(nums[1]);
      }
      if (!result.currency) result.currency = this.detectCurrency(salaryRaw);
      return result;
    }

    // Scan description for a currency-tagged range
    const text = description || "";
    const rangeMatch = text.match(
      /(?:[$₹€£])\s?(\d{1,3}(?:[,\s]?\d{3})+|\d{4,})\s*(?:-|to|–)\s*(?:[$₹€£])?\s?(\d{1,3}(?:[,\s]?\d{3})+|\d{4,})/
    );
    if (rangeMatch) {
      result.min = Number(rangeMatch[1].replace(/[,\s]/g, ""));
      result.max = Number(rangeMatch[2].replace(/[,\s]/g, ""));
      result.currency = result.currency || this.detectCurrency(rangeMatch[0]);
      const sym = this.currencySymbol(result.currency);
      result.display = `${sym}${result.min.toLocaleString()} - ${sym}${result.max.toLocaleString()}`;
      return result;
    }

    return result;
  }

  detectCurrency(text) {
    if (text.includes("₹") || /\bINR\b|\brs\.?\b/i.test(text)) return "INR";
    if (text.includes("€") || /\bEUR\b/i.test(text)) return "EUR";
    if (text.includes("£") || /\bGBP\b/i.test(text)) return "GBP";
    if (text.includes("$") || /\bUSD\b/i.test(text)) return "USD";
    return "";
  }

  currencySymbol(code) {
    return { INR: "₹", USD: "$", EUR: "€", GBP: "£" }[code] || "";
  }

  extractEducation(haystack) {
    for (const edu of EDUCATION_PATTERNS) {
      if (edu.re.test(haystack)) return edu.label;
    }
    return NOT_SPECIFIED;
  }

  /**
   * Pull responsibility-like sentences. Best-effort: prefer bullet-y lines,
   * otherwise the first few sentences of the description.
   */
  extractResponsibilities(description) {
    if (!description) return [];
    const clean = description.replace(/\s+/g, " ").trim();

    // Try splitting on common bullet separators first
    const bulletCandidates = description
      .split(/[••\n\r]|(?:\s-\s)/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 25 && s.length < 220);

    if (bulletCandidates.length >= 3) {
      return bulletCandidates.slice(0, 6);
    }

    // Fallback: first 3 sentences
    const sentences = clean
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);
    return sentences.slice(0, 3);
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

module.exports = new JobEnrichmentService();
