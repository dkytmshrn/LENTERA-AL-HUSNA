import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import logo from "./logo-al-husna.png";
import "./globals.css";
import { TopNav } from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LENTERA - E-School Platform",
  description: "Digital learning platform for integrated academic management",
  icons: {
    icon: logo.src,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
        <TopNav />
        <main className="flex-1 bg-[var(--background)]">{children}</main>
        <footer className="bg-[var(--surface)] border-t border-[var(--border)] mt-0">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 text-center text-[var(--muted)] text-xs sm:text-sm">
            <p>&copy; 2026 LENTERA E-School Platform. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
