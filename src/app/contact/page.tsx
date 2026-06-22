import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Envoyez-nous vos questions ou remarques via ce formulaire de contact.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-1 justify-center items-start md:items-center py-12 px-4 fade-in-up">
      <ContactForm />
    </div>
  );
}
