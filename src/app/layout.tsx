import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { DataProvider } from "@/components/providers/DataProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Leadership Development Program | The Leadership Cycle",
  description: "Leading platform for competency-based workplace success training.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
      { url: "/mbllogo.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/mbllogo.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSerifDisplay.variable} font-sans antialiased`}>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
