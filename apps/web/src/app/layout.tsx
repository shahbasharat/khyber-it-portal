import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khyber IT Operations Portal",
  description: "IT Operations portal for The Khyber Himalayan Resort & Spa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
