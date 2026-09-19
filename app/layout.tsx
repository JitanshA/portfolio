import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jitansh-arora.vercel.app"),
  title: "Jitansh Arora — Software Engineer",
  description:
    "Portfolio of Jitansh Arora, a computer science student and software engineer focused on backend systems, infrastructure, and systems programming.",
  applicationName: "Jitansh Arora Portfolio",
  authors: [{ name: "Jitansh Arora" }],
  creator: "Jitansh Arora",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  keywords: [
    "Jitansh Arora",
    "software engineer",
    "backend engineering",
    "systems programming",
    "distributed systems",
  ],
  icons: { icon: "/favicon.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Jitansh Arora — Software Engineer",
    description: "Backend, infrastructure, and systems engineering portfolio.",
    url: "/",
    siteName: "Jitansh Arora Portfolio",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Jitansh Arora — Software Engineer",
    description: "Backend, infrastructure, and systems engineering portfolio.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#070c14",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${instrumentSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
