import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import prisma from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.avatarSnapshot =
          (user as { avatarSnapshot?: string | null }).avatarSnapshot ?? null;
        session.user.consentGiven =
          (user as { consentGiven?: boolean }).consentGiven ?? false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.id || !user.image) return;

      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: { avatarSnapshot: true },
      });
      if (existing?.avatarSnapshot) return;

      try {
        const res = await fetch(user.image, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return;

        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        if (!contentType.startsWith("image/")) return;

        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const dataUri = `data:${contentType};base64,${base64}`;
        if (dataUri.length > 400_000) return;

        await prisma.user.update({
          where: { id: user.id },
          data: { avatarSnapshot: dataUri, image: user.image },
        });
      } catch {}
    },
  },
  pages: {
    signIn: "/profile",
    error: "/profile",
  },
});
