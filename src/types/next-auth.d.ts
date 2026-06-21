import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatarSnapshot?: string | null;
      consentGiven?: boolean;
    };
  }

  interface User {
    avatarSnapshot?: string | null;
    consentGiven?: boolean;
  }
}
