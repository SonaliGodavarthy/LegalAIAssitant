import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deutsches Rechts-Assistent | German Legal AI Research",
  description:
    "AI-powered research assistant for German law — BGB, HGB, DSGVO, GG, ArbZG, KSchG. Ask questions in plain language, get grounded answers with legal citations.",
  keywords: ["German law", "legal research", "BGB", "DSGVO", "AI assistant"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full min-h-screen bg-parchment-50">
        {children}
      </body>
    </html>
  );
}
