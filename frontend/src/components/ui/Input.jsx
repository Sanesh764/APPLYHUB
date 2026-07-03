import React, { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      label,
      type = "text",
      error,
      placeholder,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs md:text-sm font-semibold text-slate-300 tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          placeholder={placeholder}
          className={`w-full rounded-xl bg-slate-900/60 border ${
            error
              ? "border-rose-500 focus:ring-rose-500/20"
              : "border-slate-800 focus:border-blue-500 focus:ring-blue-500/20"
          } py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-300 backdrop-blur-md`}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-400 font-medium mt-0.5 animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
