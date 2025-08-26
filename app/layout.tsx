import type { Metadata } from "next";

import { Dancing_Script } from "next/font/google";
import { Shadows_Into_Light } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";
import { Footer } from "@/components/footer";


const dancingScript = Dancing_Script({ 
  subsets: ["latin"],
  variable: "--font-dancing-script"
});
const shadowsIntoLight = Shadows_Into_Light({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-shadows-into-light"
});

export const metadata: Metadata = {
  title: "Ink-lings - Journaling Made Simple",
  description: "Transform your journaling practice with personalized prompts and gentle reminders.",
  icons: {
    icon: '/icon_final_final_white.png',
    shortcut: '/icon_final_final_white.png',
    apple: '/icon_final_final_white.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${shadowsIntoLight.variable} ${dancingScript.variable}`}>
        <AuthProvider>
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
