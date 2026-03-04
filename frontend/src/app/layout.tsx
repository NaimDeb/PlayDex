import type { Metadata } from "next";
import { Montserrat, Radio_Canada } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/providers/AuthProvider";
import { FollowedGamesProvider } from "@/providers/FollowedGamesProvider";
import { FlashMessageProvider } from "@/components/FlashMessage/FlashMessageProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const radioCanada = Radio_Canada({
  subsets: ["latin"],
  variable: "--font-radio-canada",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlayDex - Ne rate plus aucun patch !",
  description: "PlayDex vous permet de suivre les mises à jour de vos jeux préférés. Restez informé des derniers patchnotes, DLC et extensions.",
  openGraph: {
    title: "PlayDex - Ne rate plus aucun patch !",
    description: "Suivez les mises à jour de vos jeux préférés avec PlayDex",
    type: "website",
    locale: "fr_FR",
  },
};

import { HeroUIProvider } from "@heroui/system";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${montserrat.variable} ${radioCanada.variable} antialiased bg-off-black text-off-white min-h-screen flex flex-col`}
      >
        <HeroUIProvider>
          <AuthProvider>
            <FollowedGamesProvider>
              <FlashMessageProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </FlashMessageProvider>
            </FollowedGamesProvider>
          </AuthProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
