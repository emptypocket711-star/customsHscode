import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: "HS FINDER",
  description: "HS CODE, 관세율, FTA, 수출입요건 조회 서비스"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
