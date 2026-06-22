# Naruto Chronicles – Website

Bienvenue sur le dépôt du **site web Naruto** créé par Emilien.

**Naruto Chronicles** est un site web dédié à l'univers de Naruto. Initialement lancé en **2023** en HTML/CSS pur, le projet a évolué en **2026** vers une architecture moderne sous **Next.js**.

Ce site propose une immersion dans le monde de **Naruto**, à travers différentes rubriques :

- **Histoire** : pour comprendre les grandes lignes du récit.
- **Personnages** : une présentation dynamique des personnages de Naruto, synchronisée en temps réel avec le score de popularité de MyAnimeList via l'API Jikan.
- **Saga** : une présentation dynamique de la collection Naruto, synchronisée en temps réel avec les scores et statistiques de MyAnimeList via l'API Jikan.
- **Vidéos** : agrégation automatique de contenu YouTube, mise à jour quotidienne et interactions utilisateurs (likes)
- **Contact** : formulaire pour vos remarques ou suggestions.

---

## Architecture du Projet

Ce projet est organisé en deux branches distinctes pour séparer l'évolution technique :

- **`react-version` (Main)** : la version actuelle et performante. Développée avec **Next.js (App Router)**, optimisée pour le SEO, la rapidité et le design, toujours en cours de développement.
- **`vanilla`** : l'archive historique du projet. Entièrement réalisée en **HTML5/CSS3/JS natif**. Idéal pour consulter les bases du développement web.

---

## Déploiement & Architecture

Le projet est containerisé avec **Docker** et auto-hébergé sur une VM via **Cloudflare Tunnel**.

- **Infrastructure** : Docker & Docker Compose
- **Tunneling & Sécurité** : Cloudflare Tunnel (Zero Trust / SSL automatique)
- **CI/CD** : déploiement manuel via Git & Docker Compose
- **Base de données** : SQLite (local) géré par Prisma ORM

**Accès au site :** [https://naruto.eolivarez.site](https://naruto.eolivarez.site)

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
  - [narutodb-website](https://github.com/sriniously/narutodb-website) — Source principale : données structurées (rangs, famille, débuts)
  - [naruto-api](https://github.com/gustavonobreza/naruto-api) — Complément : jutsus, natures de chakra
  - [Dattebayo API](https://dattebayo-api.onrender.com) — Fallback et données supplémentaires
  - [Jikan API](https://jikan.moe/) — Scores de popularité MyAnimeList
  - [YouTube Data API v3](https://developers.google.com/youtube/v3/getting-started?hl=fr) — Récupération automatique des vidéos (chaînes, stats, thumbnails)
- **Maintenance** : [tsx](https://tsx.is/) — Exécution des scripts de seed et de synchronisation quotidienne TypeScript

---

## Installation et Configuration

### 1 — Cloner et installer

```bash
git clone https://github.com/eolivarez2008/Naruto-Chronicles.git
cd Naruto-Chronicles
npm install
```

### 2 — Configurer les variables d'environnement

```bash
# Copier le fichier et remplacer les variables par les siennes
cp .env.example .env
```

### 3 — Initialiser la base de données

```bash
# Générer le client Prisma et créer la base SQLite
npm run db:push

# Régénération du client Prisma
npm run db:generate

# Peupler la base (sources + api)
npm run db:seed
```

### 4 — Lancer en développement

```bash
npm run dev
```

Le projet sera accessible sur `http://localhost:3000`

---

## Scripts disponibles

```bash
npm run dev                    # Serveur de développement
npm run build                  # Build production
npm run start                  # Serveur production
npm run lint                   # Vérification ESLint
npm run db:push                # Synchronisation du schéma Prisma avec la DB
npm run db:generate            # Régénération du client Prisma
npm run db:seed                # Initialisation complète de la base de données
npm run cron:daily             # Synchronisation quotidienne (personnages + sagas + vidéos)
npm run cron:sagas             # Mise à jour des statistiques des sagas
npm run cron:videos            # Mise à jour et récupération des vidéos YouTube
npm run cron:characters        # Mise à jour des popularités des personnages
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
