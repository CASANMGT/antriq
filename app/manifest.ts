import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AntriQ — Antrean restoran, lebih praktis",
    short_name: "AntriQ",
    description: "Ambil antrean, pantau giliran, dan datang ke meja saat dipanggil.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8E7",
    theme_color: "#FFF1CA",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
