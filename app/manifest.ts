import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AntriQ — restaurant waitlist",
    short_name: "AntriQ",
    description: "Join the waitlist, watch your place in line, and get seated without the guesswork.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF6ED",
    theme_color: "#FBF6ED",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
