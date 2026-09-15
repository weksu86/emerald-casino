import type { Metadata } from "next";
import "./globals.css";
import { EmeraldProvider } from "./context/EmeraldContext";

export const metadata: Metadata = {
  title: "Emerald",
  description: "Emerald Demo Casino",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EmeraldProvider>{children}</EmeraldProvider>
      </body>
    </html>
  );
}