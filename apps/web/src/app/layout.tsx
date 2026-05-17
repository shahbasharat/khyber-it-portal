import { Metadata } from "next";
import { AuthInitializer } from "@/app/components/AuthInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khyber IT Portal",
  description: "Operations management for The Khyber Himalayan Resort & Spa IT Team",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Khyber IT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-cream">
        <AuthInitializer>
          {children}
        </AuthInitializer>
      </body>
    </html>
  );
}
