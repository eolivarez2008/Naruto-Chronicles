const JIKAN_API = "https://api.jikan.moe/v4";

export const SAGA_CONFIG = {
  naruto: { id: 20, type: "anime", label: "Naruto" },
  shippuden: { id: 1735, type: "anime", label: "Naruto Shippuden" },
  boruto: { id: 34566, type: "anime", label: "Boruto" },
  tbv: { id: 160786, type: "manga", label: "Two Blue Vortex" },
} as const;

export interface SagaData {
  key: string;
  label: string;
  synopsisFr: string;
  image: string;
  status: string;
  score: number | string;
  creator: string;
  total: number | string;
  year: number | string;
  keyType: "anime" | "manga";
}

const STORIES_FR: Record<string, string> = {
  naruto:
    "Douze ans après l'attaque du Démon Renard à Neuf Queues sur Konoha, le jeune orphelin Naruto Uzumaki grandit dans la solitude, ignorant qu'il porte en lui le monstre qui a ravagé son village. Rejeté par tous, il multiplie les bêtises pour attirer l'attention. Son rêve est immense : devenir Hokage pour obtenir enfin le respect de ses pairs. Accompagné de l'équipe 7, il entame son apprentissage sous la tutelle de Kakashi.",
  shippuden:
    "Après deux ans d'entraînement intensif avec Jiraya, Naruto revient à un Konoha plus mature mais menacé. L'organisation criminelle Akatsuki passe à l'offensive pour capturer les démons à queues et instaurer un nouvel ordre mondial. Naruto doit faire face à des pertes tragiques tout en perfectionnant ses techniques. La quête de vengeance de Sasuke l'éloigne de ses amis, menant à une confrontation inévitable lors de la Grande Guerre Ninja.",
  boruto:
    "Plus de quinze ans après la Grande Guerre, le monde ninja est entré dans une ère de paix technologique sous l'égide de Naruto, devenu Septième Hokage. Mais cette tranquillité pèse sur son fils, Boruto. Ressentant l'absence de son père, il cherche à prouver sa valeur par ses propres moyens. Cependant, l'ombre du clan Ôtsutsuki plane toujours, et une menace mystérieuse nommée Kara émerge pour briser cet équilibre fragile.",
  tbv: "Trois ans après le cataclysme de l'Omnipotence, Boruto est devenu un fugitif traqué par le monde entier, Kawaki ayant pris sa place au sein de Konoha. Devenu plus puissant après son exil avec Sasuke, Boruto revient pour protéger le village de nouvelles menaces divines : les Sentinelles de l'Arbre Divin. Accusé du meurtre de son père, il doit naviguer entre trahison et devoir pour restaurer la vérité et sauver le futur des shinobis.",
};

export async function getSagaData(
  sagaKey: keyof typeof SAGA_CONFIG,
): Promise<SagaData | null> {
  const { id, type } = SAGA_CONFIG[sagaKey];

  try {
    const res = await fetch(`${JIKAN_API}/${type}/${id}/full`, {
      next: { revalidate: 86400 },
    });

    if (res.status === 429) {
      console.error(`Rate limit atteint pour ${sagaKey}`);
      return null;
    }

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.data) return null;

    return formatData(json.data, sagaKey);
  } catch (e) {
    console.error(`Erreur réseau Jikan (${sagaKey}):`, e);
    return null;
  }
}

function formatData(data: any, sagaKey: keyof typeof SAGA_CONFIG): SagaData {
  const statusFr =
    data.status === "Finished Airing" || data.status === "Finished"
      ? "Terminé"
      : "En cours";

  let creator = "-";
  if (data.authors && data.authors.length > 0) {
    creator = data.authors[0].name.split(", ").reverse().join(" ");
  } else if (data.studios && data.studios.length > 0) {
    creator = data.studios[0].name;
  } else {
    creator = "Masashi Kishimoto";
  }

  return {
    key: sagaKey,
    label: SAGA_CONFIG[sagaKey].label,
    synopsisFr: STORIES_FR[sagaKey] || data.synopsis || "-",
    image: data.images.jpg.large_image_url,
    status: statusFr,
    score: data.score ?? "-",
    creator: creator,
    total: data.episodes || data.chapters || "-",
    year:
      data.aired?.prop?.from?.year ?? data.published?.prop?.from?.year ?? "-",
    keyType: SAGA_CONFIG[sagaKey].type,
  };
}
