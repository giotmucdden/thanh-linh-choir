import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Choir members (ca vien)
export const choirMembers = mysqlTable("choir_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  voicePart: mysqlEnum("voicePart", ["soprano", "alto", "tenor", "bass"]).default("soprano"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChoirMember = typeof choirMembers.$inferSelect;
export type InsertChoirMember = typeof choirMembers.$inferInsert;

// Bookings
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  requesterName: varchar("requesterName", { length: 255 }).notNull(),
  requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
  requesterPhone: varchar("requesterPhone", { length: 30 }),
  eventName: varchar("eventName", { length: 255 }).notNull(),
  eventType: mysqlEnum("eventType", ["wedding", "funeral", "mass", "concert", "other"]).default("mass").notNull(),
  eventDate: bigint("eventDate", { mode: "number" }).notNull(), // UTC ms timestamp
  eventStartTime: varchar("eventStartTime", { length: 10 }), // "HH:MM" — the actual mass/event start time (center of block)
  startTime: varchar("startTime", { length: 10 }).notNull(), // "HH:MM" — block start = eventStartTime - 1h
  endTime: varchar("endTime", { length: 10 }), // "HH:MM" — block end = eventStartTime + 2h
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// Post-approval booking details
export const bookingDetails = mysqlTable("booking_details", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  setlistType: mysqlEnum("setlistType", ["typed", "uploaded"]).default("typed"),
  setlistText: text("setlistText"),
  setlistPdfUrl: varchar("setlistPdfUrl", { length: 1024 }),
  setlistPdfKey: varchar("setlistPdfKey", { length: 512 }),
  uniformDescription: text("uniformDescription"),
  uniformType: mysqlEnum("uniformType", ["formal_white", "formal_black", "casual_blue", "liturgical", "custom"]).default("formal_white"),
  agreementAccepted: boolean("agreementAccepted").default(false).notNull(),
  additionalNotes: text("additionalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingDetails = typeof bookingDetails.$inferSelect;
export type InsertBookingDetails = typeof bookingDetails.$inferInsert;

// DMLV (Duc Me La Vang) mass events
export const dmlvEvents = mysqlTable("dmlv_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleVi: varchar("titleVi", { length: 255 }),
  description: text("description"),
  location: varchar("location", { length: 255 }).default("Nhà thờ Đức Mẹ La Vang"),
  eventDate: bigint("eventDate", { mode: "number" }).notNull(), // UTC ms timestamp
  startTime: varchar("startTime", { length: 10 }).notNull(),
  endTime: varchar("endTime", { length: 10 }),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurringDay: int("recurringDay"), // 0=Sunday, 1=Monday, ...
  recurringWeek: int("recurringWeek"), // 1=first, 2=second, etc. null=every week
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DmlvEvent = typeof dmlvEvents.$inferSelect;
export type InsertDmlvEvent = typeof dmlvEvents.$inferInsert;

// Reminders
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  eventId: int("eventId"), // dmlv event id
  bookingId: int("bookingId"), // booking id
  reminderType: mysqlEnum("reminderType", ["weekly", "one_day", "booking_approved", "booking_rejected"]).notNull(),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(), // UTC ms
  sentAt: bigint("sentAt", { mode: "number" }),
  isSent: boolean("isSent").default(false).notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;
