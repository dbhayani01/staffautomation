import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parakhiya & Co. Shared Inbox",
  description: "Secure shared email inbox with staff-client mapping",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
