# Naruto Chronicles – Website

Bienvenue sur le dépôt du **site web Naruto** créé par Emilien.

**Naruto Chronicles** est une plateforme immersive dédiée à l'univers de Naruto. Lancé en **2023** en HTML/CSS, le projet a été intégralement refondu en **2026** sous Next.js pour offrir une expérience dynamique et performante à travers différentes rubriques :

- **Histoire** : exploration des arcs narratifs récupérés via l'API MediaWiki pour une chronologie fidèle de l'œuvre.
- **Personnages** : fiches détaillées issues d'un merge multi-sources, synchronisées avec les scores de popularité MyAnimeList via Jikan.
- **Vidéos** : agrégation automatique de contenus YouTube thématiques avec système d'interactions (likes).
- **Tierlists** : outil de création de classements personnalisés et exploration des tierlists de la communauté.
- **Saga** : présentation dynamique de la collection, incluant les statistiques et scores en temps réel via l'API Jikan.
- **Contact** : formulaire dédié aux suggestions et remarques des utilisateurs.
- **Profil** : espace personnel centralisant les vidéos likées ainsi que les tierlists créées et aimées.

---

## Architecture du Projet

Ce projet est organisé en deux branches distinctes pour séparer l'évolution technique :

- **`react-version` (Main)** : version actuelle basée sur **Next.js (App Router)**, optimisée performance, SEO et UI moderne.
- **`vanilla`** : archive historique en **HTML / CSS / JS natif**, pour consulter les bases du projet.

---

## Déploiement & Infrastructure

Le projet est containerisé et auto-hébergé.

- **Containerisation** : Docker + Docker Compose
- **Hébergement** : VM Debian
- **Tunnel sécurisé** : Cloudflare Tunnel (Zero Trust + SSL automatique)
- **CI/CD** : déploiement manuel via Git + Docker
- **Base de données** : SQLite (via Prisma ORM)

**Accès au site :** https://naruto.eolivarez.site

---

## Stack Technique

Le projet s'appuie sur un environnement **full-stack React moderne**, orienté performance, typage strict et déploiement optimisé Edge.

- **Framework** : [Next.js 16](https://nextjs.org/) — App Router, Server Components, API Routes
- **ORM** : [Prisma 6](https://www.prisma.io/) — Gestion de la base de données SQLite
- **Langage** : [TypeScript](https://www.typescriptlang.org/) — Typage strict, interfaces centralisées
- **Styling** : [Tailwind CSS](https://tailwindcss.com/) — Design system cohérent, responsive natif
- **Animations** : [Framer Motion](https://www.framer.com/motion/) — Transitions fluides, layout animations
- **Icônes** : [Lucide React](https://lucide.dev/) — SVG optimisés, tree-shaking compatible
- **Analytics** : [Umami](https://umami.is/) — Auto-hébergé, sans cookie, RGPD compliant
- **Hébergement** : [Docker](https://www.docker.com/) — Containerisation via Docker Compose, auto-hébergé sur VM Debian dédiée
- **Réseau** : [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) — Zero Trust, SSL automatique, protection DDoS
- **Formulaire** : [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) — Anti-bot sans friction
- **Notifications** : [Discord Webhooks](https://discord.com/developers/docs/resources/webhook) — Alertes de monitoring et réception des formulaires de contact
- **Authentification OAuth** : [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2?hl=fr) — Connexion utilisateur sécurisée
- **Auth Backend** : [NextAuth.js](https://next-auth.js.org/) — Gestion des sessions, providers OAuth et sécurité
- **Données (seed & synchronisation)** :
  - [MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page) — Extraction automatisée des arcs narratifs pour la section Story
  - [narutodb-website](https://github.com/sriniously/narutodb-website) — Source principale : données structurées (rangs, famille, débuts)
  - [naruto-api](https://github.com/gustavonobreza/naruto-api) — Complément : jutsus, natures de chakra
  - [Dattebayo API](https://dattebayo-api.onrender.com) — Fallback et données supplémentaires
  - [Jikan API](https://jikan.moe/) — Scores de popularité MyAnimeList et statistiques des sagas
  - [YouTube Data API v3](https://developers.google.com/youtube/v3/getting-started?hl=fr) — Récupération automatique des vidéos (chaînes, stats, thumbnails)
- **Maintenance** :
  - [tsx](https://tsx.is/) — Exécution des scripts de seed et de synchronisation quotidienne TypeScript
  - [OpenAI API](https://openai.com/api/) — Traduction automatisée des contenus (arcs narratifs) via GPT.

---

## Installation et Configuration

### 1 — Cloner le projet

```bash
git clone https://github.com/eolivarez2008/Naruto-Chronicles.git
cd Naruto-Chronicles
npm install
```

### 2 — Variables d'environnement

```bash
cp .env.example .env
```

### 3 — Base de données

```bash
npx prisma db push
npx prisma generate
npx tsx prisma/seed.ts
```

### 4 — Lancer le projet

```bash
npm run dev
```

Accès : [http://localhost:3000](http://localhost:3000)

---

## Scripts disponibles

### Développement

```bash
npm run dev        # Serveur de développement
npm run build      # Build production
npm run start      # Serveur production
npm run lint       # Linting ESLint
```

### Base de données (Prisma)

```bash
npx prisma db push                  # Sync schéma SQLite
npx prisma generate                 # Génération Prisma client
npx tsx prisma/seed.ts              # Seed complet base de données
npx tsx scripts/translate-arcs.ts   # Traduction des arcs
```

Les options peuvent être combinées librement :

```Bash
npx tsx prisma/seed.ts --skip-characters --skip-sagas --skip-videos --skip-story
```

Détail des flags :

- **--skip-characters** : ignore les personnages
- **--skip-sagas** : ignore les sagas
- **--skip-videos** : ignore les vidéos YouTube
- **--skip-story** : ignore l’histoire

### Synchronisation automatique (CRON)

```bash
npm run cron:daily       # Sync globale (contenu complet)
npm run cron:sagas       # Stats des sagas
npm run cron:videos      # Vidéos YouTube
npm run cron:characters  # Popularité personnages
```

---

## Déploiement Docker

```bash
docker compose up -d --build     # Build et démarrage
docker logs portfolio --tail 50  # Logs
docker compose down              # Arrêt
```

---

## Auteur

Développé par **Emilien Olivarez** – Étudiant en Bac Pro CIEL  
Lycée Louis de Cormontaigne, Metz

---

## Licence

Ce projet est sous licence **MIT**.  
Tu peux :

- utiliser librement le code,
- le modifier,
- le distribuer,
- même à usage commercial,

tant que tu respectes les conditions de la [licence MIT](https://opensource.org/license/MIT).
