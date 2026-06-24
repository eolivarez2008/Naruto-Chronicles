import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SessionProvider } from "next-auth/react";
import { DM_Sans, Syne } from "next/font/google";

export const metadata: Metadata = {
  title: { default: "Naruto Chronicles", template: "%s | Naruto Chronicles" },
  metadataBase: new URL("https://naruto.eolivarez.site"),
  description:
    "Site dédié à l'univers de Naruto — histoire, personnages, sagas et bien plus.",
  icons: { icon: "/logo/favicon-naruto.png" },
  openGraph: {
    siteName: "Naruto Chronicles",
    type: "website",
    locale: "fr_FR",
  },
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://cdn.myanimelist.net" />
        <link rel="preconnect" href="https://dattebayo-api.onrender.com" />
      </head>
      <body
        className={`${dmSans.variable} ${syne.variable} noise-bg flex min-h-screen flex-col pt-16 bg-black text-white`}
      >
        <SessionProvider>
          <Navbar />
          <main className="relative z-10 flex flex-1 flex-col">{children}</main>
          <Footer />
        </SessionProvider>
        <Script
          src={`${process.env.NEXT_PUBLIC_UMAMI_URL ?? "..."}/script.js`}
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
