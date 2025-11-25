import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdgeTier ROI Calculator",
  description:
    "Estimate the impact of EdgeTier on handling time, QA effort, contact volume, and revenue."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100">{children}</body>
    </html>
  );
}
