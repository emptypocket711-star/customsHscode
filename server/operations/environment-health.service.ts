type EnvStatus = "ok" | "warning" | "missing";

export type EnvironmentHealthItem = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  status: EnvStatus;
  valuePreview: string;
};

export type EnvironmentHealthGroup = {
  title: string;
  description: string;
  items: EnvironmentHealthItem[];
};

function hasValue(key: string) {
  return Boolean(process.env[key]?.trim());
}

function previewValue(key: string) {
  const value = process.env[key]?.trim();
  if (!value) return "미설정";
  if (key.includes("KEY") || key.includes("TOKEN") || key.includes("SECRET") || key.includes("PASSWORD")) {
    return "설정됨";
  }
  if (value.length <= 36) return value;
  return `${value.slice(0, 18)}...${value.slice(-8)}`;
}

function envItem({
  description,
  key,
  label,
  required
}: {
  description: string;
  key: string;
  label: string;
  required: boolean;
}): EnvironmentHealthItem {
  const configured = hasValue(key);
  return {
    description,
    key,
    label,
    required,
    status: configured ? "ok" : required ? "missing" : "warning",
    valuePreview: previewValue(key)
  };
}

export function getEnvironmentHealthGroups(): EnvironmentHealthGroup[] {
  return [
    {
      title: "Supabase",
      description: "로그인, 사용자 관리, RLS, 법령·관세 데이터 조회에 필요한 기본 연결입니다.",
      items: [
        envItem({
          key: "NEXT_PUBLIC_SUPABASE_URL",
          label: "Supabase URL",
          description: "브라우저와 서버에서 사용할 Supabase 프로젝트 URL입니다.",
          required: true
        }),
        envItem({
          key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          label: "Supabase publishable/anon key",
          description: "RLS가 적용된 클라이언트 요청에 쓰는 공개 키입니다.",
          required: true
        }),
        envItem({
          key: "SUPABASE_SERVICE_ROLE_KEY",
          label: "Supabase service role key",
          description: "운영 관리, 감사 로그, 서버 전용 조회에 쓰는 비공개 키입니다.",
          required: true
        })
      ]
    },
    {
      title: "AI 품명 검색",
      description: "품명·모델명·오타 검색에서 GPT 후보를 생성하는 설정입니다.",
      items: [
        envItem({
          key: "AI_PROVIDER",
          label: "AI Provider",
          description: "운영에서는 openai 값을 사용합니다. mock이면 GPT 호출 없이 대체 응답을 사용합니다.",
          required: true
        }),
        envItem({
          key: "OPENAI_API_KEY",
          label: "OpenAI API key",
          description: "서버에서만 사용하는 OpenAI 비공개 키입니다.",
          required: true
        }),
        envItem({
          key: "OPENAI_MODEL",
          label: "OpenAI model",
          description: "품명 후보와 설명 생성에 사용할 모델명입니다.",
          required: true
        }),
        envItem({
          key: "OPENAI_PRODUCT_SEARCH_TIMEOUT_MS",
          label: "품명 검색 timeout",
          description: "품명 검색이 너무 빨리 fallback 되지 않도록 조정하는 제한 시간입니다.",
          required: false
        }),
        envItem({
          key: "LOOKUP_TELEMETRY_ENABLED",
          label: "Lookup telemetry",
          description: "품명 검색 지연과 후보 수를 원문 없이 서버 로그로 확인할 때만 true로 켭니다.",
          required: false
        })
      ]
    },
    {
      title: "관세청 OpenAPI",
      description: "사용자 실시간 조회보다 월별 수집·검증 작업에 주로 사용하는 공식 API 설정입니다.",
      items: [
        envItem({
          key: "CUSTOMS_API_HS_CODE_SERVICE_KEY",
          label: "API018 HS부호검색 key",
          description: "HS부호검색 자료를 DB에 적재할 때 사용합니다.",
          required: false
        }),
        envItem({
          key: "CUSTOMS_API_TARIFF_RATE_SERVICE_KEY",
          label: "API030 관세율 key",
          description: "관세율 자료를 수집할 때 사용합니다.",
          required: false
        }),
        envItem({
          key: "CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY",
          label: "API012 관세환율 key",
          description: "예상 납세액 계산의 외화 환산에 사용합니다.",
          required: false
        }),
        envItem({
          key: "CUSTOMS_API_STATS_CODE_SERVICE_KEY",
          label: "API019 통계부호 key",
          description: "통계부호 자료 수집에 사용합니다.",
          required: false
        }),
        envItem({
          key: "CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY",
          label: "API001 화물통관진행 key",
          description: "적하목록 조회와 상태 알림 감시에 사용합니다.",
          required: false
        })
      ]
    },
    {
      title: "알림 메일",
      description: "적하목록 상태 도달 안내 등 사용자 지정 알림을 발송하는 설정입니다.",
      items: [
        envItem({
          key: "RESEND_API_KEY",
          label: "Resend API key",
          description: "서버에서 알림 메일을 발송할 때 사용하는 비공개 키입니다.",
          required: false
        }),
        envItem({
          key: "NOTIFICATION_FROM_EMAIL",
          label: "발신 이메일",
          description: "알림 메일 발신자로 표시될 주소입니다.",
          required: false
        })
      ]
    },
    {
      title: "사업자 검증",
      description: "기업회원 가입 시 사업자등록번호 상태를 서버에서 확인하는 선택 설정입니다.",
      items: [
        envItem({
          key: "BUSINESS_REGISTRATION_STATUS_API_URL",
          label: "사업자 상태조회 URL",
          description: "공공데이터포털 국세청 사업자등록 상태조회 endpoint입니다.",
          required: false
        }),
        envItem({
          key: "BUSINESS_REGISTRATION_STATUS_SERVICE_KEY",
          label: "사업자 상태조회 key",
          description: "상태조회 key입니다. live 플래그가 꺼져 있으면 키가 있어도 회원가입은 형식 검증만 수행합니다.",
          required: false
        }),
        envItem({
          key: "BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED",
          label: "사업자 상태조회 live",
          description: "true일 때만 회원가입 서버 액션에서 국세청/공공데이터 사업자 상태조회를 호출합니다.",
          required: false
        }),
        envItem({
          key: "BUSINESS_REGISTRATION_STATUS_TIMEOUT_MS",
          label: "사업자 상태조회 timeout",
          description: "외부 API 응답 지연이 가입 화면을 오래 막지 않도록 제한하는 시간입니다.",
          required: false
        })
      ]
    },
    {
      title: "운영 보호",
      description: "트래픽 증가와 배치 작업을 제어하는 선택 설정입니다.",
      items: [
        envItem({
          key: "RATE_LIMIT_ENABLED",
          label: "Route rate limit",
          description: "운영에서는 기본 활성화됩니다. true/false로 명시 제어할 수 있습니다.",
          required: false
        }),
        envItem({
          key: "UPSTASH_REDIS_REST_URL",
          label: "Upstash Redis URL",
          description: "여러 서버 인스턴스에서 rate limit과 캐시를 공유할 때 사용합니다.",
          required: false
        }),
        envItem({
          key: "UPSTASH_REDIS_REST_TOKEN",
          label: "Upstash Redis token",
          description: "Redis REST API 접근 토큰입니다.",
          required: false
        }),
        envItem({
          key: "JOB_WORKER_SECRET",
          label: "Background job secret",
          description: "배치 작업 API를 보호하는 서버 전용 토큰입니다.",
          required: false
        })
      ]
    }
  ];
}
