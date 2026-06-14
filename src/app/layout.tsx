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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('comptes-couple-app:theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppStateProvider>
          <AppFrame>{children}</AppFrame>
        </AppStateProvider>
      </body>
    </html>
  );
}
