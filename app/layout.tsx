import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FundProvider } from "@/context/FundContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
        <AuthProvider>
          <FundProvider>
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 text-gray-900">
                {children}
              </div>
            </ProtectedRoute>
          </FundProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
