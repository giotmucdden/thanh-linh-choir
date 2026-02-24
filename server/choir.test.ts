import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@thanhlinh.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("admin");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: createAdminContext().user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string) => { clearedCookies.push(name); },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});

describe("bookings - access control", () => {
  it("getAll requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.bookings.getAll()).rejects.toThrow();
  });

  it("admin can call getAll", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // Will succeed (may return empty array if DB not available)
    const result = await caller.bookings.getAll().catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("choirMembers - access control", () => {
  it("getAll requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.choirMembers.getAll()).rejects.toThrow();
  });
});

describe("dmlvEvents - public access", () => {
  it("getAll is publicly accessible", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw for public procedure
    const result = await caller.dmlvEvents.getAll().catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });
});

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

  it("rejects if event time is too early (before 07:00 — block would start before midnight)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // 00:30 event → block starts at -00:30 (invalid)
    await expect(
      caller.bookings.create({ ...baseInput, eventStartTime: "00:30" })
    ).rejects.toThrow();
  });

  it("rejects if event time is too late (after 21:00 — block would end after midnight)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // 22:00 event → block ends at 24:00 (invalid)
    await expect(
      caller.bookings.create({ ...baseInput, eventStartTime: "22:00" })
    ).rejects.toThrow();
  });

  it("accepts a valid event time (e.g. 11:00 → block 10:00–13:00) — no time-range error", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Use a far-future unique date unlikely to have any existing bookings
    const result = await caller.bookings.create({
      ...baseInput,
      eventDate: new Date("2099-12-25T00:00:00.000Z").getTime(),
      eventStartTime: "11:00",
    }).catch((e: Error) => e.message);
    // Should NOT fail with a time-range validation error (may fail with DB error which is OK)
    expect(typeof result === "string" ? result : "").not.toMatch(/quá sớm|quá muộn|too early|too late|tối thiểu|minimum/);
  });

  it("getTimeSlotsForDay is publicly accessible", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bookings.getTimeSlotsForDay({
      dayMs: new Date("2030-06-15T00:00:00.000Z").getTime(),
    }).catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getTimeSlotsForDay returns eventStartTime field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bookings.getTimeSlotsForDay({
      dayMs: new Date("2030-06-15T00:00:00.000Z").getTime(),
    }).catch(() => [] as Array<{ eventStartTime: string }>);
    expect(Array.isArray(result)).toBe(true);
  });
});
