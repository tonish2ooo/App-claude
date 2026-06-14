import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStateProvider } from "@/state/AppStateContext";
import { AppFrame } from "@/components/layout/AppFrame";

export const metadata: Metadata = {
  title: "Comptes du foyer",
  description: "Pilotage mensuel des comptes du foyer",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Foyer",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#007aff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AppStateProvider>
          <AppFrame>{children}</AppFrame>
        </AppStateProvider>
      </body>
    </html>
  );
}
