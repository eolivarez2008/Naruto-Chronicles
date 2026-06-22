"use client";

import { useState, type ChangeEvent } from "react";
import InputField from "@/components/ui/InputField";
import { Turnstile } from "@marsidev/react-turnstile";
import { trackEvent, EVENTS } from "@/lib/analytics";

interface FormState {
  nom: string;
  email: string;
  objet: string;
  message: string;
}

const INIT: FormState = { nom: "", email: "", objet: "", message: "" };

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.id]: e.target.value }));

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
          message: `[Objet: ${form.objet}]\n\n${form.message}`,
          captchaToken,
        }),
      });

      const data = await res.json() as { error?: string };

      if (res.ok) {
        trackEvent(EVENTS.CONTACT_SUBMIT);
        setIsSent(true);
        setForm(INIT);
      } else {
        setError(data.error ?? "Une erreur est survenue.");
      }
    } catch {
      setError("Impossible d'envoyer votre message. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="w-full max-w-3xl rounded-2xl border border-white/8 bg-white/5 backdrop-blur-md p-10 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-3xl">✓</div>
        <h2 className="text-2xl font-bold text-white">Message envoyé !</h2>
        <p className="text-white/60">Merci pour votre message, nous vous répondrons dès que possible.</p>
        <button onClick={() => setIsSent(false)} className="mt-4 text-naruto-orange text-sm font-medium hover:underline cursor-pointer">
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl rounded-2xl border border-white/8 bg-linear-to-b from-white/5 to-transparent backdrop-blur-md p-6 md:p-10 flex flex-col gap-6"
    >
      <div>
        <span className="text-naruto-orange text-xs font-bold tracking-[0.2em] uppercase">Message</span>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Contactez-nous
        </h1>
        <div className="accent-line w-28" />
        <p className="text-white/50 text-sm">N&rsquo;hésitez pas à nous envoyer vos questions via ce formulaire.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-1 flex flex-col gap-4">
          <InputField id="nom" label="Nom" placeholder="Votre nom" value={form.nom} onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void} />
          <InputField id="email" label="Email" type="email" placeholder="Votre email" value={form.email} onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void} />
          <InputField id="objet" label="Objet" placeholder="L'objet du message" value={form.objet} onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void} />
        </div>

        <div className="flex-[1.4] flex flex-col gap-1.5">
          <label htmlFor="message" className="text-white/60 text-sm font-medium">Message</label>
          <textarea
            id="message"
            required
            placeholder="Votre message..."
            value={form.message}
            onChange={handleChange}
            className="flex-1 min-h-45 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-naruto-orange/50 transition-all resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
        />
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={submitting || !captchaToken}
          className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full font-semibold text-sm bg-naruto-orange hover:bg-[#e65500] text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
        >
          {submitting ? "Envoi…" : "Envoyer le message"}
        </button>
      </div>
    </form>
  );
}
