import { prisma } from "./db";

const JIKAN_API = "https://api.jikan.moe/v4";
const ADMIN_WEBHOOK = process.env.DISCORD_ADMIN_WEBHOOK_URL;
const ADMIN_ROLE_ID = "1483836726429356123";

const SAGA_CONFIG = [
  { key: "naruto", id: 20, type: "anime", label: "Naruto" },
  { key: "shippuden", id: 1735, type: "anime", label: "Naruto Shippuden" },
  { key: "boruto", id: 34566, type: "anime", label: "Boruto" },
  { key: "tbv", id: 160786, type: "manga", label: "Two Blue Vortex" },
];

const STORIES_FR: Record<string, string> = {
  naruto:
    "Douze ans après l'attaque du Démon Renard à Neuf Queues sur Konoha, le jeune orphelin Naruto Uzumaki grandit dans la solitude, ignorant qu'il porte en lui le monstre qui a ravagé son village. Rejeté par tous, il multiplie les bêtises pour attirer l'attention. Son rêve est immense : devenir Hokage pour obtenir enfin le respect de ses pairs. Accompagné de l'équipe 7, il entame son apprentissage sous la tutelle de Kakashi.",
  shippuden:
    "Après deux ans d'entraînement intensif avec Jiraya, Naruto revient à un Konoha plus mature mais menacé. L'organisation criminelle Akatsuki passe à l'offensive pour capturer les démons à queues et instaurer un nouvel ordre mondial. Naruto doit faire face à des pertes tragiques tout en perfectionnant ses techniques. La quête de vengeance de Sasuke l'éloigne de ses amis, menant à une confrontation inévitable lors de la Grande Guerre Ninja.",
  boruto:
    "Plus de quinze ans après la Grande Guerre, le monde ninja est entré dans une ère de paix technologique sous l'égide de Naruto, devenu Septième Hokage. Mais cette tranquillité pèse sur son fils, Boruto. Ressentant l'absence de son père, il cherche à prouver sa valeur par ses propres moyens. Cependant, l'ombre du clan Ôtsutsuki plane toujours, et une menace mystérieuse nommée Kara émerge pour briser cet équilibre fragile.",
  tbv: "Trois ans après le cataclysme de l'Omnipotence, Boruto est devenu un fugitif traqué par le monde entier, Kawaki ayant pris sa place au sein de Konoha. Devenu plus puissant après son exil avec Sasuke, Boruto revient pour protéger le village de nouvelles menaces divines : les Sentinelles de l'Arbre Divin. Accusé du meurtre de son père, il doit naviguer entre trahison et devoir pour restaurer la vérité et sauver le futur des shinobis.",
};

async function sendErrorNotification(errors: string[]) {
  if (!ADMIN_WEBHOOK) return;

  const payload = {
    content: `<@&${ADMIN_ROLE_ID}>`,
    embeds: [
      {
        title: "❌ Échec de la Synchronisation Sagas",
        description: `Le script de maintenance a rencontré des erreurs :\n\n${errors.map((err) => `• ${err}`).join("\n")}`,
        color: 0xff4747,
        timestamp: new Date().toISOString(),
        footer: { text: "Naruto Chronicles - Système de Monitoring" },
      },
    ],
  };

  try {
    await fetch(ADMIN_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Impossible d'envoyer la notification Discord:", err);
  }
}

export async function syncSagas() {
  console.log("🚀 Début de la synchronisation...");
  const errorLog: string[] = [];

  for (const saga of SAGA_CONFIG) {
    try {
      const res = await fetch(`${JIKAN_API}/${saga.type}/${saga.id}/full`);
      if (!res.ok) throw new Error(`Jikan Error: ${res.status}`);

      const { data } = await res.json();

      let creator = "Masashi Kishimoto";
      if (data.authors?.length) {
        creator = data.authors[0].name.split(", ").reverse().join(" ");
      } else if (data.studios?.length) {
        creator = data.studios[0].name;
      }

      await prisma.saga.upsert({
        where: { key: saga.key },
        update: {
          score: data.score,
          status:
            data.status === "Finished" || data.status === "Finished Airing"
              ? "Terminé"
              : "En cours",
          total: data.episodes || data.chapters,
          lastUpdated: new Date(),
        },
        create: {
          key: saga.key,
          jikanId: saga.id,
          type: saga.type,
          label: saga.label,
          synopsisFr:
            STORIES_FR[saga.key as keyof typeof STORIES_FR] || "À venir",
          image: data.images.jpg.large_image_url,
          status:
            data.status === "Finished" || data.status === "Finished Airing"
              ? "Terminé"
              : "En cours",
          score: data.score,
          creator: creator,
          total: data.episodes || data.chapters,
          year:
            data.aired?.prop?.from?.year ?? data.published?.prop?.from?.year,
        },
      });

      console.log(`✅ ${saga.label} synchronisé.`);
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e: any) {
      console.error(`❌ Erreur sur ${saga.key}:`, e);
      errorLog.push(`${saga.label} : ${e.message}`);
    }
  }

  if (errorLog.length > 0) {
    await sendErrorNotification(errorLog);
  } else {
    console.log("✨ Synchronisation terminée sans erreur.");
  }
}
