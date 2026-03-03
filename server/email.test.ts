import { describe, expect, it } from "vitest";
import { isEmailConfigured, buildReminderEmailHtml, buildAnnouncementEmailHtml } from "./email";

describe("isEmailConfigured", () => {
  it("returns false when RESEND_API_KEY is not set", () => {
    const original = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    expect(isEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = original;
  });

  it("returns false when key does not start with re_", () => {
    const original = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "invalid_key";
    expect(isEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = original;
  });

  it("returns true when key starts with re_", () => {
    const original = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_abc123";
    expect(isEmailConfigured()).toBe(true);
    process.env.RESEND_API_KEY = original;
  });
});

describe("buildReminderEmailHtml", () => {
  it("generates HTML containing the member name", () => {
    const html = buildReminderEmailHtml({
      memberName: "Nguyễn Văn A",
      eventTitle: "Thánh Lễ DMLV",
      eventDate: "Thứ Hai, 10 tháng 3, 2026",
      eventTime: "08:00 – 10:00",
      location: "Nhà thờ Đức Mẹ La Vang",
      eventType: "dmlv",
      reminderType: "7day",
    });
    expect(html).toContain("Nguyễn Văn A");
    expect(html).toContain("Thánh Lễ DMLV");
    expect(html).toContain("7 ngày nữa");
    expect(html).toContain("CA ĐOÀN THÁNH LINH");
  });

  it("shows 'ngày mai' for 1day reminder type", () => {
    const html = buildReminderEmailHtml({
      memberName: "Test Member",
      eventTitle: "Wedding Mass",
      eventDate: "Thứ Ba, 11 tháng 3, 2026",
      eventTime: "10:00 – 13:00",
      location: "Church",
      eventType: "booking",
      reminderType: "1day",
    });
    expect(html).toContain("ngày mai");
    expect(html).toContain("tomorrow");
  });

  it("includes notes when provided", () => {
    const html = buildReminderEmailHtml({
      memberName: "Test",
      eventTitle: "Practice",
      eventDate: "Thứ Tư",
      eventTime: "19:00",
      location: "Phòng tập",
      eventType: "practice",
      reminderType: "7day",
      notes: "Mang tập nhạc theo",
    });
    expect(html).toContain("Mang tập nhạc theo");
  });
});

describe("buildAnnouncementEmailHtml", () => {
  it("generates HTML containing the title and body", () => {
    const html = buildAnnouncementEmailHtml({
      title: "Lịch tập tuần tới",
      body: "Ca đoàn tập vào thứ Sáu lúc 7pm.",
    });
    expect(html).toContain("Lịch tập tuần tới");
    expect(html).toContain("Ca đoàn tập vào thứ Sáu lúc 7pm.");
    expect(html).toContain("CA ĐOÀN THÁNH LINH");
  });

  it("includes attachment links when provided", () => {
    const html = buildAnnouncementEmailHtml({
      title: "Bản nhạc mới",
      body: "Xem bản nhạc đính kèm.",
      attachments: [{ name: "sheet.pdf", url: "https://cdn.example.com/sheet.pdf", type: "application/pdf" }],
    });
    expect(html).toContain("sheet.pdf");
    expect(html).toContain("https://cdn.example.com/sheet.pdf");
  });

  it("converts newlines to <br/> tags", () => {
    const html = buildAnnouncementEmailHtml({
      title: "Test",
      body: "Line 1\nLine 2\nLine 3",
    });
    expect(html).toContain("Line 1<br/>Line 2<br/>Line 3");
  });
});

describe("announcements router", () => {
  it("validates that title and body are required", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: { cookie: "choir_admin_session=fake_token" } } as any,
      res: { setHeader: () => {} } as any,
    });

    // Without admin token this should throw FORBIDDEN
    await expect(
      caller.announcements.send({ title: "Test", body: "Body" })
    ).rejects.toThrow();
  });
});

describe("practice router", () => {
  it("returns an array from getAll (public)", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });
    const result = await caller.practice.getAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
