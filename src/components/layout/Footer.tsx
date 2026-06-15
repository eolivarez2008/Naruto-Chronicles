import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-white/8 bg-black/60 backdrop-blur-sm py-8 mt-16">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
        <p>
          © 2023–2026{" "}
          <span className="text-white/70 font-semibold">Naruto Chronicles</span>{" "}
          — Tous droits réservés.
        </p>
        <p>
          Développé par <span className="text-white/70">Emilien Olivarez</span>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/eolivarez2008/Naruto-Chronicles"
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="footer-github-click"
            className="hover:text-naruto-orange transition-colors"
          >
            GitHub
          </a>
          <span className="text-white/20">|</span>
          <Link
            href="/contact"
            data-umami-event="footer-contact-click"
            className="hover:text-naruto-orange transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
