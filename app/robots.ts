import { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL || "https://brightpath.example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/payment/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
