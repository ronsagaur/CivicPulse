import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "CivicPulse — Report. Verify. Resolve. Re-verify.",
  description:
    "An AI-powered civic accountability platform that closes the loop between citizens reporting problems and authorities solving them.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <TopNav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-slate-400">
          CivicPulse · Governance Infrastructure · Report → Verify → Route → Resolve →{" "}
          <span className="font-semibold text-slate-500">Re-verify</span> → Closed
        </footer>
      </body>
    </html>
  );
}
