const verificationItems = ["회사명·국가", "웹사이트 또는 담당자 연락처", "거래 서류 또는 제품 자료"];

export function OverseasPartnerSignupNotice() {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950">
      <p className="font-semibold">해외 수출입 파트너 검증 안내</p>
      <p className="mt-1">
        한국 사업자등록번호 없이 가입할 수 있습니다. 다만 한국 포워더·관세사무소 연결 요청을 공개하려면 운영자 확인이 필요할 수 있습니다.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {verificationItems.map((item) => (
          <span className="rounded-md bg-white px-2 py-1 font-semibold text-blue-800 ring-1 ring-blue-100" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
