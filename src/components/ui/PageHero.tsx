import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function PageHero({
  eyebrow,
  title,
  description,
  action,
  className = "",
}: PageHeroProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-13">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Orange eyebrow */}
            <p className="text-naruto-orange text-sm font-bold uppercase tracking-[0.3em] mb-3">
              {eyebrow}
            </p>

            {/* Main title */}
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-none mb-4">
              {title}
            </h1>

            {/* Accent line */}
            <div className="accent-line w-20" />

            {/* Description */}
            {description && (
              <p className="text-white/50 text-sm sm:text-base leading-relaxed pt-1">
                {description}
              </p>
            )}
          </div>

          {/* Optional CTA */}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
