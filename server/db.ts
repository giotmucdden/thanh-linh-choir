import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Booking,
  BookingDetails,
  ChoirMember,
  DmlvEvent,
  InsertBooking,
  InsertBookingDetails,
  InsertChoirMember,
  InsertDmlvEvent,
  InsertReminder,
  InsertUser,
  Reminder,
  bookingDetails,
  bookings,
  choirMembers,
  dmlvEvents,
  reminders,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ── Bookings ───────────────────────────────────────────────────────────────

export async function createBooking(data: InsertBooking): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookings).values(data);
  return Number((result[0] as any).insertId);
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(desc(bookings.eventDate));
}

export async function getBookingsByDateRange(startMs: number, endMs: number): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(and(gte(bookings.eventDate, startMs), lte(bookings.eventDate, endMs)));
}

/**
 * Returns all non-rejected bookings on a specific day (UTC ms date).
 * Used to check for time-slot overlaps before creating a new booking.
 */
export async function getBookingsOnDay(dayMs: number): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  // dayMs is the start-of-day UTC ms; match all bookings whose eventDate falls on the same calendar date
  const dayStart = dayMs;
  const dayEnd = dayMs + 24 * 60 * 60 * 1000 - 1;
  return db
    .select()
    .from(bookings)
    .where(
      and(
        gte(bookings.eventDate, dayStart),
        lte(bookings.eventDate, dayEnd),
        // exclude rejected bookings
        sql`${bookings.status} != 'rejected'`
      )
    );
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function updateBookingStatus(
  id: number,
  status: "pending" | "approved" | "rejected",
  adminNotes?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ status, adminNotes: adminNotes ?? null }).where(eq(bookings.id, id));
}

// ── Booking Details ────────────────────────────────────────────────────────

export async function upsertBookingDetails(data: InsertBookingDetails): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(bookingDetails).where(eq(bookingDetails.bookingId, data.bookingId)).limit(1);
  if (existing.length > 0) {
    await db.update(bookingDetails).set(data).where(eq(bookingDetails.bookingId, data.bookingId));
  } else {
    await db.insert(bookingDetails).values(data);
  }
}

export async function getBookingDetailsByBookingId(bookingId: number): Promise<BookingDetails | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookingDetails).where(eq(bookingDetails.bookingId, bookingId)).limit(1);
  return result[0];
}

// ── DMLV Events ────────────────────────────────────────────────────────────

export async function createDmlvEvent(data: InsertDmlvEvent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dmlvEvents).values(data);
  return Number((result[0] as any).insertId);
}

export async function getAllDmlvEvents(): Promise<DmlvEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dmlvEvents).where(eq(dmlvEvents.isActive, true)).orderBy(dmlvEvents.eventDate);
}

export async function getDmlvEventsByDateRange(startMs: number, endMs: number): Promise<DmlvEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dmlvEvents).where(
    and(eq(dmlvEvents.isActive, true), gte(dmlvEvents.eventDate, startMs), lte(dmlvEvents.eventDate, endMs))
  );
}

export async function updateDmlvEvent(id: number, data: Partial<InsertDmlvEvent>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dmlvEvents).set(data).where(eq(dmlvEvents.id, id));
}

export async function deleteDmlvEvent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dmlvEvents).set({ isActive: false }).where(eq(dmlvEvents.id, id));
}

// ── Choir Members ──────────────────────────────────────────────────────────

export async function getAllChoirMembers(): Promise<ChoirMember[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(choirMembers).where(eq(choirMembers.isActive, true)).orderBy(choirMembers.name);
}

export async function createChoirMember(data: InsertChoirMember): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(choirMembers).values(data);
  return Number((result[0] as any).insertId);
}

export async function updateChoirMember(id: number, data: Partial<InsertChoirMember>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(choirMembers).set(data).where(eq(choirMembers.id, id));
}

export async function deleteChoirMember(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(choirMembers).set({ isActive: false }).where(eq(choirMembers.id, id));
}

// ── Reminders ──────────────────────────────────────────────────────────────

export async function createReminder(data: InsertReminder): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reminders).values(data);
}

export async function getPendingReminders(nowMs: number): Promise<Reminder[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(
    and(eq(reminders.isSent, false), lte(reminders.scheduledAt, nowMs))
  );
}

export async function markReminderSent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reminders).set({ isSent: true, sentAt: Date.now() }).where(eq(reminders.id, id));
}
