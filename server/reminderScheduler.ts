/**
 * Automated reminder scheduler.
 * Runs every hour (via setInterval), scans upcoming events, and sends
 * 7-day and 1-day advance email reminders to all active choir members.
 *
 * Events covered:
 *  - DMLV mass events
 *  - Approved bookings
 *  - Practice sessions
 */

import { and, eq, gte, lte, isNull, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  dmlvEvents,
  bookings,
  practiceSessions,
  choirMembers,
  reminderLogs,
} from "../drizzle/schema";
import {
  sendEmail,
  buildReminderEmailHtml,
  type SendEmailOptions,
} from "./email";

const REMINDER_WINDOWS = [
  { label: "7day", offsetMs: 7 * 24 * 60 * 60 * 1000 },
  { label: "1day", offsetMs: 1 * 24 * 60 * 60 * 1000 },
] as const;

// Tolerance window: ±1 hour around the target send time
const TOLERANCE_MS = 60 * 60 * 1000;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/**
 * Check if a reminder was already sent for this event+member+type combo.
 */
async function wasAlreadySent(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  recipientEmail: string,
  eventType: string,
  eventId: number,
  reminderType: string
): Promise<boolean> {
  const existing = await db
    .select({ id: reminderLogs.id })
    .from(reminderLogs)
    .where(
      and(
        eq(reminderLogs.recipientEmail, recipientEmail),
        eq(reminderLogs.eventType, eventType as "booking" | "dmlv" | "announcement" | "practice"),
        eq(reminderLogs.eventId, eventId),
        eq(reminderLogs.reminderType, reminderType),
        eq(reminderLogs.status, "sent")
      )
    )
    .limit(1);
  return existing.length > 0;
}

export async function runReminderCheck(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Reminders] Database not available, skipping check.");
    return;
  }

  const now = Date.now();
  console.log(`[Reminders] Running check at ${new Date(now).toISOString()}`);

  // Get all active choir members with emails
  const members = await db
    .select()
    .from(choirMembers)
    .where(and(eq(choirMembers.isActive, true)));

  const emailMembers = members.filter((m) => m.email && m.email.includes("@"));
  if (emailMembers.length === 0) {
    console.log("[Reminders] No active members with email addresses.");
    return;
  }

  let totalSent = 0;

  for (const window of REMINDER_WINDOWS) {
    const targetTime = now + window.offsetMs;
    const windowStart = targetTime - TOLERANCE_MS;
    const windowEnd = targetTime + TOLERANCE_MS;

    // ── DMLV Events ──────────────────────────────────────────────────
    const upcomingDmlv = await db
      .select()
      .from(dmlvEvents)
      .where(
        and(
          eq(dmlvEvents.isActive, true),
          gte(dmlvEvents.eventDate, windowStart),
          lte(dmlvEvents.eventDate, windowEnd)
        )
      );

    for (const event of upcomingDmlv) {
      for (const member of emailMembers) {
        const alreadySent = await wasAlreadySent(
          db,
          member.email!,
          "dmlv",
          event.id,
          window.label
        );
        if (alreadySent) continue;

        const html = buildReminderEmailHtml({
          memberName: member.name,
          eventTitle: event.titleVi || event.title,
          eventDate: formatDate(event.eventDate),
          eventTime: `${event.startTime}${event.endTime ? " – " + event.endTime : ""}`,
          location: event.location || "Nhà thờ Đức Mẹ La Vang",
          eventType: "dmlv",
          reminderType: window.label,
          notes: event.description || undefined,
        });

        const opts: SendEmailOptions = {
          to: member.email!,
          subject:
            window.label === "7day"
              ? `[Ca Đoàn] Nhắc nhở 7 ngày – ${event.titleVi || event.title}`
              : `[Ca Đoàn] Nhắc nhở ngày mai – ${event.titleVi || event.title}`,
          html,
          eventType: "dmlv",
          eventId: event.id,
          reminderType: window.label,
          recipientName: member.name,
        };

        const ok = await sendEmail(opts);
        if (ok) totalSent++;
      }
    }

    // ── Approved Bookings ─────────────────────────────────────────────
    const upcomingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "approved"),
          gte(bookings.eventDate, windowStart),
          lte(bookings.eventDate, windowEnd)
        )
      );

    for (const booking of upcomingBookings) {
      for (const member of emailMembers) {
        const alreadySent = await wasAlreadySent(
          db,
          member.email!,
          "booking",
          booking.id,
          window.label
        );
        if (alreadySent) continue;

        const eventTime = booking.eventStartTime
          ? `${booking.eventStartTime} (Khối: ${booking.startTime} – ${booking.endTime || ""})`
          : `${booking.startTime} – ${booking.endTime || ""}`;

        const html = buildReminderEmailHtml({
          memberName: member.name,
          eventTitle: booking.eventName,
          eventDate: formatDate(booking.eventDate),
          eventTime,
          location: booking.location || "Chưa xác định",
          eventType: "booking",
          reminderType: window.label,
          notes: booking.notes || undefined,
        });

        const opts: SendEmailOptions = {
          to: member.email!,
          subject:
            window.label === "7day"
              ? `[Ca Đoàn] Nhắc nhở 7 ngày – ${booking.eventName}`
              : `[Ca Đoàn] Nhắc nhở ngày mai – ${booking.eventName}`,
          html,
          eventType: "booking",
          eventId: booking.id,
          reminderType: window.label,
          recipientName: member.name,
        };

        const ok = await sendEmail(opts);
        if (ok) totalSent++;
      }
    }

    // ── Practice Sessions ─────────────────────────────────────────────
    const upcomingPractice = await db
      .select()
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.isActive, true),
          gte(practiceSessions.sessionDate, windowStart),
          lte(practiceSessions.sessionDate, windowEnd)
        )
      );

    for (const session of upcomingPractice) {
      for (const member of emailMembers) {
        const alreadySent = await wasAlreadySent(
          db,
          member.email!,
          "practice",
          session.id,
          window.label
        );
        if (alreadySent) continue;

        const html = buildReminderEmailHtml({
          memberName: member.name,
          eventTitle: session.titleVi || session.title,
          eventDate: formatDate(session.sessionDate),
          eventTime: `${session.startTime}${session.endTime ? " – " + session.endTime : ""}`,
          location: session.location || "Phòng tập ca đoàn",
          eventType: "practice",
          reminderType: window.label,
          notes: session.description || undefined,
        });

        const opts: SendEmailOptions = {
          to: member.email!,
          subject:
            window.label === "7day"
              ? `[Ca Đoàn] Nhắc nhở 7 ngày – ${session.titleVi || session.title}`
              : `[Ca Đoàn] Nhắc nhở ngày mai – ${session.titleVi || session.title}`,
          html,
          eventType: "practice",
          eventId: session.id,
          reminderType: window.label,
          recipientName: member.name,
        };

        const ok = await sendEmail(opts);
        if (ok) totalSent++;
      }
    }
  }

  console.log(`[Reminders] Check complete. Sent ${totalSent} reminder emails.`);
}

/**
 * Start the hourly reminder scheduler.
 * Call this once at server startup.
 */
export function startReminderScheduler(): void {
  console.log("[Reminders] Starting hourly reminder scheduler...");

  // Run immediately on startup (after a short delay to let DB connect)
  setTimeout(() => {
    runReminderCheck().catch((err) =>
      console.error("[Reminders] Error during initial check:", err)
    );
  }, 5000);

  // Then run every hour
  setInterval(() => {
    runReminderCheck().catch((err) =>
      console.error("[Reminders] Error during scheduled check:", err)
    );
  }, 60 * 60 * 1000);
}
