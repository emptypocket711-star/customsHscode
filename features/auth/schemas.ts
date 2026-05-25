import { z } from "zod";

export const authModeSchema = z.enum(["login", "signup", "reset"]);
export const businessTypeSchema = z.enum(["customs_broker", "forwarder", "exporter", "importer"]);

export const authFormSchema = z
  .object({
    mode: authModeSchema,
    email: z.email("이메일 형식을 확인해 주세요.").trim().max(255),
    password: z.string().max(128).optional(),
    passwordConfirm: z.string().max(128).optional(),
    rememberSession: z.boolean().optional(),
    fullName: z.string().trim().max(80).optional(),
    companyName: z.string().trim().max(120).optional(),
    businessTypes: z.array(businessTypeSchema).optional()
  })
  .superRefine((data, ctx) => {
    if (data.mode !== "reset" && (!data.password || data.password.length < 8)) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "비밀번호는 8자 이상이어야 합니다."
      });
    }

    if (data.mode === "signup" && data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "비밀번호가 일치하지 않습니다."
      });
    }

    if (data.mode === "signup" && !data.companyName) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "회사명을 입력해 주세요."
      });
    }

    if (data.mode === "signup" && (!data.businessTypes || data.businessTypes.length === 0)) {
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
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(128),
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
  email: z.email("이메일 형식을 확인해 주세요.").trim().max(255)
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
