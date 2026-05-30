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

export type ExternalIntegrationHealthItem = {
  key: string;
  label: string;
  status: EnvStatus;
  path: string;
  message: string;
  configuredKeys: string[];
  missingKeys: string[];
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

function configuredKeys(keys: string[]) {
  return keys.filter(hasValue);
}

function missingKeys(keys: string[]) {
  return keys.filter((key) => !hasValue(key));
}

function integrationItem(input: {
  key: string;
  label: string;
  path: string;
  requiredKeys?: string[];
  optionalAnyKeys?: string[];
  okMessage: string;
  missingMessage: string;
  warningMessage?: string;
}): ExternalIntegrationHealthItem {
  const requiredKeys = input.requiredKeys ?? [];
  const optionalAnyKeys = input.optionalAnyKeys ?? [];
  const missingRequiredKeys = missingKeys(requiredKeys);
  const hasAnyOptional = optionalAnyKeys.length === 0 || optionalAnyKeys.some(hasValue);
  const status: EnvStatus = missingRequiredKeys.length > 0
    ? "missing"
    : hasAnyOptional
      ? "ok"
      : "warning";

  return {
    key: input.key,
    label: input.label,
    status,
    path: input.path,
    message: status === "ok" ? input.okMessage : status === "warning" ? (input.warningMessage ?? input.missingMessage) : input.missingMessage,
    configuredKeys: configuredKeys([...requiredKeys, ...optionalAnyKeys]),
    missingKeys: status === "warning" ? optionalAnyKeys : missingRequiredKeys
  };
}

export function getExternalIntegrationHealthItems(): ExternalIntegrationHealthItem[] {
  return [
    integrationItem({
      key: "ai_product_search",
      label: "품명 AI 검색",
      path: "OpenAI 직접 호출",
      requiredKeys: ["AI_PROVIDER", "OPENAI_API_KEY", "OPENAI_MODEL"],
      okMessage: "GPT 기반 품명 후보 생성에 필요한 필수 설정이 준비되어 있습니다.",
      missingMessage: "AI_PROVIDER, OPENAI_API_KEY, OPENAI_MODEL 중 누락된 값이 있어 품명 검색이 fallback될 수 있습니다."
    }),
    integrationItem({
      key: "customs_api001",
      label: "API001 화물통관진행",
      path: hasValue("CUSTOMS_API_CARGO_PROGRESS_RELAY_URL") ? "relay 서버 경유" : "UNIPASS 직접 호출",
      requiredKeys: hasValue("CUSTOMS_API_CARGO_PROGRESS_RELAY_URL")
        ? ["CUSTOMS_API_CARGO_PROGRESS_RELAY_URL"]
        : ["CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY"],
      optionalAnyKeys: hasValue("CUSTOMS_API_CARGO_PROGRESS_RELAY_URL") ? ["CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN"] : [],
      okMessage: hasValue("CUSTOMS_API_CARGO_PROGRESS_RELAY_URL")
        ? "Vercel 38010 포트 제한을 우회하는 relay 경로로 조회합니다."
        : "직접 호출 설정입니다. Vercel에서 38010 포트 연결 실패가 반복되면 relay 전환이 필요합니다.",
      warningMessage: "relay URL은 있으나 token이 없습니다. relay가 공개 endpoint라면 운영상 보호 설정을 권장합니다.",
      missingMessage: "API001 조회에 필요한 relay URL 또는 서비스 키가 없습니다."
    }),
    integrationItem({
      key: "customs_api012",
      label: "API012 관세환율",
      path: hasValue("CUSTOMS_API_EXCHANGE_RATE_RELAY_URL") ? "relay 서버 경유" : "UNIPASS 직접 호출",
      requiredKeys: hasValue("CUSTOMS_API_EXCHANGE_RATE_RELAY_URL")
        ? ["CUSTOMS_API_EXCHANGE_RATE_RELAY_URL"]
        : ["CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY"],
      optionalAnyKeys: hasValue("CUSTOMS_API_EXCHANGE_RATE_RELAY_URL") ? ["CUSTOMS_API_EXCHANGE_RATE_RELAY_TOKEN", "CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN"] : [],
      okMessage: hasValue("CUSTOMS_API_EXCHANGE_RATE_RELAY_URL")
        ? "관세환율 조회가 relay 경로로 준비되어 있습니다."
        : "관세환율 직접 호출 키가 있습니다. 38010 포트 오류가 있으면 relay를 추가하세요.",
      warningMessage: "relay URL은 있으나 API012 전용 token 또는 cargo relay token fallback이 없습니다.",
      missingMessage: "API012 조회에 필요한 relay URL 또는 서비스 키가 없습니다."
    }),
    integrationItem({
      key: "kotra_trade_news",
      label: "KOTRA 무역뉴스",
      path: "공공데이터 OpenAPI",
      requiredKeys: [],
      optionalAnyKeys: [
        "KOTRA_OPENAPI_SERVICE_KEY",
        "KOTRA_OVERSEAS_MARKET_NEWS_SERVICE_KEY",
        "KOTRA_USA_GLOBAL_ISSUE_SERVICE_KEY",
        "KOTRA_TRADE_FRAUD_CASE_SERVICE_KEY"
      ],
      okMessage: "KOTRA 뉴스 수집용 인증키가 설정되어 있습니다.",
      warningMessage: "KOTRA 인증키가 없어 RSS와 저장 캐시 중심으로만 뉴스가 표시됩니다.",
      missingMessage: "KOTRA 인증키가 없습니다."
    }),
    integrationItem({
      key: "transactional_email",
      label: "알림 메일",
      path: "Resend API",
      requiredKeys: ["RESEND_API_KEY", "NOTIFICATION_FROM_EMAIL"],
      okMessage: "사용자 알림 메일 발송 설정이 준비되어 있습니다.",
      missingMessage: "RESEND_API_KEY 또는 NOTIFICATION_FROM_EMAIL이 없어 적하목록 알림 메일 발송이 실패할 수 있습니다."
    }),
    integrationItem({
      key: "operations_alert_email",
      label: "운영 실패 알림",
      path: "백그라운드 worker 실패 메일",
      requiredKeys: ["RESEND_API_KEY", "NOTIFICATION_FROM_EMAIL"],
      optionalAnyKeys: ["OPERATIONS_ALERT_EMAIL", "DEVELOPER_ALERT_EMAIL"],
      okMessage: "백그라운드 worker 실패 시 운영자 메일로 알림을 보낼 수 있습니다.",
      warningMessage: "메일 발송 설정은 있으나 운영자 수신 주소가 없어 worker 실패 알림은 화면 이력으로만 확인됩니다.",
      missingMessage: "메일 발송 설정이 없어 worker 실패 알림 메일을 보낼 수 없습니다."
    }),
    integrationItem({
      key: "scheduled_jobs",
      label: "정기 작업",
      path: "Vercel Cron / job endpoint",
      requiredKeys: ["JOB_WORKER_SECRET"],
      okMessage: "정기 작업 endpoint 보호 키가 설정되어 있습니다.",
      missingMessage: "JOB_WORKER_SECRET이 없으면 운영 job endpoint 보호와 수동 실행 검증이 약해집니다."
    })
  ];
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
          key: "CUSTOMS_API_EXCHANGE_RATE_RELAY_URL",
          label: "API012 relay URL",
          description: "Vercel에서 관세청 38010 포트 직접 호출이 실패할 때 사용하는 관세환율 relay endpoint입니다.",
          required: false
        }),
        envItem({
          key: "CUSTOMS_API_EXCHANGE_RATE_RELAY_TOKEN",
          label: "API012 relay token",
          description: "관세환율 relay 호출을 보호하는 서버 전용 토큰입니다. 없으면 cargo relay token을 fallback으로 사용합니다.",
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
        }),
        envItem({
          key: "CUSTOMS_API_CARGO_PROGRESS_RELAY_URL",
          label: "API001 relay URL",
          description: "Vercel에서 관세청 38010 포트 직접 호출이 실패할 때 사용하는 적하목록 relay endpoint입니다.",
          required: false
        }),
        envItem({
          key: "CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN",
          label: "API001 relay token",
          description: "적하목록 relay 호출을 보호하는 서버 전용 토큰입니다.",
          required: false
        }),
        envItem({
          key: "CUSTOMS_API_SHED_INFO_SERVICE_KEY",
          label: "API005 장치장 key",
          description: "CY/CFS 반입 구분용 장치장 데이터를 갱신할 때 사용합니다.",
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
      title: "무역뉴스",
      description: "무역뉴스 페이지에서 공공데이터 기반 원문과 요약 카드를 가져오는 설정입니다.",
      items: [
        envItem({
          key: "KOTRA_OPENAPI_SERVICE_KEY",
          label: "KOTRA 공통 OpenAPI key",
          description: "KOTRA 해외시장뉴스, 미국 글로벌 이슈, 무역사기 사례 API에 공통으로 사용할 수 있는 인증키입니다.",
          required: false
        }),
        envItem({
          key: "KOTRA_OVERSEAS_MARKET_NEWS_SERVICE_KEY",
          label: "KOTRA 해외시장뉴스 key",
          description: "KOTRA 해외시장뉴스 API 조회에 사용하는 공공데이터포털 인증키입니다.",
          required: false
        }),
        envItem({
          key: "KOTRA_OVERSEAS_MARKET_NEWS_URL",
          label: "KOTRA 해외시장뉴스 URL",
          description: "KOTRA 해외시장뉴스 API base URL override입니다.",
          required: false
        }),
        envItem({
          key: "KOTRA_OVERSEAS_MARKET_NEWS_ENDPOINT",
          label: "KOTRA 해외시장뉴스 endpoint",
          description: "KOTRA 해외시장뉴스 API endpoint path override입니다.",
          required: false
        }),
        envItem({
          key: "KOTRA_USA_GLOBAL_ISSUE_URL",
          label: "KOTRA 미국 글로벌 이슈 URL",
          description: "미국 글로벌 이슈 모니터링 API URL override입니다.",
          required: false
        }),
        envItem({
          key: "KOTRA_TRADE_FRAUD_CASE_URL",
          label: "KOTRA 무역사기 사례 URL",
          description: "무역사기 사례 API URL override입니다.",
          required: false
        }),
        envItem({
          key: "PUBLIC_DATA_REQUEST_TIMEOUT_MS",
          label: "공공데이터 timeout",
          description: "공공데이터 API 응답 지연이 뉴스 화면을 오래 막지 않도록 제한하는 시간입니다.",
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
        }),
        envItem({
          key: "CONTAINER_RECEIPT_RATE_LIMIT_PER_MINUTE",
          label: "반입계 출력 rate limit",
          description: "터미널 원문 화면 캡처 API의 분당 호출 제한입니다.",
          required: false
        }),
        envItem({
          key: "TERMINAL_HELPER_RATE_LIMIT_PER_MINUTE",
          label: "터미널 helper rate limit",
          description: "외부 터미널 원문 화면 이동 helper의 분당 호출 제한입니다.",
          required: false
        }),
        envItem({
          key: "VEHICLE_SPEC_RATE_LIMIT_PER_MINUTE",
          label: "차량 제원조회 rate limit",
          description: "중고차 수출 제원정보 조회의 분당 호출 제한입니다.",
          required: false
        })
      ]
    }
  ];
}
