import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FundProvider } from "@/context/FundContext";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loan Portfolio Manager",
  description: "Advanced Fund & Loan Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <FundProvider>
            <div className="min-h-screen text-gray-900" style={{ backgroundColor: 'var(--background)' }}>
              {children}
            </div>
          </FundProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
