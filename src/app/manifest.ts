import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bella Lash | Agendamento Online",
    short_name: "Bella Lash",
    description: "Agende seus procedimentos de extensão de cílios online.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#030304",
    theme_color: "#030304",
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
