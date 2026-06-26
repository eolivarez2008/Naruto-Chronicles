import type { Metadata } from "next";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import { INFO_ROWS, QUICK_STATS } from "@/lib/homeData";
import HomeDynamic from "@/components/home/HomeDynamic";

export const metadata: Metadata = {
  title: "Naruto Chronicles",
  description:
    "Plongez dans l'univers complet de Naruto Uzumaki — histoire, personnages, sagas et bien plus.",
  openGraph: {
    title: "Naruto Chronicles",
    description: "L'encyclopédie fan de l'univers Naruto",
    images: [
      {
        url: "https://m.media-amazon.com/images/M/MV5BZTNjOWI0ZTAtOGY1OS00ZGU0LWEyOWYtMjhkYjdlYmVjMDk2XkEyXkFqcGc@._V1_.jpg",
      },
    ],
  },
};

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center w-full">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-18 pb-16 fade-in-up">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h1
              className="text-5xl md:text-6xl font-bold leading-tight tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Naruto
              <br />
              <span className="text-naruto-orange">Chronicles</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-lg">
              Plongez dans l&rsquo;univers complet de Naruto Uzumaki —
              l&rsquo;histoire d&rsquo;un ninja qui rêve de devenir Hokage et de
              conquérir le respect de son village.
            </p>
            <div className="flex gap-6 pt-2">
              {QUICK_STATS.map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="text-white font-semibold">{val}</div>
                  <div className="text-white/40 text-xs mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative shrink-0 fade-in-up delay-200 hidden md:block">
            <div className="absolute inset-0 rounded-2xl bg-naruto-orange opacity-10 blur-3xl scale-110" />
            <Image
              src="https://m.media-amazon.com/images/M/MV5BZTNjOWI0ZTAtOGY1OS00ZGU0LWEyOWYtMjhkYjdlYmVjMDk2XkEyXkFqcGc@._V1_.jpg"
              alt="Affiche Naruto"
              width={240}
              height={340}
              className="relative rounded-2xl object-cover shadow-2xl"
              data-umami-event="click-poster"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* ── Fiche Technique ──────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-10 fade-in-up delay-200">
        <GlassCard className="p-6 md:p-8 overflow-hidden">
          <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-naruto-orange mb-1">
            Fiche Technique
          </h2>
          <span className="accent-line w-24" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
            {INFO_ROWS.map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-white/40 text-sm shrink-0 w-40">
                  {label}
                </span>
                <span className="text-white/90 text-sm font-medium">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* ── Dynamic Content (Videos, Tierlists, Characters) ───────────── */}
      <div className="w-full fade-in-up delay-300 mt-5">
        <HomeDynamic />
      </div>
    </div>
  );
}
