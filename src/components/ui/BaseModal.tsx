"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function BaseModal({
  isOpen,
  onClose,
  children,
  maxWidth = "sm:max-w-2xl",
}: BaseModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  const modal = (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            style={{ zIndex: 10000 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={[
              "fixed",
              "inset-x-2 sm:inset-x-auto",
              "bottom-1 sm:bottom-auto",
              "sm:left-1/2 sm:-translate-x-1/2",
              "top-[15vh] sm:top-[13vh]",
              "max-h-[85dvh] sm:max-h-[84dvh]",
              `sm:w-full ${maxWidth}`,
              "bg-naruto-surface rounded-2xl border border-white/10 shadow-2xl",
              "flex flex-col overflow-hidden",
            ].join(" ")}
            style={{ zIndex: 10001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-4 top-4" style={{ zIndex: 10002 }}>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return createPortal(modal, document.body);
}
