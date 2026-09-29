import React from "react";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-3">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">
        Loading...
      </p>
    </div>
  );
};

export default Loader;
