// Utilitaire d'envoi de notifications Discord pour tous les scripts cron

const WEBHOOK_URL = process.env.DISCORD_ADMIN_WEBHOOK_URL ?? "";
const ADMIN_ROLE_ID = "1483836726429356123";

export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

// Envoi d'un embed Discord
export async function sendDiscordEmbed(
  embed: DiscordEmbed,
  mention = false,
): Promise<void> {
  if (!WEBHOOK_URL) return;

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: mention ? `<@&${ADMIN_ROLE_ID}>` : undefined,
        embeds: [
          { ...embed, timestamp: embed.timestamp ?? new Date().toISOString() },
        ],
      }),
    });
  } catch (err) {
    console.error("Erreur webhook Discord :", err);
  }
}

// Notification d'erreur fatale
export async function sendDiscordFatal(
  scriptName: string,
  error: unknown,
): Promise<void> {
  await sendDiscordEmbed(
    {
      title: `💀 Erreur fatale — ${scriptName}`,
      description: String(error),
      color: 0xff0000,
      footer: { text: "Naruto Chronicles" },
    },
    true,
  );
}
