"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart } from "lucide-react";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginPromptModal({
  isOpen,
  onClose,
}: LoginPromptModalProps) {
  if (typeof document === "undefined") return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 10000 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl"
            style={{ zIndex: 10001 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-2xl">
                <Heart size={24} className="text-red-500 fill-current" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">
                Connecte-toi pour liker !
              </h3>
              <p className="mb-6 text-sm text-white/50">
                Tu dois être connecté pour enregistrer tes vidéos favorites et
                soutenir les créateurs.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/profile"
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] text-center block"
                >
                  Se connecter
                </Link>
                <button
                  onClick={onClose}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
