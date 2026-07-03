import React from "react";

const Card = ({ children, className = "", hoverEffect = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 text-white shadow-2xl transition-all duration-300 ${
        hoverEffect
          ? "hover:border-blue-500/30 hover:bg-slate-900/50 hover:shadow-blue-500/5 hover:-translate-y-1 cursor-pointer"
          : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
