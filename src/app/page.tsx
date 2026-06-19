import type { Metadata } from "next";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import { INFO_ROWS, QUICK_STATS } from "@/lib/homeData";

export const metadata: Metadata = {
  title: "Naruto Chronicles",
};

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center w-full">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-16 pb-10 fade-in-up">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Text side */}
          <div className="flex-1 space-y-6">
            <span className="inline-block text-naruto-orange text-xs font-bold tracking-[0.2em] uppercase border border-[rgba(255,102,0,0.3)] rounded-full px-3 py-1 bg-[rgba(255,102,0,0.08)]">
              Univers Naruto
            </span>
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

            {/* Quick stats */}
            <div className="flex gap-6 pt-2">
              {QUICK_STATS.map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="text-white font-semibold">{val}</div>
                  <div className="text-white/40 text-xs mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Poster */}
          <div className="relative shrink-0 fade-in-up delay-200">
            <div className="absolute inset-0 rounded-2xl bg-naruto-orange opacity-10 blur-3xl scale-110" />
            <Image
              src="https://m.media-amazon.com/images/M/MV5BZTNjOWI0ZTAtOGY1OS00ZGU0LWEyOWYtMjhkYjdlYmVjMDk2XkEyXkFqcGc@._V1_.jpg"
              alt="Affiche Naruto"
              width={240}
              height={340}
              className="relative rounded-2xl object-cover shadow-2xl"
              data-umami-event="click-poster"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Fiche technique ───────────────────────────────────── */}
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

      {/* ── Résumé ────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-10 fade-in-up delay-300">
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-naruto-orange mb-1">
            Résumé
          </h2>
          <span className="accent-line w-16" />
          <div className="space-y-4 text-white/75 leading-relaxed text-[15px]">
            <p>
              C&rsquo;est l&rsquo;histoire de{" "}
              <strong className="text-white">Naruto Uzumaki</strong>, un jeune
              ninja du village de Konoha qui rêve de devenir Hokage. Orphelin et
              rejeté par les autres habitants à cause du démon renard à neuf
              queues, <strong className="text-white">Kyûbi</strong>, scellé en
              lui, Naruto a dû surmonter la solitude et se battre pour être
              accepté.
            </p>
            <p>
              Tout au long de son parcours, Naruto se lie d&rsquo;amitié avec
              d&rsquo;autres ninjas, dont{" "}
              <strong className="text-white">Sasuke Uchiwa</strong>, son rival
              et ami, et <strong className="text-white">Sakura Haruno</strong>,
              pour qui il a un faible. Sous la tutelle de{" "}
              <strong className="text-white">Kakashi Hatake</strong>, ils
              forment l&rsquo;équipe 7, et ensemble, ils affrontent de nombreux
              ennemis et découvrent les sombres secrets de leur monde.
            </p>
            <p>
              La série explore des thèmes comme l&rsquo;amitié, le sacrifice et
              la persévérance, tandis que Naruto grandit et gagne en puissance
              pour défendre son village et réaliser son rêve de devenir Hokage.
            </p>
          </div>
        </GlassCard>
      </section>

      {/* ── Trailer ───────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-20 fade-in-up delay-400">
        <GlassCard className="p-4 md:p-6">
          <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-naruto-orange mb-1 ml-2">
            Trailer Officiel
          </h2>
          <span className="accent-line w-20 ml-2" />
          <video
            className="w-full rounded-xl max-w-4xl mx-auto block"
            controls
            autoPlay
            muted
            playsInline
          >
            <source src="/videos/trailer naruto.mp4" type="video/mp4" />
            Votre navigateur ne supporte pas la balise vidéo.
          </video>
        </GlassCard>
      </section>
    </div>
  );
}
