import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { NavigationProgress } from "@/components/navigation-progress";
import { htmlLangForLocale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "HS FINDER",
  description: "HS CODE, 관세율, FTA, 수출입요건 조회 서비스"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={htmlLangForLocale(locale)}>
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
