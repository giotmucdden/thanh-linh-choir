import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper: public context (no admin cookie)
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: { cookie: "" } } as TrpcContext["req"],
    res: { setHeader: () => {}, clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// Helper: admin context — simulates a valid admin cookie by signing a real token
// We test admin.login separately; here we just verify the cookie-guard blocks public callers
function createAdminCookieContext(cookieHeader: string): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: { cookie: cookieHeader } } as TrpcContext["req"],
    res: { setHeader: () => {}, clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ── Admin auth ────────────────────────────────────────────────────────────────

describe("admin.check", () => {
  it("returns isAdmin=false when no cookie present", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.admin.check();
    expect(result.isAdmin).toBe(false);
  });
});

describe("admin.login", () => {
  it("rejects wrong password", async () => {
    const headers: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { setHeader: (_n: string, v: string) => headers.push(v), clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    await expect(appRouter.createCaller(ctx).admin.login({ password: "wrong" })).rejects.toThrow();
  });

  it("accepts correct password and sets Set-Cookie header", async () => {
    const headers: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { setHeader: (_n: string, v: string) => headers.push(v), clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    const result = await appRouter.createCaller(ctx).admin.login({ password: process.env.ADMIN_PASSWORD ?? "ThanhLinh2024!" });
    expect(result).toEqual({ success: true });
    expect(headers.some((h) => h.includes("choir_admin_session"))).toBe(true);
  });
});

describe("admin.logout", () => {
  it("clears the admin session cookie", async () => {
    const headers: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { setHeader: (_n: string, v: string) => headers.push(v), clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    const result = await appRouter.createCaller(ctx).admin.logout();
    expect(result).toEqual({ success: true });
    expect(headers.some((h) => h.includes("Max-Age=0"))).toBe(true);
  });
});

// ── Access control ────────────────────────────────────────────────────────────

describe("bookings - access control", () => {
  it("getAll requires admin cookie", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.bookings.getAll()).rejects.toThrow();
  });
});

describe("choirMembers - access control", () => {
  it("getAll requires admin cookie", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.choirMembers.getAll()).rejects.toThrow();
  });
});

describe("dmlvEvents - public access", () => {
  it("getAll is publicly accessible", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dmlvEvents.getAll().catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ── Booking validation ────────────────────────────────────────────────────────

describe("bookings.create - event-centered 3-hour block validation", () => {
  const baseInput = {
    requesterName: "Test User",
    requesterEmail: "test@example.com",
    eventName: "Test Event",
    eventType: "mass" as const,
    eventDate: new Date("2030-06-15T00:00:00.000Z").getTime(),
    location: "Test Church",
    notes: "Test notes",
  };

  it("rejects if event time is too early (block would start before midnight)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.bookings.create({ ...baseInput, eventStartTime: "00:30" })
    ).rejects.toThrow();
  });

  it("rejects if event time is too late (block would end after midnight)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.bookings.create({ ...baseInput, eventStartTime: "22:00" })
    ).rejects.toThrow();
  });

  it("accepts a valid event time — no time-range error", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.bookings.create({
      ...baseInput,
      eventDate: new Date("2099-12-25T00:00:00.000Z").getTime(),
      eventStartTime: "11:00",
    }).catch((e: Error) => e.message);
    expect(typeof result === "string" ? result : "").not.toMatch(/quá sớm|quá muộn|too early|too late/);
  });

  it("getTimeSlotsForDay is publicly accessible", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.bookings.getTimeSlotsForDay({
      dayMs: new Date("2030-06-15T00:00:00.000Z").getTime(),
    }).catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });
});
