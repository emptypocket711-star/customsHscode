import { z } from "zod";

export const authModeSchema = z.enum(["login", "signup", "reset"]);
export const accountTypeSchema = z.enum(["personal", "company"]);
export const businessTypeSchema = z.enum(["customs_broker", "foreign_shipper", "forwarder", "exporter", "importer"]);
export const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;
export const strongPasswordMessage = "비밀번호는 숫자, 영문 소문자, 영문 대문자, 특수문자를 모두 포함한 8자 이상이어야 합니다.";
const businessNoPattern = /^\d{3}-?\d{2}-?\d{5}$/;

function requiresKoreanBusinessNo(businessTypes: string[] | undefined) {
  return (businessTypes ?? []).some((businessType) => businessType !== "foreign_shipper");
}

export const authFormSchema = z
  .object({
    mode: authModeSchema,
    email: z.email("이메일 형식을 확인해 주세요.").trim().max(255),
    password: z.string().max(128).optional(),
    passwordConfirm: z.string().max(128).optional(),
    rememberSession: z.boolean().optional(),
    accountType: accountTypeSchema.optional(),
    fullName: z.string().trim().max(80).optional(),
    companyName: z.string().trim().max(120).optional(),
    businessNo: z.string().trim().max(12).optional(),
    businessTypes: z.array(businessTypeSchema).optional(),
    termsAccepted: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    if (data.mode === "login" && !data.password) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "비밀번호를 입력해 주세요."
      });
    }

    if (data.mode === "signup" && (!data.password || !strongPasswordPattern.test(data.password))) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: strongPasswordMessage
      });
    }

    if (data.mode === "signup" && data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "비밀번호가 일치하지 않습니다."
      });
    }

    if (data.mode === "signup" && !data.accountType) {
      ctx.addIssue({
        code: "custom",
        path: ["accountType"],
        message: "회원 유형을 선택해 주세요."
      });
    }

    if (data.mode === "signup" && !data.fullName) {
      ctx.addIssue({
        code: "custom",
        path: ["fullName"],
        message: "이름을 입력해 주세요."
      });
    }

    if (data.mode === "signup" && !data.termsAccepted) {
      ctx.addIssue({
        code: "custom",
        path: ["termsAccepted"],
        message: "약관과 개인정보 처리방침에 동의해 주세요."
      });
    }

    if (data.mode === "signup" && data.accountType === "company" && !data.companyName) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "회사명을 입력해 주세요."
      });
    }

    if (
      data.mode === "signup" &&
      data.accountType === "company" &&
      requiresKoreanBusinessNo(data.businessTypes) &&
      (!data.businessNo || !businessNoPattern.test(data.businessNo))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["businessNo"],
        message: "국내 사업자 유형은 사업자등록번호 10자리를 입력해 주세요."
      });
    }

    if (data.mode === "signup" && data.accountType === "company" && (!data.businessTypes || data.businessTypes.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["businessTypes"],
        message: "업무 유형을 하나 이상 선택해 주세요."
      });
    }
  });

export type AuthFormInput = z.infer<typeof authFormSchema>;

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  mode: "login" | "signup" | "reset";
};

export const updatePasswordFormSchema = z
  .object({
    password: z.string().regex(strongPasswordPattern, strongPasswordMessage),
    passwordConfirm: z.string().min(8, "비밀번호 확인을 입력해 주세요.").max(128)
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "비밀번호가 일치하지 않습니다."
      });
    }
  });

export type UpdatePasswordActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const signupOtpSendFormSchema = z.object({
  email: z.email("이메일 형식을 확인해 주세요.").trim().max(255),
  accountType: accountTypeSchema.optional()
});

export const signupOtpVerifyFormSchema = z.object({
  email: z.email("이메일 형식을 확인해 주세요.").trim().max(255),
  token: z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\D/g, "") : value),
    z.string().regex(/^\d{6}$|^\d{8}$/, "이메일로 받은 인증번호 6자리 또는 8자리를 입력해 주세요.")
  )
});

export type SignupOtpActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  email?: string;
  verified?: boolean;
};

export type BusinessRegistrationCheckState = {
  status: "idle" | "success" | "warning" | "error";
  message?: string;
  active?: boolean;
  businessNo?: string;
  configured?: boolean;
  rawStatus?: string;
};
