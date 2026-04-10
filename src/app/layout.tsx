import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BackgroundScene } from "@/components/layout/BackgroundScene";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GTR-Pickelball — La Plateforme de Ligue Ultime",
  description: "Gérez vos ligues de pickleball avec élégance. Fair-play intelligent, organisation mobile-first et interface Next-Gen.",
  keywords: ["Pickleball", "Ligue", "Tournoi", "Fairplay", "GTR Team"],
};

import { createClient } from "@/utils/supabase/server";
import { isUserAdmin } from "@/lib/user-utils";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = isUserAdmin(user?.email);

  return (
    <html lang="fr" className="dark">
      <body
         className={`${outfit.variable} ${geistMono.variable} font-sans antialiased selection:bg-pickle-primary selection:text-pickle-dark bg-[#0a0a0c]`}
      >
        <BackgroundScene />
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }
        }} />
        <Navbar userEmail={user?.email} isAdmin={isAdmin} />
        <main className="relative z-10 min-h-screen pt-24 isolate">
          {children}
        </main>
      </body>
    </html>
  );
}
