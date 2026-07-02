"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const handleRefuse = () => {
    localStorage.setItem(STORAGE_KEY, "refused");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none"
        >
          <div className=" w-full max-w-2xl pointer-events-auto rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl p-6 md:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-naruto-orange/10 border border-naruto-orange/20 flex items-center justify-center mt-0.5">
                  <Cookie size={20} className="text-naruto-orange" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    Configuration de tes cookies
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Afin d'assurer le bon déroulement de ton aventure et de
                    maintenir ta session de ninja active, ce site utilise des
                    cookies techniques nécessaires pour l'authentification via
                    Google. Rassure-toi, aucun cookie publicitaire ou traceur
                    tiers n'est déposé ici. Pour en savoir plus sur la gestion
                    de tes données, consulte notre{" "}
                    <a
                      href="/legal"
                      className="text-naruto-orange/80 hover:text-naruto-orange underline underline-offset-2 transition-colors whitespace-nowrap"
                    >
                      Politique de confidentialité
                    </a>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full mt-1">
                <button
                  onClick={handleRefuse}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Refuser
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-naruto-orange/50 bg-naruto-orange/10 text-naruto-orange hover:bg-naruto-orange hover:text-white transition-all shadow-lg shadow-naruto-orange/5 cursor-pointer text-center"
                >
                  Accepter
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
