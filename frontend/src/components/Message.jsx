import React from "react";

const Message = ({ variant = "info", children }) => {
  const getStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-red-50 text-red-800 border-red-200";
      case "success":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "info":
      default:
        return "bg-blue-50 text-blue-800 border-blue-200";
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border text-sm font-medium ${getStyles()} my-3`}
    >
      {children}
    </div>
  );
};

export default Message;
