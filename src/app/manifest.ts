import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Profithisab — real returns of Bangladeshi mutual funds",
    short_name: "Profithisab",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0f0d",
    theme_color: "#059669",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
