import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "세니의 도토리 모으기",
    short_name: "도토리",
    description: "VR·무한매수·DCA 자동매매 + 종목 모니터",
    start_url: "/auto",
    display: "standalone",
    background_color: "#FBF7FA",
    theme_color: "#EC4899",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
