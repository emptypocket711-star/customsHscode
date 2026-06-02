import { CompanyVerificationPanel } from "@/features/company-verification/company-verification-panel";
import { CompanyPlatformOverviewPanel } from "@/features/company-verification/company-platform-overview-panel";
import { CompanyRoleRequestPanel } from "@/features/company-verification/company-role-request-panel";
import { MarketplaceEmailNotificationPreferencesPanel } from "@/features/marketplace-notification-preferences/marketplace-email-notification-preferences-panel";
import { PartnerPreferencesPanel } from "@/features/partner-preferences/partner-preferences-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCompanyRoleRequestsDashboard } from "@/server/repositories/company-role-requests.repository";
import { getCompanyVerificationDashboard } from "@/server/repositories/company-verification-status.repository";
import { getMarketplaceEmailNotificationPreferencesDashboard } from "@/server/repositories/marketplace-notification-preferences.repository";
import { getPartnerPreferencesDashboard } from "@/server/repositories/partner-preferences.repository";

export default async function CompanyMembersPage() {
  const supabase = await createSupabaseServerClient();
  const [dashboard, partnerPreferencesDashboard, roleRequestsDashboard, emailPreferencesDashboard] = await Promise.all([
    getCompanyVerificationDashboard(supabase),
    getPartnerPreferencesDashboard(supabase),
    getCompanyRoleRequestsDashboard(supabase),
    getMarketplaceEmailNotificationPreferencesDashboard(supabase)
  ]);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-blue-700">회사 설정</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">회사 검증 및 구성원</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          플랫폼 매칭에 사용할 회사 검증 상태와 제출 증빙을 관리합니다.
        </p>
      </div>
      <CompanyPlatformOverviewPanel partnerPreferences={partnerPreferencesDashboard} verification={dashboard} />
      <CompanyRoleRequestPanel dashboard={roleRequestsDashboard} />
      <CompanyVerificationPanel dashboard={dashboard} />
      <MarketplaceEmailNotificationPreferencesPanel dashboard={emailPreferencesDashboard} />
      <PartnerPreferencesPanel dashboard={partnerPreferencesDashboard} />
    </div>
  );
}
