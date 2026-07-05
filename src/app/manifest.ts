import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChainRoute AI — Decentralized Logistics Intelligence",
    short_name: "ChainRoute AI",
    description:
      "AI-powered logistics platform with a decentralized shipment ledger (Blockchain Simulation Mode).",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f1a",
    theme_color: "#6d4bff",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
