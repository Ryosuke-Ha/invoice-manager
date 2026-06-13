import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

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
        <ToastProvider>
        <AuthProvider>
          {/* PC sidebar (lg+) */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          {/* Mobile hamburger menu (< lg) */}
          <div className="lg:hidden">
            <HamburgerMenu />
          </div>
          {/* Main content */}
          <div className="lg:ml-60">
            <div className="max-w-lg mx-auto px-4 pt-6 pb-8 lg:max-w-none lg:p-8">
              {children}
            </div>
          </div>
        </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
