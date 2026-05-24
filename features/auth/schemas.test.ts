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
      password: "password123"
    });

    expect(parsed.success).toBe(false);
  });
});
