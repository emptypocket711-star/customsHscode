import { describe, expect, it } from "vitest";
import { authFormSchema } from "@/features/auth/schemas";

describe("authFormSchema", () => {
  it("accepts login input", () => {
    const parsed = authFormSchema.safeParse({
      mode: "login",
      email: "user@example.com",
      password: "password123"
    });

    expect(parsed.success).toBe(true);
  });

  it("requires company name for signup", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "password123",
      passwordConfirm: "password123",
      businessTypes: ["importer"]
    });

    expect(parsed.success).toBe(false);
  });

  it("requires matching password confirmation for signup", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "password123",
      passwordConfirm: "password456",
      companyName: "테스트상사",
      businessTypes: ["importer"]
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least one business type for signup", () => {
    const parsed = authFormSchema.safeParse({
      mode: "signup",
      email: "user@example.com",
      password: "password123",
      passwordConfirm: "password123",
      companyName: "테스트상사",
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
});
