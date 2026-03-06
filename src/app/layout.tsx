import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { DataProvider } from "@/components/providers/DataProvider";
import { AdminDashboardProvider } from "@/context/AdminDashboardContext";
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
          <AdminDashboardProvider>
            {children}
          </AdminDashboardProvider>
        </DataProvider>
      </body>
    </html>
  );
}
