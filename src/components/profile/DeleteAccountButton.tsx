"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { trackEvent, EVENTS } from "@/lib/analytics";

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", { method: "DELETE" });
      if (res.ok) {
        trackEvent(EVENTS.AUTH_DELETE);
        window.location.href = "/?deleted=1";
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2.5 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
        title="Supprimer le compte"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-4xl bg-zinc-900 border border-white/10 p-8 shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">Zone de danger</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Es-tu sûr de vouloir supprimer ton compte ? Cette action est
                irréversible et tes listes seront perdues à jamais.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all disabled:opacity-50"
              >
                {loading ? "Suppression..." : "Confirmer la suppression"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 text-sm text-white/40 font-medium hover:text-white transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
