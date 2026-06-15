# Naruto Chronicles – Website

Bienvenue sur le dépôt du **site web Naruto** créé par Emilien.

**Naruto Chronicles** est un site web dédié à l’univers de Naruto. Initialement lancé en **2023** en HTML/CSS pur, le projet a évolué en **2026** vers une architecture moderne sous **Next.js**.

Ce site propose une immersion dans le monde de **Naruto**, à travers différentes rubriques :

- **Histoire** : pour comprendre les grandes lignes du récit.
- **Personnages** : présentation de tous les ninjas, invocations et démons a queues.
- **Saga** : une présentation structurée de la collection Naruto
- **Contact** : formulaire pour vos remarques ou suggestions.

---

## Architecture du Projet

Ce projet est organisé en deux branches distinctes pour séparer l'évolution technique :

- **`react-version` (Main)** : La version actuelle et performante. Développée avec **Next.js (App Router)**, optimisée pour le SEO, la rapidité et le design, toujours en cours de développement.
- **`vanilla`** : L'archive historique du projet. Entièrement réalisée en **HTML5/CSS3/JS natif**. Idéal pour consulter les bases du développement web.

---

## Déploiement & Architecture

Le projet est containerisé avec **Docker** et auto-hébergé sur une VM via un reverse-proxy **Nginx**.

- **Infrastructure** : Docker & Docker Compose
- **Reverse Proxy** : Nginx (Reverse Proxy)
- **Tunneling & Sécurité** : Cloudflare Tunnel (Zero Trust / SSL Automatique)
- **CI/CD** : Déploiement manuel via Git & Docker Compose

**Accès au site :** [https://naruto.eolivarez.site](https://naruto.eolivarez.site)

---

## Stack Technique

Le projet s’appuie sur un environnement **full-stack React moderne**, orienté performance, typage strict et déploiement optimisé Edge.

- **Framework** : [Next.js 16](https://nextjs.org/) — App Router, Server Components, API Routes
- **Langage** : [TypeScript](https://www.typescriptlang.org/) — Typage strict, interfaces centralisées
- **Styling** : [Tailwind CSS](https://tailwindcss.com/) — Design system cohérent, responsive natif
- **Animations** : [Framer Motion](https://www.framer.com/motion/) — Transitions fluides, layout animations
- **Icônes** : [Lucide React](https://lucide.dev/) — SVG optimisés, tree-shaking compatible
- **Analytics** : [Umami](https://umami.is/) — Auto-hébergé, sans cookie, RGPD compliant
- **Hébergement** : [Docker](https://www.docker.com/) — Containerisation, auto-hébergé sur VM Debian dédiée
- **Réseau** : [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) — Zero Trust, SSL automatique, protection DDoS
- **Formulaire** : [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) — Anti-bot sans friction
- **Notifications** : [Discord Webhooks](https://discord.com/developers/docs/resources/webhook) — Réception des formulaires de contact

---

## Installation et Configuration

### 1 — Cloner le projet

```bash
git clone https://github.com/eolivarez2008/Naruto-Chronicles.git
cd Naruto-Chronicles
```

### 2 — Installer les dépendances

```bash
npm install
```

### 3 — Configurer les variables d'environnement

```bash
# Copier le fichier et remplacer les variables par les siennes
cp .env.example .env
```

### 4 — Lancer en développement

```bash
npm run dev
```

Le projet sera accessible sur `http://localhost:3000`

## Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Vérification ESLint
```

---

## Déploiement Docker

```bash
# Build et démarrage
docker compose up -d --build

# Logs
docker logs portfolio --tail 50

# Arrêt
docker compose down
```

---

## Auteur

Développé par **Emilien Olivarez** – Étudiant en Bac Pro CIEL
Lycée Louis de Cormontaigne, Metz

---

## Licence

Ce projet est sous licence **Apache 2.0**.  
Tu peux :

- utiliser librement le code,
- le modifier,
- le distribuer,
- même à usage commercial,  
  tant que tu respectes les conditions de la [licence Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0).
