import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: { default: "Naruto Chronicles", template: "%s | Naruto Chronicles" },
  description:
    "Site dédié à l'univers de Naruto — histoire, personnages, sagas et bien plus.",
  icons: { icon: "/logo/favicon-naruto.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
        <Script
          src="https://umami.eolivarez.site/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </head>
      <body className="noise-bg flex min-h-screen flex-col pt-16 bg-black text-white">
        <SessionProvider>
          <div
            className="orb"
            style={{ top: "-200px", right: "-200px" }}
            aria-hidden="true"
          />
          <Navbar />
          <main className="relative z-10 flex flex-1 flex-col">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
