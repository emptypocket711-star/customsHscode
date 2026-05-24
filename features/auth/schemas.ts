import { z } from "zod";

export const authModeSchema = z.enum(["login", "signup"]);

export const authFormSchema = z
  .object({
    mode: authModeSchema,
    email: z.email("이메일 형식을 확인해 주세요.").trim().max(255),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(128),
    fullName: z.string().trim().max(80).optional(),
    companyName: z.string().trim().max(120).optional()
  })
  .superRefine((data, ctx) => {
    if (data.mode === "signup" && !data.companyName) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "회사명을 입력해 주세요."
      });
    }
  });

export type AuthFormInput = z.infer<typeof authFormSchema>;

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  mode: "login" | "signup";
};
