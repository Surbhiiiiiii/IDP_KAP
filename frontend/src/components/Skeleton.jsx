import React from "react";

/**
 * Skeleton component used across pages.
 * className can be used to set height/width, e.g. "h-32 w-full"
 */
export default function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}
