import React from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Mail, MapPin, Sparkles } from "lucide-react";
import { personalInfo, socialLinks } from "../../constants/portfolioData";

const currentYear = new Date().getFullYear();
const appVersion = "v1.0.0";

const quickLinks = [
  { label: "Dashboard", to: "/" },
  { label: "Job Search", to: "/jobs" },
  { label: "Tracker", to: "/tracker" },
  { label: "Resumes", to: "/resumes" },
  { label: "Profile", to: "/profile" },
];

const features = [
  "AI Job Matching",
  "Application Tracker",
  "Resume Management",
  "Analytics Dashboard",
];

const socialBadge = {
  github: "GH",
  linkedin: "in",
  twitter: "X",
  leetcode: "LC",
};

const AppFooter = () => {
  const handleSubscribe = (event) => {
    event.preventDefault();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <section>
            <div className="flex items-center gap-2 text-white">
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold tracking-wide">ApplyHub</p>
                <p className="text-xs text-slate-400">Premium Career Platform</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{personalInfo.bio}</p>
            <div className="mt-5 space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <a className="hover:text-slate-200" href={`mailto:${personalInfo.email}`}>
                  {personalInfo.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                {personalInfo.location}
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {quickLinks.map((linkItem) => (
                <li key={linkItem.label}>
                  <Link
                    to={linkItem.to}
                    className="text-sm text-slate-400 transition-colors hover:text-slate-200"
                  >
                    {linkItem.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Features
            </h3>
            <ul className="mt-4 space-y-2">
              {features.map((feature) => (
                <li className="text-sm text-slate-400" key={feature}>
                  {feature}
                </li>
              ))}
            </ul>

            <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-slate-200">
              Social
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {socialLinks.map((social) => {
                const badge = socialBadge[social.icon] || social.name.slice(0, 2).toUpperCase();
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
                    aria-label={social.name}
                  >
                    <span className="inline-flex h-4 min-w-4 items-center justify-center text-[11px] font-bold">
                      {badge}
                    </span>
                    {social.name}
                  </a>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Newsletter
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Get product updates, hiring insights, and ApplyHub release notes.
            </p>
            <form className="mt-4 space-y-2" onSubmit={handleSubscribe}>
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none ring-0 placeholder:text-slate-500 focus:border-slate-700"
              />
              <button
                type="submit"
                className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
              >
                Subscribe
              </button>
            </form>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <p>
              Copyright {currentYear} ApplyHub. Built by {personalInfo.name}.
            </p>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {appVersion}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href="#" className="transition-colors hover:text-slate-200">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-slate-200">
              Terms of Service
            </a>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
