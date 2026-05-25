import { describe, expect, it } from "vitest";
import { authFormSchema } from "@/features/auth/schemas";

describe("authFormSchema", () => {
  it("accepts login input", () => {
    const parsed = authFormSchema.safeParse({
      mode: "login",
      email: "user@example.com",
      password: "legacy-password"
    });

    expect(parsed.success).toBe(true);
  });

  it("requires password for login", () => {
    const parsed = authFormSchema.safeParse({
      mode: "login",
      email: "user@example.com"
    });

    expect(parsed.success).toBe(false);
  });

  it("requires company name for signup", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "Password123!",
      passwordConfirm: "Password123!",
      accountType: "company",
      fullName: "구본현",
      businessNo: "123-45-67890",
      businessTypes: ["importer"]
    });

    expect(parsed.success).toBe(false);
  });

  it("requires matching password confirmation for signup", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "Password123!",
      passwordConfirm: "Password456!",
      accountType: "company",
      fullName: "구본현",
      companyName: "테스트상사",
      businessNo: "123-45-67890",
      businessTypes: ["importer"]
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least one business type for signup", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "Password123!",
      passwordConfirm: "Password123!",
      accountType: "company",
      fullName: "구본현",
      companyName: "테스트상사",
      businessNo: "123-45-67890",
      businessTypes: []
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts password reset input without password", () => {
    const parsed = authFormSchema.safeParse({
      mode: "reset",
      email: "user@example.com"
    });

    expect(parsed.success).toBe(true);
  });

  it("requires strong password composition for signup", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "password123",
      passwordConfirm: "password123",
      accountType: "company",
      fullName: "구본현",
      companyName: "테스트상사",
      businessNo: "123-45-67890",
      businessTypes: ["importer"]
    });

    expect(parsed.success).toBe(false);
  });

  it("requires business registration number for company signup", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "Password123!",
      passwordConfirm: "Password123!",
      accountType: "company",
      fullName: "구본현",
      companyName: "테스트상사",
      businessTypes: ["importer"]
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts personal signup without company name", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "Password123!",
      passwordConfirm: "Password123!",
      accountType: "personal",
      fullName: "개인사용자"
    });

    expect(parsed.success).toBe(true);
  });
});
