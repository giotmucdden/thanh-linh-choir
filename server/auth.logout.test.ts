import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(cookieHeader = ""): { ctx: TrpcContext; headers: string[] } {
  const headers: string[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: cookieHeader },
    } as TrpcContext["req"],
    res: {
      setHeader: (_name: string, value: string) => { headers.push(value); },
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
  return { ctx, headers };
}

describe("admin.login", () => {
  it("rejects wrong password", async () => {
    const { ctx } = createCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.login({ password: "wrong" })).rejects.toThrow();
  });

  it("accepts correct password and sets cookie", async () => {
    const { ctx, headers } = createCtx();
    const caller = appRouter.createCaller(ctx);
    // Use the password from env or fallback to default
    const result = await caller.admin.login({ password: process.env.ADMIN_PASSWORD ?? "ThanhLinh2024!" });
    expect(result).toEqual({ success: true });
    expect(headers.length).toBeGreaterThan(0);
    expect(headers[0]).toContain("choir_admin_session");
  });
});

describe("admin.logout", () => {
  it("clears the admin session cookie", async () => {
    const { ctx, headers } = createCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.logout();
    expect(result).toEqual({ success: true });
    expect(headers[0]).toContain("Max-Age=0");
  });
});

describe("admin.check", () => {
  it("returns isAdmin=false when no cookie is present", async () => {
    const { ctx } = createCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.check();
    expect(result.isAdmin).toBe(false);
  });
});
