import type { MetadataRoute } from "next";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";
import { engines } from "@/lib/engines";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.qiuyiwu.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      priority: 1,
      changeFrequency: "weekly",
    },
    {
      url: `${SITE_URL}/methods`,
      lastModified: now,
      priority: 0.9,
      changeFrequency: "weekly",
    },
    {
      url: `${SITE_URL}/cases`,
      lastModified: now,
      priority: 0.85,
      changeFrequency: "weekly",
    },
    {
      url: `${SITE_URL}/demo`,
      lastModified: now,
      priority: 0.8,
      changeFrequency: "daily",
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      priority: 0.6,
      changeFrequency: "monthly",
    },
  ];

  const engineRoutes = engines.map((e) => ({
    url: `${SITE_URL}/methods/engine/${e.key}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));

  const methodRoutes = getAllMethods().map((m) => ({
    url: `${SITE_URL}/methods/${m.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const caseRoutes = getAllCases()
    .filter((c) => c.file !== null)
    .map((c) => ({
      url: `${SITE_URL}/cases/${c.id}`,
      lastModified: now,
      priority: 0.65,
      changeFrequency: "monthly" as const,
    }));

  return [...staticRoutes, ...engineRoutes, ...methodRoutes, ...caseRoutes];
}
