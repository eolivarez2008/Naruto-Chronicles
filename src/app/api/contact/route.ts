import { NextResponse } from "next/server";

const DISCORD_CONTACT_WEBHOOK_URL = process.env.DISCORD_CONTACT_WEBHOOK_URL;
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: ip,
      }),
    },
  );
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

function buildDiscordPayload(
  name: string,
  email: string,
  subject: string,
  message: string,
) {
  return {
    username: "Naruto Contact",
    content: "<@&1483836726429356123> Nouveau message de contact reçu !",
    embeds: [
      {
        title: "Nouveau message reçu",
        color: 0xff6600,
        fields: [
          { name: "Nom", value: name, inline: true },
          { name: "Email", value: `[${email}](mailto:${email})`, inline: true },
          { name: "Objet", value: subject, inline: false },
          {
            name: "Message",
            value:
              message.length > 1024 ? message.slice(0, 1021) + "..." : message,
          },
        ],
        footer: { text: "Naruto · Formulaire de contact" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function POST(req: Request) {
  if (!DISCORD_CONTACT_WEBHOOK_URL) {
    console.error("[contact] DISCORD_CONTACT_WEBHOOK_URL manquant");
    return NextResponse.json(
      { error: "Configuration serveur incorrecte." },
      { status: 500 },
    );
  }

  let body: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    captchaToken?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const { name, email, message, subject, captchaToken } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Tous les champs sont requis." },
      { status: 400 },
    );
  }
  if (name.length > 100 || message.length > 1000) {
    return NextResponse.json(
      { error: "Données trop longues." },
      { status: 400 },
    );
  }
  if (!subject?.trim()) {
    return NextResponse.json({ error: "Objet requis." }, { status: 400 });
  }
  if (subject.length > 100) {
    return NextResponse.json({ error: "Objet trop long." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  if (TURNSTILE_SECRET) {
    if (!captchaToken) {
      return NextResponse.json(
        { error: "Vérification de sécurité manquante." },
        { status: 400 },
      );
    }
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for") ??
      "unknown";
    const valid = await verifyTurnstile(captchaToken, ip);
    if (!valid) {
      return NextResponse.json(
        { error: "Vérification de sécurité échouée." },
        { status: 400 },
      );
    }
  }

  const discordRes = await fetch(DISCORD_CONTACT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildDiscordPayload(
        name.trim(),
        email.trim(),
        subject.trim(),
        message.trim(),
      ),
    ),
  });

  if (!discordRes.ok) {
    const discordError = await discordRes.text();
    console.error("[contact] Discord webhook error:", discordError);
    return NextResponse.json(
      { error: "Impossible d'envoyer le message." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
