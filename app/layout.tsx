import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, DM_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://texty.giteshsarvaiya.xyz"),
  title: "texty — write together",
  description:
    "Collaborative documents with real-time editing, offline sync, and one-click publishing.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "texty — write together",
    description:
      "Collaborative documents with real-time editing, offline sync, and one-click publishing.",
    images: [{ url: "/og.png", width: 1000, height: 525 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${instrumentSerif.variable} ${dmMono.variable} font-sans antialiased`}
      >
        {children}
        <Script
          data-goatcounter="https://texty.goatcounter.com/count"
          src="//gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
