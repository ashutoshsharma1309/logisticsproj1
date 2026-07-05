import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://chainroute.ai";
  const routes = ["", "/pricing", "/contact", "/login", "/signup", "/dashboard"];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date("2026-07-01"),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
