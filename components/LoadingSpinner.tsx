import React from "react";

export default function LoadingSpinner({
  size = 16, // px
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full animate-spin border-2 border-[#1F2937] border-t-[#3B82F6] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}