import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXTAUTH_URL || "https://brightpath.example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/register`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/courses`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const subjects = await db.subject.findMany();
  const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

  const courseRoutes: MetadataRoute.Sitemap = subjects.flatMap((s) =>
    classLevels.map((c) => ({
      url: `${siteUrl}/courses/${s.slug}/${c}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return [...staticRoutes, ...courseRoutes];
}
