import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const siteUrl = process.env.NEXTAUTH_URL || "https://brightpath.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Genius Academy — Learn. Practise. Master.",
    template: "%s | Genius Academy",
  },
  description:
    "Online learning platform for Nigerian secondary school students: structured lessons, live classes, CBT practice and progress tracking for JSS, SS1–SS3, WAEC, NECO and JAMB.",
  keywords: [
    "Nigerian secondary school",
    "WAEC past questions",
    "JAMB CBT practice",
    "online lessons Nigeria",
    "SS1 SS2 SS3 physics chemistry biology",
  ],
  manifest: "/manifest.json",
  openGraph: {
    title: "Genius Academy — Learn. Practise. Master.",
    description: "Structured lessons, live classes and CBT practice for Nigerian secondary school students.",
    url: siteUrl,
    siteName: "Genius Academy",
    locale: "en_NG",
    type: "website",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
