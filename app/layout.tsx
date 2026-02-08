import type { Metadata } from "next";

import { Dancing_Script } from "next/font/google";
import { Shadows_Into_Light } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";
import { SupportProvider } from "@/components/support-context";
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
    icon: '/Icon_Fountain_Pen_and_Ink_Drop.png',
    shortcut: '/Icon_Fountain_Pen_and_Ink_Drop.png',
    apple: '/Icon_Fountain_Pen_and_Ink_Drop.png',
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
          <SupportProvider>
            {children}
            <Footer />
          </SupportProvider>
        </AuthProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
