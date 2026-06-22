import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[75vh] text-center px-6 gap-6">
      <span className="text-8xl font-bold text-white/5 select-none" style={{ fontFamily: "'Syne', sans-serif" }}>
        404
      </span>
      <div className="-mt-8">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          Page introuvable
        </h1>
        <p className="text-white/40 text-sm mt-2">
          La page que vous recherchez n&rsquo;existe pas ou a été déplacée.
        </p>
      </div>
      <Link
        href="/"
        data-umami-event="404-back-to-home"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm bg-naruto-orange hover:bg-[#e65500] text-white transition-all hover:scale-105"
      >
        ← Retour à l&rsquo;accueil
      </Link>
    </div>
  );
}
