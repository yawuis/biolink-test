import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sob.lol — claim your name",
  description: "Your links, your vibe. One page for everything.",
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
