export const cargoWatchStatusOptions = [
  { value: "manifest_submitted", label: "적하목록 제출" },
  { value: "arrival_report", label: "입항보고" },
  { value: "unloading_accepted", label: "하선신고 수리" },
  { value: "cy_inbound", label: "CY 반입" },
  { value: "cfs_inbound", label: "CFS 반입" },
  { value: "inbound", label: "반입" },
  { value: "import_declaration", label: "수입신고" },
  { value: "import_accepted", label: "수입신고수리" },
  { value: "released", label: "반출완료" }
] as const;

export function cargoWatchStatusDisplay(value: string) {
  return cargoWatchStatusOptions.find((option) => option.value === value || option.label === value)?.label ?? value;
}

export function cargoWatchStatusGuidance(value: string) {
  const normalizedValue = cargoWatchStatusOptions.find((option) => option.value === value || option.label === value)?.value ?? value;
  const guidance: Record<string, string[]> = {
    manifest_submitted: [
      "적하목록이 제출되었습니다.",
      "B/L 정보와 품명, 포장수량, 중량 등 기본 정보가 예상과 맞는지 확인해 주세요.",
      "정정이 필요한 정보가 보이면 운송사 또는 포워더를 통해 정정 가능 여부를 확인해 주세요."
    ],
    arrival_report: [
      "입항보고가 확인되었습니다.",
      "입항일과 선명, 장치 예정 장소를 확인하고 이후 하선신고와 반입 진행을 확인해 주세요.",
      "신고 준비가 필요한 건이면 관련 서류와 신고 자료를 미리 정리해 주세요."
    ],
    unloading_accepted: [
      "하선신고 수리가 확인되었습니다.",
      "화물이 국내 장치장으로 이동 또는 반입될 준비 단계입니다.",
      "반입 지연 여부와 장치장 정보를 이어서 확인해 주세요."
    ],
    cy_inbound: [
      "CY 반입이 확인되었습니다.",
      "컨테이너 또는 CY 장치 화물 기준으로 반입된 상태입니다.",
      "보세운송 또는 CFS 이고가 예정된 LCL 건이면 CFS 반입 상태를 추가로 확인해 주세요."
    ],
    cfs_inbound: [
      "CFS 반입이 확인되었습니다.",
      "LCL 화물의 창고 반입 단계로, 신고 진행 또는 검사 대응 준비를 시작할 수 있습니다.",
      "수입신고 전이면 인보이스, 패킹리스트, B/L, 요건 서류를 확인해 주세요."
    ],
    inbound: [
      "반입이 확인되었습니다.",
      "장치장 반입이 완료된 상태이므로 이후 수입신고, 검사, 수리 진행을 확인해 주세요.",
      "CY/CFS 구분이 필요한 건은 진행 이력의 장치장명을 함께 확인해 주세요."
    ],
    import_declaration: [
      "수입신고가 접수되었습니다.",
      "세관 심사, 검사 지정, 요건 확인 여부를 이어서 확인해 주세요.",
      "정정이나 보완 요청 가능성에 대비해 신고 근거 서류를 준비해 주세요."
    ],
    import_accepted: [
      "수입신고수리가 확인되었습니다.",
      "납부, 반출 승인, 창고 반출 절차를 확인해 주세요.",
      "운송 요청이 필요한 건이면 창고 또는 운송사와 반출 일정을 조율해 주세요."
    ],
    released: [
      "반출완료가 확인되었습니다.",
      "화물이 장치장에서 반출된 상태입니다.",
      "운송 완료 여부와 거래처 전달 일정, 비용 정산 자료를 확인해 주세요."
    ]
  };

  return guidance[normalizedValue] ?? [
    `${cargoWatchStatusDisplay(value)} 상태가 확인되었습니다.`,
    "현재 진행 상태와 관련 서류를 확인해 주세요."
  ];
}

export function buildCargoWatchEmailText(input: {
  lookupValue: string;
  targetStatus: string;
  currentStatus: string;
  alreadyReached?: boolean;
}) {
  const targetStatusLabel = cargoWatchStatusDisplay(input.targetStatus);
  return [
    input.alreadyReached
      ? "등록하신 적하목록 감시 대상이 이미 지정한 상태에 도달한 것으로 확인되었습니다."
      : "등록하신 적하목록 감시 대상이 지정한 상태에 도달했습니다.",
    "",
    `조회값: ${input.lookupValue}`,
    `목표 상태: ${targetStatusLabel}`,
    `현재 상태: ${input.currentStatus || targetStatusLabel}`,
    "",
    ...cargoWatchStatusGuidance(input.targetStatus)
  ].join("\n");
}
