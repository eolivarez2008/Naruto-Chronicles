"use client";

import { useState } from "react";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: string;
  loading?: "lazy" | "eager";
  style?: React.CSSProperties;
}

const DEFAULT_FALLBACK = "/logo/favicon-naruto.png";

export default function SafeImage({
  src,
  alt,
  className = "",
  fallback = DEFAULT_FALLBACK,
  loading = "lazy",
  style,
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  const effectiveSrc = errored || !src?.trim() ? fallback : src;

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      className={className}
      loading={loading}
      style={style}
      onError={() => setErrored(true)}
    />
  );
}
