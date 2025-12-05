import React from "react";

/**
 * Small AI typing / thinking indicator
 */
export default function AILoader({ label = "AI is thinking..." }) {
  return (
    <div className="flex items-center gap-2 text-white/80">
      <span className="ailoader-dot" />
      <span className="ailoader-dot d2" />
      <span className="ailoader-dot d3" />
      <span className="text-sm ml-2">{label}</span>
    </div>
  );
}
