import type { Saga } from "@/types";

export const SAGAS: Saga[] = [
  {
    id: "naruto",
    title: "Naruto",
    description:
      "Un ninja intrépide au rêve immense : devenir le Hokage, le chef de son village. Orphelin rejeté, Naruto porte en lui le démon-renard Kurama, mais son cœur pur et sa détermination sans faille font de lui un héros incontesté. À travers ses aventures, il se forge des liens forts avec ses amis, surmontant chaque obstacle avec courage et optimisme. Toujours prêt à défendre ceux qu'il aime, Naruto incarne l'espoir, la persévérance et la force de croire en ses rêves.",
    image: "/affiches/affiche naruto.webp",
    imageAlt: "Naruto",
    externalUrl: "https://www.manga-news.com/index.php/serie/Naruto",
    umamiSaga: "naruto",
    underlineWidth: "w-20",
  },
  {
    id: "shippuden",
    title: "Naruto Shippuden",
    description:
      "Dans Naruto Shippuden, Naruto revient plus fort après deux ans d'entraînement. Il doit affronter l'Akatsuki, une organisation criminelle qui cherche à capturer les démons à queues. Confronté à des ennemis puissants et des choix difficiles, Naruto se bat pour la paix et pour protéger ses amis et son village, tout en découvrant des vérités sur son passé et son destin.",
    image: "/affiches/affiche naruto shippudden.jpg",
    imageAlt: "Naruto Shippuden",
    externalUrl: "https://www.manga-news.com/index.php/dvd/Naruto-Shippuden",
    umamiSaga: "naruto-shippuden",
    underlineWidth: "w-48",
  },
  {
    id: "boruto",
    title: "Boruto — Next Generations",
    description:
      "Boruto : Naruto Next Generations suit les aventures de Boruto Uzumaki, le fils de Naruto, devenu Hokage. Boruto, fatigué de vivre dans l'ombre de son père, cherche à tracer son propre chemin dans un monde où la technologie moderne rencontre le ninjutsu traditionnel. Son parcours est un mélange de rébellion, de découvertes et de croissance personnelle.",
    image: "/affiches/affiche boruto.jpg",
    imageAlt: "Boruto",
    externalUrl:
      "https://www.manga-news.com/index.php/serie/Boruto-Naruto-Next-Generations",
    umamiSaga: "boruto-next-generations",
    underlineWidth: "w-64",
  },
  {
    id: "vortex",
    title: "Boruto Two Blue Vortex",
    description:
      "Boruto : Two Blue Vortex se déroule plusieurs années après les événements de Boruto : Naruto Next Generations. Le monde ninja a changé, et Boruto, maintenant adulte, se retrouve face à des enjeux plus grands. Après la perte de Naruto et des bouleversements à Konoha, Boruto doit porter le poids de son héritage face à des ennemis plus redoutables que jamais.",
    image: "/affiches/affiche boruto_two_blue_vortex.png",
    imageAlt: "Boruto Two Blue Vortex",
    externalUrl:
      "https://www.manga-news.com/index.php/serie/Boruto-Two-Blue-Vortex",
    umamiSaga: "two-blue-vortex",
    underlineWidth: "w-56",
  },
];
