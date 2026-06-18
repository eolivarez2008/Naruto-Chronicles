import { Metadata } from "next";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Les Sagas",
};

export default async function SagaPage() {
  const validSagas = await prisma.saga.findMany({
    orderBy: { year: "asc" },
  });

  return (
    <div
      className="w-full max-w-5xl mx-auto px-4 lg:px-6 py-8 lg:py-12 space-y-12 lg:space-y-16"
      suppressHydrationWarning
    >
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="text-4xl lg:text-5xl font-bold text-white font-syne uppercase tracking-tighter mt-2">
          Les <span className="text-naruto-orange">Sagas</span>
        </h1>
        <div className="accent-line w-16 lg:w-20 mt-4" />
      </div>

      {/* DESKTOP LIST */}
      <div className="hidden lg:grid grid-cols-1 gap-24">
        {validSagas.map((saga, i) => (
          <div
            key={saga.key}
            className="group flex flex-col lg:flex-row gap-12 items-center lg:items-center fade-in-up"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="w-full lg:w-1/3 relative shrink-0 px-4 lg:px-0">
              <div className="aspect-video lg:aspect-3/4 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-10">
                <Image
                  src={saga.image}
                  alt={saga.label}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent lg:hidden" />
                <div className="absolute bottom-6 left-6 lg:hidden z-20">
                  <h2 className="text-3xl font-bold text-white font-syne italic leading-none">
                    {saga.label}
                  </h2>
                </div>
              </div>
              <div className="absolute top-2 right-6 lg:-top-4 lg:-right-4 bg-naruto-orange text-white font-black lg:p-4 rounded-xl shadow-xl z-30 group-hover:rotate-6 transition-transform duration-300 text-xs lg:text-base">
                ⭐ {saga.score ?? "-"}
              </div>
            </div>

            <div className="flex-1 space-y-6 w-full lg:mt-0 px-2 lg:px-0 z-20">
              <div className="hidden lg:flex justify-between items-end border-b border-white/10 pb-4">
                <h2 className="text-4xl font-bold text-white font-syne italic">
                  {saga.label}
                </h2>
                <span className="text-white/10 text-7xl font-black select-none">
                  0{i + 1}
                </span>
              </div>
              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl lg:bg-transparent lg:p-0">
                <p className="text-white/80 leading-relaxed text-sm lg:text-[17px] font-dm-sans italic lg:text-justify">
                  {saga.synopsisFr}
                </p>
              </div>
              <GlassCard className="p-5 lg:p-8 grid grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 lg:gap-8 border-white/20 bg-white/5 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-white/30 font-black tracking-widest">
                    Auteur
                  </p>
                  <p className="text-white font-bold text-xs lg:text-sm truncate">
                    {saga.creator}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-white/30 font-black tracking-widest">
                    {saga.type === "manga" ? "Chapitres" : "Épisodes"}
                  </p>
                  <p className="text-white font-bold text-xs lg:text-sm">
                    {saga.total ?? "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-white/30 font-black tracking-widest">
                    Sortie
                  </p>
                  <p className="text-white font-bold text-xs lg:text-sm">
                    {saga.year ?? "-"}
                  </p>
                </div>
                <div className="space-y-1 text-right lg:text-left">
                  <p className="text-[9px] uppercase text-white/30 font-black tracking-widest">
                    Status
                  </p>
                  <p
                    className={`text-xs lg:text-sm font-bold ${saga.status === "En cours" ? "text-naruto-orange" : "text-green-400"}`}
                  >
                    {saga.status}
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE LIST */}
      <div className="lg:hidden space-y-0">
        {validSagas.map((saga, i) => (
          <div
            key={saga.key}
            className="saga-mobile-card fade-in-up relative"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div className="pb-10">
              <div
                className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.7)] mb-0"
                style={{ borderRadius: "1rem 1rem 0rem 0" }}
              >
                <Image
                  src={saga.image}
                  alt={saga.label}
                  fill
                  unoptimized
                  className="object-cover object-center scale-[1.02]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 z-10">
                  <span className="text-naruto-orange text-xs">⭐</span>
                  <span className="text-white font-black text-xs">
                    {saga.score ?? "-"}
                  </span>
                </div>
                <div className="absolute top-3 left-3 z-10">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${saga.status === "En cours" ? "bg-naruto-orange/90 text-white" : "bg-green-500/80 text-white"}`}
                  >
                    {saga.status}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-10">
                  <h2 className="text-3xl font-bold text-white font-syne italic leading-tight drop-shadow-lg">
                    {saga.label}
                  </h2>
                </div>
              </div>

              <div className="flex items-stretch rounded-b-2xl overflow-hidden border border-white/8 border-t-0 divide-x divide-white/8 bg-white/4 backdrop-blur-xl mb-5">
                {[
                  {
                    label: saga.type === "manga" ? "Chapitres" : "Épisodes",
                    value: saga.total ?? "-",
                  },
                  { label: "Sortie", value: saga.year ?? "-" },
                  { label: "Auteur", value: saga.creator },
                ].map((stat) => (
                  <div key={stat.label} className="flex-1 px-3 py-4 min-w-0">
                    <p className="text-[10px] lg:text-[8px] uppercase tracking-widest text-white/30 font-black mb-0.5 truncate">
                      {stat.label}
                    </p>
                    <p className="text-white text-sm lg:text-xs font-bold truncate">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative">
                <span
                  className="absolute -top-3 -left-1 text-5xl leading-none text-naruto-orange/20 font-black select-none pointer-events-none font-syne"
                  aria-hidden
                >
                  "
                </span>
                <p className="text-white/65 leading-relaxed text-[14px] font-dm-sans italic pl-3 pr-1">
                  {saga.synopsisFr}
                </p>
              </div>
            </div>
            {i < validSagas.length - 1 && (
              <div className="ml-6 mb-2 h-px bg-linear-to-r from-naruto-orange/20 via-white/5 to-transparent" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
