import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { AppSideNav } from "@/components/app-side-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <AppSideNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
