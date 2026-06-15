import Image from "next/image";
import type { Saga } from "@/types";

interface SagaCardProps {
  saga: Saga;
  index: number;
  total: number;
}

export default function SagaCard({ saga, index, total }: SagaCardProps) {
  return (
    <div
      className="group fade-in-up rounded-2xl border border-white/8 bg-linear-to-b from-white/5 to-transparent backdrop-blur-md overflow-hidden glow-hover"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Poster */}
        <div className="relative w-full md:w-50 shrink-0 aspect-3/4 md:aspect-auto">
          <Image
            src={saga.image}
            alt={saga.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 200px"
            className="object-cover"
            loading="lazy"
          />
          {/* Gradient overlay on mobile */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent md:bg-linear-to-r" />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center p-6 md:p-8 gap-4 flex-1">
          {/* Badge */}
          <span className="text-naruto-orange text-[10px] font-bold tracking-[0.2em] uppercase">
            Saga {index + 1} / {total}
          </span>

          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {saga.title}
          </h2>

          <div className="h-px w-12 bg-linear-to-r from-naruto-orange to-transparent" />

          <p className="text-white/60 text-sm md:text-[15px] leading-relaxed">
            {saga.description}
          </p>

          <a
            href={saga.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="voir-plus-saga"
            data-umami-event-saga={saga.umamiSaga}
            className="inline-flex items-center gap-2 self-start mt-2 px-5 py-2 rounded-full text-sm font-semibold border border-[rgba(255,102,0,0.4)] text-naruto-orange bg-[rgba(255,102,0,0.08)] hover:bg-[rgba(255,102,0,0.2)] transition-all duration-200"
          >
            Voir plus
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6h8M7 3l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
