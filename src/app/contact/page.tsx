import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import PageHero from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Envoyez-nous vos questions ou remarques via ce formulaire de contact.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen text-white -mt-16 pt-16">
      <PageHero
        eyebrow="Contact"
        title="Me Joindre"
        description="Une question sur l'univers Naruto, une suggestionn un report de bugs ou juste envie de discuter ? Mon parchemin est ouvert."
      />

      <ContactForm />
    </main>
  );
}
