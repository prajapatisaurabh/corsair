import type { MetadataRoute } from "next";

const APP_URL = process.env.APP_URL ?? "http://localhost:3456";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The app shell and API are behind auth — no value in crawling them.
      disallow: ["/app", "/api/"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
