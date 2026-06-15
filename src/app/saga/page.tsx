import type { Metadata } from "next";
import SagaCard from "@/components/saga/SagaCard";
import { SAGAS } from "@/lib/sagas";

export const metadata: Metadata = {
  title: "Saga",
  description:
    "Présentation des sagas Naruto, Shippuden, Boruto et Two Blue Vortex.",
};

export default function SagaPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 space-y-10">

      {/* Header */}
      <div className="fade-in-up">
        <span className="text-naruto-orange text-xs font-bold tracking-[0.2em] uppercase">
          Collection
        </span>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight text-white mt-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Les Sagas
        </h1>
        <span className="accent-line w-16" />
      </div>

      {/* Saga cards */}
      {SAGAS.map((saga, i) => (
        <SagaCard
          key={saga.id}
          saga={saga}
          index={i}
          total={SAGAS.length}
        />
      ))}

    </div>
  );
}
