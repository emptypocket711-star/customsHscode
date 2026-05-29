import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

function expectPublishedEffectiveFilter(source: string, tableName: string) {
  const tableIndex = source.indexOf(`.from("${tableName}")`);
  expect(tableIndex, `${tableName} query was not found`).toBeGreaterThanOrEqual(0);

  const nextTableIndex = source.indexOf(".from(", tableIndex + 1);
  const queryBlock = source.slice(tableIndex, nextTableIndex === -1 ? undefined : nextTableIndex);

  expect(queryBlock, `${tableName} query must filter effective_from by basis date`).toContain(".lte(\"effective_from\"");
  expect(queryBlock, `${tableName} query must include open-ended effective_to logic`).toContain("effective_to.is.null");
  expect(queryBlock, `${tableName} query must filter published records`).toContain(".eq(\"status\", \"published\")");
}

describe("lookup governance guards", () => {
  it("keeps dashboard legal-data counts basis-date scoped", () => {
    const source = read("server/rules/dashboard-metrics.service.ts");

    for (const tableName of ["hs_master", "standard_product_names", "tariff_rates", "customs_statistical_codes"]) {
      expectPublishedEffectiveFilter(source, tableName);
    }
  });

  it("keeps direct import/export lookup repositories basis-date scoped", () => {
    const directLookup = read("server/repositories/hs-master.repository.ts");
    const importDiagnosis = read("server/repositories/import-diagnosis.repository.ts");
    const exportTariff = read("server/repositories/export-destination-tariff.repository.ts");
    const exportImportData = read("server/repositories/export-destination-import-data.repository.ts");

    for (const tableName of ["hs_master", "tariff_rates", "customs_confirmation_requirements", "integrated_public_notice_requirements"]) {
      expectPublishedEffectiveFilter(directLookup, tableName);
    }

    for (const tableName of ["hs_master", "tariff_rates", "fta_agreements", "fta_rates", "fta_psr", "customs_confirmation_requirements", "integrated_public_notice_requirements", "requirement_playbooks"]) {
      expectPublishedEffectiveFilter(importDiagnosis, tableName);
    }

    expectPublishedEffectiveFilter(exportTariff, "export_destination_tariff_rates");
    expectPublishedEffectiveFilter(exportTariff, "export_destination_customs_codes");

    for (const tableName of [
      "export_destination_import_requirements",
      "export_destination_internal_taxes",
      "export_destination_additional_tariffs",
      "export_destination_trade_remedy_cases"
    ]) {
      expectPublishedEffectiveFilter(exportImportData, tableName);
    }
  });

  it("keeps sensitive and legal-data tables under RLS in migrations", () => {
    const migrations = [
      "supabase/migrations/20260521140000_phase_0_1_core_schema.sql",
      "supabase/migrations/20260521150000_document_upload_metadata.sql",
      "supabase/migrations/20260521220000_export_destination_tariff_rates.sql",
      "supabase/migrations/20260523020000_customs_statistical_codes.sql",
      "supabase/migrations/20260523060000_export_destination_import_data.sql",
      "supabase/migrations/20260523070000_export_destination_customs_codes.sql",
      "supabase/migrations/20260523090000_export_destination_additional_tariffs.sql",
      "supabase/migrations/20260523103000_export_destination_trade_remedy_cases.sql",
      "supabase/migrations/20260524040000_background_jobs.sql",
      "supabase/migrations/20260525003000_hs_favorites.sql",
      "supabase/migrations/20260525007500_account_access_events.sql",
      "supabase/migrations/20260525007600_active_user_sessions.sql",
      "supabase/migrations/20260525007700_hs_lookup_history.sql",
      "supabase/migrations/20260526001000_app_notices.sql",
      "supabase/migrations/20260526001100_app_notice_popup_enabled.sql"
    ].map(read).join("\n");

    for (const tableName of [
      "hs_master",
      "standard_product_names",
      "tariff_rates",
      "customs_confirmation_requirements",
      "integrated_public_notice_requirements",
      "requirement_playbooks",
      "customs_statistical_codes",
      "export_destination_tariff_rates",
      "export_destination_customs_codes",
      "export_destination_import_requirements",
      "export_destination_internal_taxes",
      "export_destination_additional_tariffs",
      "export_destination_trade_remedy_cases",
      "export_destination_data_sources",
      "case_documents",
      "background_jobs",
      "hs_favorites",
      "hs_lookup_history",
      "app_notices",
      "account_access_events",
      "active_user_sessions"
    ]) {
      expect(migrations, `${tableName} must enable row level security`).toContain(`alter table public.${tableName} enable row level security`);
    }
  });

  it("keeps operations RPCs restricted to the single developer role", () => {
    const roleGuard = read("server/auth/role-guard.ts");
    const strictMigration = read("supabase/migrations/20260525002200_developer_only_operations_strict.sql");

    expect(roleGuard).toContain('role === "developer"');
    expect(roleGuard).not.toContain('role === "admin" || role === "customs_staff"');
    expect(strictMigration).toContain("actor_role <> 'developer'::public.user_role");
    expect(strictMigration).toContain("emptypocket711@gmail.com");
  });

  it("keeps operations pages and navigation restricted to the developer account", () => {
    const appLayout = read("app/(app)/layout.tsx");
    const usersPage = read("app/(app)/operations/users/page.tsx");
    const noticesPage = read("app/(app)/operations/notices/page.tsx");
    const healthPage = read("app/(app)/operations/health/page.tsx");
    const documentUploadPage = read("app/(app)/documents/upload/page.tsx");
    const overseasPage = read("app/(app)/hs/overseas/page.tsx");
    const sideNav = read("components/app-side-nav.tsx");

    expect(appLayout).toContain("isDeveloperEmail(user.email)");
    expect(appLayout).toContain("showOperations={isDeveloperEmail(user.email)}");
    expect(usersPage).toContain("requireDeveloperRole()");
    expect(noticesPage).toContain("requireDeveloperRole()");
    expect(healthPage).toContain("requireDeveloperRole()");
    expect(documentUploadPage).toContain("requireDeveloperRole()");
    expect(documentUploadPage).toContain("getDocumentsDictionary");
    expect(documentUploadPage).toContain("notReadyTitle");
    expect(overseasPage).toContain("recordHsLookupHistory");
    expect(overseasPage).toContain('direction: "export"');
    expect(sideNav).toContain("showOperations ? <NavGroup");
    expect(sideNav).toContain("/operations/notices");
  });

  it("keeps dashboard notices developer-managed and audited", () => {
    const noticesMigration = read("supabase/migrations/20260526001000_app_notices.sql");
    const noticeActions = read("server/actions/app-notice.actions.ts");
    const dashboardPage = read("app/(app)/dashboard/page.tsx");
    const noticePanel = read("features/operations/notice-management-panel.tsx");

    expect(noticesMigration).toContain("developer manages notices");
    expect(noticesMigration).toContain("public.current_user_role() = 'developer'::public.user_role");
    expect(noticesMigration).toContain("auth.jwt() ->> 'email' = 'emptypocket711@gmail.com'");
    expect(noticeActions).toContain("requireCurrentDeveloper()");
    expect(noticeActions).toContain("isDeveloperEmail(user.email)");
    expect(noticeActions).toContain("app_notice_create");
    expect(noticeActions).toContain("app_notice_update");
    expect(noticeActions).toContain("app_notice_delete");
    expect(dashboardPage).toContain("listPublishedAppNotices");
    expect(noticePanel).toContain("공지사항 작성");
    expect(noticePanel).toContain("popupEnabled");
    expect(read("features/dashboard/dashboard-notice-card.tsx")).toContain("dictionary.hideOneDay");
    expect(read("lib/i18n/dashboard.ts")).toContain("1일 동안 보지 않기");
  });

  it("keeps developer test login links gated and audited", () => {
    const developerActions = read("server/actions/developer-user-management.actions.ts");
    const userPanel = read("features/operations/user-management-panel.tsx");

    expect(developerActions).toContain("createManagedUserAction");
    expect(developerActions).toContain("admin.auth.admin.createUser");
    expect(developerActions).toContain("developer_user_create");
    expect(developerActions).toContain("generateManagedUserTestLoginLinkAction");
    expect(developerActions).toContain("TEST_LOGIN_LINKS_ENABLED");
    expect(developerActions).toContain("requireCurrentDeveloper()");
    expect(developerActions).toContain("admin.auth.admin.generateLink");
    expect(developerActions).toContain("developer_test_login_link_create");
    expect(userPanel).toContain("유저 직접 생성");
    expect(userPanel).toContain("테스트 로그인 링크");
  });

  it("keeps expensive public routes behind rate limits", () => {
    const proxy = read("proxy.ts");
    const rateLimit = read("lib/rate-limit.ts");
    const containerReceiptRoute = read("app/api/external/container-receipt/route.ts");
    const terminalHelperRoute = read("app/api/external/hjit-container/route.ts");

    for (const path of ["/login", "/auth", "/hs", "/documents", "/duty-estimator", "/cargo", "/used-car-export"]) {
      expect(proxy, `${path} must be covered by proxy rate limiting`).toContain(path);
    }

    expect(proxy).toContain("checkRateLimitAsync");
    expect(rateLimit).toContain("RATE_LIMIT_ENABLED");
    expect(proxy).toContain("X-RateLimit-Remaining");
    expect(proxy).toContain("status: 429");
    expect(containerReceiptRoute).toContain("requireAuthenticatedApiRoute");
    expect(containerReceiptRoute).toContain("external-container-receipt");
    expect(containerReceiptRoute).toContain("externalIntegrationErrorResponse");
    expect(containerReceiptRoute).toContain("허용된 터미널 조회 화면만 반입계로 출력할 수 있습니다.");
    expect(terminalHelperRoute).toContain("requireAuthenticatedApiRoute");
    expect(terminalHelperRoute).toContain("external-terminal-helper");
    expect(terminalHelperRoute).toContain("externalIntegrationErrorResponse");
  });

  it("keeps authenticated app pages behind a fast proxy login guard", () => {
    const proxy = read("proxy.ts");

    for (const path of [
      "/dashboard",
      "/hs",
      "/duty-estimator",
      "/cargo",
      "/used-car-export",
      "/trade-news",
      "/operations",
      "/settings"
    ]) {
      expect(proxy, `${path} must be protected before expensive server rendering`).toContain(path);
    }

    expect(proxy).toContain("isProtectedPath");
    expect(proxy).toContain("hasSupabaseAuthCookie");
    expect(proxy).toContain('NextResponse.redirect(new URL("/login"');
  });

  it("does not fall back to mock legal diagnosis after a Supabase failure in production", () => {
    const mockPolicy = read("server/rules/legal-mock-policy.ts");
    const importDiagnosis = read("server/rules/import-diagnosis.service.ts");
    const exportDiagnosis = read("server/rules/export-diagnosis.service.ts");

    expect(mockPolicy).toContain("ALLOW_LEGAL_MOCK_FALLBACK");
    expect(mockPolicy).toContain('process.env.NODE_ENV !== "production"');
    expect(importDiagnosis).toContain("allowLegalMockFallback() ? diagnoseImport(input) : null");
    expect(exportDiagnosis).toContain("hasSupabaseEnv() && !legalMockAllowed");
  });

  it("keeps recent user-data policies company scoped and service-role only where needed", () => {
    const hsFavorites = read("supabase/migrations/20260525003000_hs_favorites.sql");
    const hsLookupHistory = read("supabase/migrations/20260525007700_hs_lookup_history.sql");
    const accountAccessEvents = read("supabase/migrations/20260525007500_account_access_events.sql");
    const activeUserSessions = read("supabase/migrations/20260525007600_active_user_sessions.sql");
    const hardening = read("supabase/migrations/20260525007800_harden_recent_user_data_rls.sql");
    const passwordUpdateEvent = read("supabase/migrations/20260525007900_account_password_update_event.sql");
    const operationsRefresh = read("supabase/migrations/20260525008000_operations_refresh_snapshots.sql");
    const authActions = read("server/actions/auth.actions.ts");

    expect(hsFavorites).toContain("and company_id = public.current_company_id()");
    expect(hardening).toContain("and company_id = public.current_company_id()");
    expect(hsLookupHistory).toContain("and company_id = public.current_company_id()");

    expect(accountAccessEvents).toContain("public.current_user_role() = 'developer'::public.user_role");
    expect(hardening).toContain("revoke all on public.account_access_events from anon, authenticated");
    expect(hardening).toContain("to service_role");

    expect(activeUserSessions).toContain("public.current_user_role() = 'developer'::public.user_role");
    expect(activeUserSessions).toContain("auth.role() = 'service_role'");
    expect(passwordUpdateEvent).toContain("'password_updated'");
    expect(authActions).toContain('eventType: "password_updated"');
    expect(operationsRefresh).toContain("grant execute on function public.refresh_operations_snapshots(date) to service_role");
    expect(operationsRefresh).toContain("refresh materialized view public.export_destination_country_coverage");
  });
});
