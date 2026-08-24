import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} — one link for everything you are`,
  description: "Claim your name. Share your Discord, music, and links on one page people actually want to open.",
  icons: {
    icon: "/default-favicon.png",
    shortcut: "/default-favicon.png",
    apple: "/default-favicon.png",
  },
  themeColor: "#55acee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
