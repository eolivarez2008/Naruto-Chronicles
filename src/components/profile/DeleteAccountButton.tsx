"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function DeleteAccountButton() {
  const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setStep("loading");
    setError(null);

    try {
      const res = await fetch("/api/auth/profile", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur lors de la suppression.");
        setStep("confirm");
        return;
      }

      window.location.href = "/?deleted=1";
    } catch {
      setError("Erreur réseau. Réessaie.");
      setStep("confirm");
    }
  };

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm")}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400/70 border border-red-500/20 hover:bg-red-500/8 hover:text-red-400 transition-all cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Supprimer mon compte
      </button>
    );
  }

  if (step === "confirm") {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/6 p-4 space-y-3 w-full">
        <p className="text-red-400/90 text-sm font-semibold">
          Confirmer la suppression ?
        </p>
        <p className="text-white/40 text-xs leading-relaxed">
          Toutes tes données (compte, likes) seront supprimées immédiatement et
          de façon irréversible.
        </p>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setStep("idle");
              setError(null);
            }}
            className="flex-1 py-2 rounded-lg text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/8 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all cursor-pointer"
          >
            Oui, supprimer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-white/30">
      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
      Suppression en cours…
    </div>
  );
}
