import React, { useState, useEffect } from "react";
import api from "../services/api";
import Button from "../components/ui/Button";
import { X, FileText, Download, Printer, Loader2 } from "lucide-react";

const CoverLetterModal = ({ isOpen, onClose, jobId, jobTitle, companyName }) => {
  const [letterText, setLetterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && jobId) {
      generateLetter();
    }
  }, [isOpen, jobId]);

  const generateLetter = async () => {
    setLoading(true);
    setError("");
    setLetterText("");
    try {
      const res = await api.post("/applications/cover-letter", { jobId });
      setLetterText(res.data.data.coverLetter);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate Cover Letter via AI.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!letterText) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Cover Letter - ${jobTitle} at ${companyName}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              padding: 40px 60px;
              line-height: 1.6;
              font-size: 12pt;
              color: #111;
              max-width: 800px;
              margin: 0 auto;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>${letterText}</body>
      </html>
    `);
    printWindow.document.close();
    // Wait for content load to trigger print prompt
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadTxt = () => {
    if (!letterText) return;
    const element = document.createElement("a");
    const file = new Blob([letterText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `CoverLetter_${companyName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">AI Cover Letter Builder</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-all cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-4 text-xs md:text-sm text-slate-300">
            Below is the pre-generated cover letter based on your active resume and the job details for 
            <strong> {jobTitle}</strong> at <strong>{companyName}</strong>. Review and customize the text before exporting.
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-xs text-slate-500 animate-pulse">AI is writing your letter templates...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm">
              {error}
            </div>
          ) : (
            <textarea
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
              className="flex-1 min-h-[300px] md:min-h-[400px] w-full rounded-xl bg-slate-950 border border-slate-800 p-5 text-slate-200 font-mono text-xs md:text-sm leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 resize-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 p-6 bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
          <Button type="button" variant="secondary" onClick={generateLetter} disabled={loading} iconBefore={<RefreshCwIcon />}>
            Re-generate AI
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="glass"
              onClick={handleDownloadTxt}
              disabled={loading || !letterText}
              iconBefore={<Download className="h-4.5 w-4.5" />}
            >
              Export TXT
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePrint}
              disabled={loading || !letterText}
              iconBefore={<Printer className="h-4.5 w-4.5" />}
            >
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple inline refresh icon fallback
const RefreshCwIcon = () => (
  <svg
    className="h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
  </svg>
);

export default CoverLetterModal;
