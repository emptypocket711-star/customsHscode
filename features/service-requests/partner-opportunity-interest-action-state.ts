export type PartnerMatchInterestActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

export const partnerMatchInterestInitialState: PartnerMatchInterestActionState = {
  message: null,
  status: "idle"
};
