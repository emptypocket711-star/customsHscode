import { Badge } from "@/components/ui/badge";

export function StaffModeBanner({
  mode,
  message
}: {
  mode: "mock" | "supabase";
  message?: string;
}) {
  return (
    <div className="mb-5 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">운영 화면 권한 상태</p>
          <p className="mt-1 text-sm text-slate-600">
            {message ?? "Supabase 인증과 profiles.role 기준으로 staff/admin 권한을 확인했습니다."}
          </p>
        </div>
        <Badge tone={mode === "supabase" ? "success" : "warning"}>{mode}</Badge>
      </div>
    </div>
  );
}
