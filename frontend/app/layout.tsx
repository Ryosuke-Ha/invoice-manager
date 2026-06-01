import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";

export const metadata: Metadata = {
  title: "INVOICE_MANAGER",
  description: "INVOICE_MANAGER",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <HamburgerMenu />
          <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
