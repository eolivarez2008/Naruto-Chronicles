"use client";

import { useState, type ChangeEvent } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { trackEvent, EVENTS } from "@/lib/analytics";
import {
  CheckCircle2,
  Send,
  Mail,
  MessageSquare,
  Clock,
  Shield,
  CheckCheck,
} from "lucide-react";

interface FormState {
  nom: string;
  email: string;
  objet: string;
  message: string;
}

const INIT: FormState = { nom: "", email: "", objet: "", message: "" };

function Field({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = true,
  maxLength,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-white/50 text-xs font-bold uppercase tracking-widest"
      >
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        className="h-12 w-full rounded-xl border border-white/8 bg-white/4 px-4 text-sm text-white placeholder:text-white/20 backdrop-blur-sm focus:outline-none focus:border-naruto-orange/50 focus:ring-1 focus:ring-naruto-orange/20 transition-all"
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-sm group hover:bg-white/5 transition-colors">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-naruto-orange/10 border border-naruto-orange/20 flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon size={18} className="text-naruto-orange" />
      </div>
      <div>
        <p className="text-sm font-bold text-white mb-1 uppercase tracking-tight">
          {title}
        </p>
        <div className="text-[13px] text-white/40 leading-relaxed font-dm-sans">
          {children}
        </div>
      </div>
    </div>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-8 fade-in-up">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl scale-150" />
        <div className="relative w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
          <CheckCircle2 size={48} className="text-green-400" />
        </div>
      </div>
      <div>
        <h2 className="text-4xl font-black text-white mb-3 font-syne italic">
          Message envoyé !
        </h2>
        <p className="text-white/50 text-base max-w-sm leading-relaxed">
          Merci pour ton message. Réponse sous 48h.
        </p>
      </div>
      <button
        onClick={onReset}
        className="px-8 py-3 rounded-full text-sm font-bold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
      >
        Envoyer un autre message
      </button>
    </div>
  );
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const limits: Record<string, number> = {
    nom: 50,
    email: 100,
    objet: 100,
    message: 1000,
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;

    if (value.length > limits[id]) return;

    setForm((p) => ({ ...p, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.nom,
          email: form.email,
          subject: form.objet,
          message: form.message,
          captchaToken,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (res.ok) {
        trackEvent(EVENTS.CONTACT_SUBMIT);
        setIsSent(true);
        setForm(INIT);
      } else {
        setError(data.error ?? "Erreur lors de l’envoi.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isSent) return <SuccessState onReset={() => setIsSent(false)} />;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-stretch">
        {/* ── Colonne gauche — infos ── */}
        <aside className="lg:col-span-2 flex flex-col">
          <div className="flex flex-col justify-between h-full space-y-6 lg:space-y-0">
            <div className="flex flex-col gap-6 lg:gap-0 lg:justify-between h-full">
              <InfoCard icon={CheckCheck} title="Types de demandes acceptées">
                <ul className="list-disc list-inside text-left">
                  <li>Question sur Naruto</li> <li>Bug sur une page</li>
                  <li>Suggestion d’amélioration</li>
                  <li>Discussion libre</li>
                </ul>
              </InfoCard>
              <InfoCard icon={Clock} title="Délai de réponse">
                Réponds en général sous
                <span className="text-white/70 font-semibold">
                  48 heures
                </span>. <br /> Les week-ends peuvent allonger ce délai.
              </InfoCard>
              <InfoCard icon={Mail} title="Suivi des messages">
                Une réponse est envoyée par
                <span className="text-white/70 font-semibold">email</span>.
                <br /> Pensez à vérifier les spams.
              </InfoCard>
              <InfoCard icon={Shield} title="Confidentialité">
                Vos données ne sont jamais partagées. <br /> Voir les
                <a
                  href="/legal"
                  className="text-naruto-orange/80 hover:text-naruto-orange underline transition-colors"
                >
                  mentions légales
                </a>
                .
              </InfoCard>
              <InfoCard icon={MessageSquare} title="Signaler un bug">
                Pour les bugs techniques, précisez la page concernée et les
                étapes pour reproduire le problème.
              </InfoCard>
            </div>
          </div>
        </aside>
        <div className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/8 bg-white/5 p-6 sm:p-10 space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field
                id="nom"
                label="Nom"
                placeholder="Masashi K."
                value={form.nom}
                onChange={handleChange as any}
                maxLength={50}
              />
              <Field
                id="email"
                label="Email"
                type="email"
                placeholder="naruto@konoha.jp"
                value={form.email}
                onChange={handleChange as any}
                maxLength={100}
              />
            </div>

            <Field
              id="objet"
              label="Objet"
              placeholder="Bug, suggestion..."
              value={form.objet}
              onChange={handleChange as any}
              maxLength={100}
            />

            <div className="flex flex-col gap-2">
              <label className="text-white/50 text-xs font-bold uppercase tracking-widest">
                Message
              </label>
              <textarea
                id="message"
                required
                maxLength={1000}
                value={form.message}
                onChange={handleChange}
                placeholder="Dites-moi tout… n'hésitez pas à être précis !"
                rows={8}
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder:text-white/20 backdrop-blur-sm focus:outline-none focus:border-naruto-orange/50 focus:ring-1 focus:ring-naruto-orange/20 transition-all resize-none"
              />
              <p className="text-right text-xs text-white/30">
                {form.message.length}/1000
              </p>
            </div>

            <div className="flex justify-center scale-90">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                options={{ theme: "dark" }}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !captchaToken}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base bg-naruto-orange hover:bg-[#e65500] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer shadow-lg shadow-naruto-orange/20 overflow-hidden"
            >
              {submitting ? "Envoi en cours ..." : "Envoyer votre message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
