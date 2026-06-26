import { Metadata } from "next";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import PageHero from "@/components/ui/PageHero";
import prisma from "@/lib/prisma";
import { Star, Quote } from "lucide-react";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Sagas",
  description:
    "Découvrez toutes les sagas de l'univers Naruto — scores, statuts et synopsis en temps réel.",
};

export default async function SagaPage() {
  const validSagas = await prisma.saga.findMany({ orderBy: { year: "asc" } });

  return (
    <main className="min-h-screen bg-[#050505] text-white -mt-16 pt-16">
      <PageHero
        eyebrow="Chronologie"
        title="Les Sagas"
        description="L'épopée complète à travers les différentes époques : de l'enfance de Naruto à l'avènement de Boruto."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* --- DESKTOP --- */}
        <div className="hidden lg:grid grid-cols-1 gap-20 lg:gap-32">
          {validSagas.map((saga, i) => {
            const isEven = i % 2 === 0;

            return (
              <section
                key={saga.key}
                className={`group flex flex-col gap-8 lg:gap-16 items-start fade-in-up ${
                  isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Image */}
                <div className="w-full lg:w-1/4 relative shrink-0">
                  <div className="aspect-3/4 rounded-2xl lg:rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                    <Image
                      src={saga.image}
                      alt={saga.label}
                      fill
                      sizes="25vw"
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute -top-4 -right-4 bg-naruto-orange text-white font-black p-4 rounded-xl shadow-xl z-30 group-hover:rotate-6 transition-transform duration-300 flex items-center gap-1.5">
                    <Star
                      size={22}
                      className="text-yellow-400"
                      fill="currentColor"
                    />
                    <span className="text-base">{saga.score ?? "-"}</span>
                  </div>
                </div>

                {/* Infos / Contenu */}
                <div className="flex-1 space-y-6 w-full">
                  <div
                    className={`flex justify-between items-end border-b border-white/10 pb-4 ${isEven ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <h2 className="text-3xl lg:text-4xl font-bold text-naruto-orange font-syne italic leading-none">
                      {saga.label}
                    </h2>
                    <span className="text-white/10 text-7xl font-black select-none leading-none -mb-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <p className="text-white/70 leading-relaxed text-sm md:text-base lg:text-lg font-dm-sans text-justify">
                    {saga.synopsisFr}
                  </p>

                  <GlassCard className="p-5 lg:p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 border-white/10 bg-white/5 backdrop-blur-sm">
                    {[
                      { label: "Auteur", value: saga.creator },
                      {
                        label: saga.type === "manga" ? "Chapitres" : "Épisodes",
                        value: saga.total ?? "-",
                      },
                      { label: "Sortie", value: saga.year ?? "-" },
                      {
                        label: "Status",
                        value: saga.status,
                        highlight: saga.status === "En cours",
                      },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="space-y-1">
                        <p className="text-[10px] uppercase text-white/30 font-black tracking-widest truncate">
                          {label}
                        </p>
                        <p
                          className={`font-bold text-sm lg:text-base truncate ${highlight ? "text-naruto-orange" : "text-white"}`}
                        >
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </GlassCard>
                </div>
              </section>
            );
          })}
        </div>

        {/* --- MOBILE --- */}
        <div className="lg:hidden space-y-0">
          {validSagas.map((saga, i) => (
            <div
              key={saga.key}
              className="fade-in-up relative pb-10"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div
                className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-2xl mb-0"
                style={{ borderRadius: "1rem 1rem 0 0" }}
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
                  <Star
                    size={16}
                    className="text-naruto-orange"
                    fill="currentColor"
                  />{" "}
                  {saga.score ?? "-"}
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
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-black mb-0.5 truncate">
                      {stat.label}
                    </p>
                    <p className="text-white text-sm font-bold truncate">
                      {String(stat.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative pt-2">
                <Quote
                  className="absolute -top-2 -left-2 text-naruto-orange/20 rotate-180"
                  size={30}
                  fill="currentColor"
                  aria-hidden
                />

                <p className="text-white/65 leading-relaxed text-[14px] italic px-6 relative z-10 text-justify">
                  {saga.synopsisFr}
                </p>

                <Quote
                  className="absolute -bottom-2 -right-1 text-naruto-orange/20"
                  size={30}
                  fill="currentColor"
                  aria-hidden
                />
              </div>

              {i < validSagas.length - 1 && (
                <div className="ml-6 mt-8 h-px bg-linear-to-r from-naruto-orange/20 via-white/5 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
