import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Dancing_Script } from "next/font/google";
import { Shadows_Into_Light } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";

const inter = Inter({ subsets: ["latin"] });
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
        </AuthProvider>
      </body>
    </html>
  );
}
