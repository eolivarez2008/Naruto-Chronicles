<div align="center">

# Naruto Chronicles

A full-stack website dedicated to the Naruto universe, rebuilt in 2026 from a vanilla HTML/CSS project into a modern Next.js application.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Tunnel-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/tunnel/)

**[Live Website](https://naruto.eolivarez.site)**

</div>

---

## Project Status: Completed & Maintained

This project is fully finalized and operational. No new features or major upgrades are planned. However, I regularly monitor the platform to perform routine maintenance, check dependencies, and patch any runtime bugs.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Deployment & Infrastructure](#deployment--infrastructure)
- [Getting Started](#getting-started)
- [License](#license)

---

## Overview

**Naruto Chronicles** is a full-stack web platform exploring the Naruto universe through dynamic, API-driven content. Originally built in **2023** as a static HTML/CSS site, the project was fully rebuilt in **2026** under **Next.js (App Router)** to deliver a modern, performant, and scalable experience.

---

## Features

- **Story** — narrative arcs automatically extracted via the MediaWiki API for an accurate chronological timeline.
- **Characters** — detailed character sheets built from a multi-source merge, synchronized with MyAnimeList popularity scores via Jikan.
- **Videos** — automatic aggregation of thematic YouTube content with an interaction system (likes).
- **Tierlists** — tool for creating custom rankings and browsing community tierlists.
- **Saga** — dynamic collection showcase including real-time statistics and scores via the Jikan API.
- **Contact** — dedicated form for user suggestions and feedback.
- **Profile** — personal space centralizing liked videos and created or saved tierlists.

---

## Tech Stack

- **Framework & Logic:** [Next.js 16](https://nextjs.org/) (App Router, Server Components, API Routes) paired with strict [TypeScript](https://www.typescriptlang.org/) for type safety and centralized interfaces.
- **Database & ORM:** SQLite database management structured through [Prisma 6](https://www.prisma.io/).
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) handling secure sessions integrated with [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2).
- **UI & Animations:** [Tailwind CSS](https://tailwindcss.com/) for a utility-first responsive design system, [Framer Motion](https://www.framer.com/motion/) for smooth layout animations, and [Lucide React](https://lucide.dev/) for optimized tree-shakable icons.
- **Data Engineering & APIs:** Multi-source mashup engine leveraging the [MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page) (lore extraction), [YouTube Data API v3](https://developers.google.com/youtube/v3) (video aggregation), [Jikan API](https://jikan.moe/) (MyAnimeList stats), and dedicated community repositories (`narutodb-website`, `naruto-api`, `Dattebayo API`).
- **AI Integration:** [OpenAI API](https://openai.com/api/) workflows utilizing GPT models for automated asynchronous content translation.

---

## Deployment & Infrastructure

While the core application handles complex full-stack features, the production deployment incorporates modern network, system administration, and security practices:

- **Web Server & Database:** Built Next.js production server communicating with a local embedded SQLite instance via Prisma ORM.
- **Containerization:** The entire stack and its environments are fully containerized and automated using **Docker** and **Docker Compose**, self-hosted on a dedicated **Debian VM**.
- **Zero Trust Network:** Securely exposed using a **Cloudflare Tunnel (Zero Trust)**. This architecture allows secure hosting without opening any inbound ports on the local host firewall, providing native DDoS mitigation and automated SSL/TLS certificate management.
- **Bot Mitigation:** [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) integration for frictionless anti-bot security on public forms.
- **Ops Monitoring:** [Discord Webhooks](https://discord.com/developers/docs/resources/webhook) routing runtime system event telemetry and contact form notifications directly to dedicated channels.
- **Privacy-First Analytics:** Integration of a self-hosted, cookie-less, GDPR-compliant instance of [Umami](https://umami.is/).

---

## Getting Started

### Development (Local Run)

1. Clone the repository:

```bash
git clone https://github.com/eolivarez2008/Naruto-Chronicles.git
cd Naruto-Chronicles
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Set up the database:

```bash
npx prisma db push
npx prisma generate
npx tsx prisma/seed.ts
```

4. Start the development server:

```bash
npm run dev
```

The site will be available at `http://localhost:3000`.

### Available Scripts

#### Development

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint linting
```

#### Database (Prisma)

```bash
npx prisma db push                  # Sync SQLite schema
npx prisma generate                 # Generate Prisma client
npx tsx prisma/seed.ts              # Full database seed
npx tsx scripts/translate-arcs.ts   # Translate story arcs
```

Seed flags can be combined freely:

```bash
npx tsx prisma/seed.ts --skip-characters --skip-sagas --skip-videos --skip-story
```

| Flag                | Description                |
| ------------------- | -------------------------- |
| `--skip-characters` | Skip character seeding     |
| `--skip-sagas`      | Skip saga seeding          |
| `--skip-videos`     | Skip YouTube video seeding |
| `--skip-story`      | Skip story arc seeding     |

#### Scheduled Sync (CRON)

```bash
npm run cron:daily       # Full content sync
npm run cron:sagas       # Saga statistics
npm run cron:videos      # YouTube videos
npm run cron:characters  # Character popularity
```

### Production Deployment (Docker)

```bash
docker compose up -d --build     # Build and start
docker logs portfolio --tail 50  # View logs
docker compose down              # Stop
```

---

## License

Distributed under the **Apache 2.0 License** — see [LICENSE](LICENSE) for details.
