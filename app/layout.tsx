import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner-toast";
import Script from "next/script";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Another Note",
  description: "Simple note management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const storedTheme = localStorage.getItem('theme') || 'light';
                document.documentElement.classList.toggle('dark', storedTheme === 'dark');
              } catch (e) {
                console.error('Error accessing localStorage:', e);
              }
            })();
          `}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased transition-colors`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
};