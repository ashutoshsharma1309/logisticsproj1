import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = "https://chainroute.ai";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ChainRoute AI — Decentralized Logistics Intelligence Platform",
    template: "%s · ChainRoute AI",
  },
  description:
    "AI-powered logistics intelligence with a decentralized shipment ledger (Blockchain Simulation Mode). Predict delays, optimize routes, verify shipment integrity, and gain enterprise-grade supply-chain visibility.",
  keywords: [
    "logistics software",
    "supply chain",
    "shipment tracking",
    "blockchain simulation",
    "AI logistics",
    "fleet management",
    "warehouse management",
  ],
  authors: [{ name: "ChainRoute AI" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "ChainRoute AI — Decentralized Logistics Intelligence Platform",
    description:
      "Predict delays, optimize routes, and verify shipment integrity with an immutable simulated ledger.",
    siteName: "ChainRoute AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainRoute AI",
    description: "Decentralized Logistics Intelligence Platform",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
