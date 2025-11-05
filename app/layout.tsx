import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic Video Poster",
  description: "Generate videos via Replicate and post to Instagram daily",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial', padding: 20, maxWidth: 900, margin: '0 auto' }}>
        {children}
      </body>
    </html>
  );
}
