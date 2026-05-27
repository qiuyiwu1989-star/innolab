import type { MetadataRoute } from "next";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/methods`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/cases`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, priority: 0.6 },
  ];

  const methodRoutes = getAllMethods().map((m) => ({
    url: `${SITE_URL}/methods/${m.slug}`,
    lastModified: now,
    priority: 0.7,
  }));

  const caseRoutes = getAllCases()
    .filter((c) => c.file !== null)
    .map((c) => ({
      url: `${SITE_URL}/cases/${c.id}`,
      lastModified: now,
      priority: 0.6,
    }));

  return [...staticRoutes, ...methodRoutes, ...caseRoutes];
}
