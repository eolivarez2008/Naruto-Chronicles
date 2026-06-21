import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales & Confidentialité",
  description:
    "Politique de confidentialité et mentions légales de Naruto Chronicles.",
};

export default function LegalPage() {
  const lastUpdated = "15 avril 2026";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 fade-in-up">
      <div className="mb-8">
        <span className="text-naruto-orange text-xs font-bold tracking-[0.2em] uppercase">
          Légal
        </span>
        <h1 className="text-3xl font-black text-white mt-1">
          Mentions légales & Confidentialité
        </h1>
        <div className="accent-line w-24" />
        <p className="text-white/30 text-xs">
          Dernière mise à jour : {lastUpdated}
        </p>
      </div>

      <div className="space-y-10 text-white/65 text-sm leading-relaxed">
        {/* ── Mentions légales ── */}
        <section>
          <h2 className="text-base font-bold text-white mb-3">
            1. Mentions légales
          </h2>
          <div className="space-y-2">
            <p>
              <span className="text-white/40">Éditeur :</span> Emilien Olivarez
              — étudiant en Bac Pro CIEL, Lycée Louis de Cormontaigne, Metz
              (57000)
            </p>
            <p>
              <span className="text-white/40">Hébergement :</span> Auto-hébergé
              sur serveur privé via Cloudflare Tunnel
            </p>
            <p>
              <span className="text-white/40">Contact :</span>{" "}
              <Link
                href="/contact"
                className="text-naruto-orange/80 hover:text-naruto-orange underline transition-colors"
              >
                Formulaire de contact
              </Link>
            </p>
            <p className="text-white/35 text-xs pt-2">
              Ce site est un projet personnel à caractère non commercial, dédié
              à l'univers fictif de Naruto. Naruto est une propriété de Masashi
              Kishimoto / Shueisha / Studio Pierrot. Ce site ne revendique aucun
              droit sur ces œuvres.
            </p>
          </div>
        </section>

        {/* ── Données collectées ── */}
        <section>
          <h2 className="text-base font-bold text-white mb-3">
            2. Données personnelles collectées
          </h2>
          <p className="mb-3">
            Conformément au Règlement Général sur la Protection des Données
            (RGPD — UE 2016/679), voici les données que nous collectons et
            pourquoi.
          </p>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/4 text-white/50">
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Donnée
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Finalité
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                <tr>
                  <td className="px-4 py-2.5 text-white/70">Nom Google</td>
                  <td className="px-4 py-2.5">Identifier le compte</td>
                  <td className="px-4 py-2.5">Jusqu'à suppression du compte</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-white/70">Adresse e-mail</td>
                  <td className="px-4 py-2.5">Authentification unique</td>
                  <td className="px-4 py-2.5">Jusqu'à suppression du compte</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-white/70">Photo de profil</td>
                  <td className="px-4 py-2.5">Affichage dans l'interface</td>
                  <td className="px-4 py-2.5">Jusqu'à suppression du compte</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-white/70">Likes de vidéos</td>
                  <td className="px-4 py-2.5">Fonctionnalité communautaire</td>
                  <td className="px-4 py-2.5">Jusqu'à suppression du compte</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-white/70">
                    Hash d'adresse IP
                  </td>
                  <td className="px-4 py-2.5">Anti-spam likes (anonymisée)</td>
                  <td className="px-4 py-2.5">Jusqu'à suppression du like</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-white/35 text-xs mt-3">
            Aucune donnée n'est vendue, partagée avec des tiers ou utilisée à
            des fins publicitaires.
          </p>
        </section>

        {/* ── Base légale ── */}
        <section>
          <h2 className="text-base font-bold text-white mb-3">
            3. Base légale du traitement
          </h2>
          <p>
            Le traitement repose sur le{" "}
            <strong className="text-white/80">consentement explicite</strong> de
            l'utilisateur (Article 6.1.a du RGPD), recueilli lors de la première
            connexion. Tu peux retirer ce consentement à tout moment en
            supprimant ton compte.
          </p>
        </section>

        {/* ── Droits ── */}
        <section>
          <h2 className="text-base font-bold text-white mb-3">
            4. Tes droits (RGPD)
          </h2>
          <div className="space-y-2">
            {[
              [
                "Droit d'accès (Art. 15)",
                "Toutes tes données sont visibles dans ton profil.",
              ],
              [
                "Droit de rectification (Art. 16)",
                "Modifie tes données directement via Google.",
              ],
              [
                "Droit à l'effacement (Art. 17)",
                "Supprime ton compte immédiatement depuis ton profil.",
              ],
              [
                "Droit à la portabilité (Art. 20)",
                "Contacte-nous pour recevoir tes données au format JSON.",
              ],
              [
                "Droit d'opposition (Art. 21)",
                "Déconnecte-toi et supprime ton compte.",
              ],
            ].map(([right, desc]) => (
              <div key={right} className="flex gap-3">
                <span className="text-naruto-orange mt-0.5 shrink-0">•</span>
                <div>
                  <span className="text-white/75 font-medium">{right}</span>
                  {" — "}
                  {desc}
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/35 text-xs mt-4">
            Pour exercer ces droits, contacte-nous via le{" "}
            <Link
              href="/contact"
              className="underline hover:text-white/55 transition-colors"
            >
              formulaire de contact
            </Link>
            . Délai de réponse : 30 jours maximum (RGPD Art. 12).
          </p>
        </section>

        {/* ── Cookies ── */}
        <section>
          <h2 className="text-base font-bold text-white mb-3">
            5. Cookies et sessions
          </h2>
          <p>
            Ce site utilise uniquement un cookie de session sécurisé (
            <code className="text-naruto-orange/80 text-xs bg-white/5 px-1 py-0.5 rounded">
              next-auth.session-token
            </code>
            ) nécessaire au fonctionnement de l'authentification. Ce cookie est{" "}
            <strong className="text-white/75">httpOnly</strong>,{" "}
            <strong className="text-white/75">Secure</strong> et{" "}
            <strong className="text-white/75">SameSite=Lax</strong>. Aucun
            cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
          <p className="mt-2">
            Les analytics sont assurés par{" "}
            <strong className="text-white/75">Umami</strong> (auto-hébergé, sans
            cookie, conforme RGPD).
          </p>
        </section>

        {/* ── Sécurité ── */}
        <section>
          <h2 className="text-base font-bold text-white mb-3">6. Sécurité</h2>
          <p>
            L'authentification est déléguée à Google OAuth 2.0. Nous ne stockons
            aucun mot de passe. Les communications sont chiffrées via HTTPS (TLS
            1.3) avec certificat automatique Cloudflare. Les adresses IP ne sont
            jamais stockées en clair — uniquement sous forme de hash SHA-256
            irréversible.
          </p>
        </section>

        {/* ── Contact DPO ── */}
        <section>
          <h2 className="text-base font-bold text-white mb-3">
            7. Contact & réclamation
          </h2>
          <p>
            Pour toute question relative à tes données personnelles :{" "}
            <Link
              href="/contact"
              className="text-naruto-orange/80 hover:text-naruto-orange underline transition-colors"
            >
              formulaire de contact
            </Link>
            .
          </p>
          <p className="mt-2">
            Si tu estimes que tes droits ne sont pas respectés, tu peux
            introduire une réclamation auprès de la{" "}
            <a
              href="https://www.cnil.fr/fr/plaintes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-naruto-orange/80 hover:text-naruto-orange underline transition-colors"
            >
              CNIL
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
