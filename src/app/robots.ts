import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/profile/", "/private/"],
      crawlDelay: 1,
    },
    sitemap: "https://naruto.eolivarez.site/sitemap.xml",
  };
}
