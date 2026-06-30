import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "CivicPulse — Making civic governance visible.",
  description:
    "An AI-powered civic accountability platform. Where every civic issue has a public journey.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-slate-400">
          CivicPulse · Governance Infrastructure · Making civic governance visible.
        </footer>
      </body>
    </html>
  );
}
