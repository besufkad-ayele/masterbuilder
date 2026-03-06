import type { ReactNode } from "react";

import Header from "@/components/features/shared/Header";
import Footer from "@/components/features/shared/Footer";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-background">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
