import type { Metadata } from "next";
import "./globals.css";

import { EmeraldProvider } from "./context/EmeraldContext";
import PlayerProfile from "./components/PlayerProfile";
import AudioMenu from "./components/AudioMenu";
import BackgroundMusic from "./components/BackgroundMusic";

export const metadata: Metadata = {
  title: "CS ACE",
  description: "CS ACE Demo Casino",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EmeraldProvider>
          {/* Creates / restores the player's anonymous CS ACE account */}
          <PlayerProfile />

          {/* Global background music */}
          <BackgroundMusic />

          {/* Global sound & music settings */}
          <AudioMenu />

          {/* Current page */}
          {children}
        </EmeraldProvider>
      </body>
    </html>
  );
}