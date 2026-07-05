import React from "react";

const Button = ({
  children,
  type = "button",
  variant = "primary", // primary, secondary, danger, glass
  loading = false,
  disabled = false,
  onClick,
  className = "",
  iconBefore,
  iconAfter,
}) => {
  const baseStyle =
    "group relative inline-flex items-center justify-center font-semibold tracking-tight rounded-full transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer gap-2 py-2.5 px-6 text-sm md:text-base";

  const variants = {
    primary:
      "bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-600 hover:from-blue-400 hover:via-indigo-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 focus:ring-indigo-400",
    secondary:
      "bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 border border-slate-700 hover:border-slate-600 shadow-sm shadow-black/20 focus:ring-slate-500",
    danger:
      "bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 focus:ring-rose-400",
    glass:
      "bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 hover:border-white/25 shadow-sm shadow-black/10 focus:ring-white/50",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!loading && iconBefore}
      {children}
      {!loading && iconAfter}
    </button>
  );
};

export default Button;
