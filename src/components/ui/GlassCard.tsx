import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  hover = false,
}: GlassCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/8",
        "bg-linear-to-b from-white/5 to-transparent",
        "backdrop-blur-md",
        hover ? "glow-hover cursor-pointer" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
