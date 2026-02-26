import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Best AC Repair & Service in Delhi-NCR | EazyService India",
  description: "Get professional AC repair, cleaning, installation & gas refill services across Delhi-NCR. Expert technicians at your doorstep within 20 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
