import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  createBooking,
  createChoirMember,
  createDmlvEvent,
  createReminder,
  deleteChoirMember,
  deleteDmlvEvent,
  getAllBookings,
  getAllChoirMembers,
  getAllDmlvEvents,
  getBookingById,
  getBookingDetailsByBookingId,
  getBookingsByDateRange,
  getBookingsOnDay,
  getDmlvEventsByDateRange,
  getPendingReminders,
  markReminderSent,
  updateBookingStatus,
  updateChoirMember,
  updateDmlvEvent,
  upsertBookingDetails,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Bookings ─────────────────────────────────────────────────────────────
  bookings: router({
    getByDateRange: publicProcedure
      .input(z.object({ startMs: z.number(), endMs: z.number() }))
      .query(({ input }) => getBookingsByDateRange(input.startMs, input.endMs)),

    getAll: adminProcedure.query(() => getAllBookings()),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getBookingById(input.id)),

    create: publicProcedure
      .input(
        z.object({
          requesterName: z.string().min(1),
          requesterEmail: z.string().email(),
          requesterPhone: z.string().optional(),
          eventName: z.string().min(1),
          eventType: z.enum(["wedding", "funeral", "mass", "concert", "other"]),
          eventDate: z.number(),
          // The actual event/mass start time chosen by the user (e.g. "11:00")
          eventStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
          location: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Helper: convert "HH:MM" <-> total minutes
        const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
        const fromMins = (mins: number) => {
          const clamped = Math.max(0, Math.min(mins, 1439));
          return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
        };

        const eventMins = toMins(input.eventStartTime);

        // Block = 1 hour before event + event + 1 hour after (total 3 hours reserved)
        // The event is expected to last ~1 hour; the remaining 1h after is buffer.
        const BEFORE_BUFFER = 60; // minutes before event (choir practice / travel)
        const AFTER_BUFFER  = 60; // minutes after event  (potential overrun / travel to next location)
        const blockStartMins = eventMins - BEFORE_BUFFER;
        const blockEndMins   = eventMins + AFTER_BUFFER + 60; // +60 for ~1h event duration

        if (blockStartMins < 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Giờ sự kiện quá sớm. Vui lòng chọn từ 07:00 trở đi. / Event time too early. Please choose 07:00 or later.",
          });
        }
        if (blockEndMins >= 1440) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Giờ sự kiện quá muộn. Vui lòng chọn trước 21:00. / Event time too late. Please choose before 21:00.",
          });
        }

        const blockStart = fromMins(blockStartMins);
        const blockEnd   = fromMins(blockEndMins);

        // Check for block overlaps on the same day
        const existingOnDay = await getBookingsOnDay(input.eventDate);
        for (const existing of existingOnDay) {
          if (!existing.endTime) continue;
          const exStart = toMins(existing.startTime);
          const exEnd   = toMins(existing.endTime);
          if (blockStartMins < exEnd && blockEndMins > exStart) {
            const existingEvent = existing.eventStartTime
              ? `sự kiện lúc ${existing.eventStartTime}`
              : `"${existing.eventName}"`;
            throw new TRPCError({
              code: "CONFLICT",
              message: `Khung giờ dự phòng ${blockStart}–${blockEnd} bị trùng với ${existingEvent} (khối ${existing.startTime}–${existing.endTime}). Vui lòng chọn giờ khác. / Reserved block ${blockStart}–${blockEnd} overlaps with ${existingEvent} (block ${existing.startTime}–${existing.endTime}).`,
            });
          }
        }

        const id = await createBooking({
          ...input,
          eventStartTime: input.eventStartTime,
          startTime: blockStart,
          endTime: blockEnd,
        });
        await notifyOwner({
          title: "Yêu cầu đặt lịch mới / New Booking Request",
          content: `${input.requesterName} đã yêu cầu đặt lịch cho sự kiện "${input.eventName}" vào ngày ${new Date(input.eventDate).toLocaleDateString("vi-VN")} lúc ${input.eventStartTime} (khối dự phòng: ${blockStart}–${blockEnd}).`,
        });
        return { id };
      }),

    // Return booked time slots for a specific day (for the time picker to show taken slots)
    getTimeSlotsForDay: publicProcedure
      .input(z.object({ dayMs: z.number() }))
      .query(async ({ input }) => {
        const bookingsOnDay = await getBookingsOnDay(input.dayMs);
        return bookingsOnDay.map((b) => ({
          id: b.id,
          eventName: b.eventName,
          eventStartTime: b.eventStartTime ?? b.startTime,
          startTime: b.startTime,   // block start
          endTime: b.endTime ?? "", // block end
          status: b.status,
        }));
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["approved", "rejected"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateBookingStatus(input.id, input.status, input.adminNotes);
        const booking = await getBookingById(input.id);
        if (booking) {
          await notifyOwner({
            title: `Booking ${input.status === "approved" ? "Approved" : "Rejected"}`,
            content: `Booking #${input.id} for "${booking.eventName}" has been ${input.status}.`,
          });
        }
        return { success: true };
      }),

    getDetails: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(({ input }) => getBookingDetailsByBookingId(input.bookingId)),

    saveDetails: adminProcedure
      .input(
        z.object({
          bookingId: z.number(),
          setlistType: z.enum(["typed", "uploaded"]).optional(),
          setlistText: z.string().optional(),
          setlistPdfUrl: z.string().optional(),
          setlistPdfKey: z.string().optional(),
          uniformDescription: z.string().optional(),
          uniformType: z.enum(["formal_white", "formal_black", "casual_blue", "liturgical", "custom"]).optional(),
          agreementAccepted: z.boolean().optional(),
          additionalNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await upsertBookingDetails(input);
        return { success: true };
      }),

    uploadSetlistPdf: adminProcedure
      .input(z.object({ bookingId: z.number(), fileBase64: z.string(), fileName: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `setlists/${input.bookingId}-${nanoid(8)}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, "application/pdf");
        return { url, key };
      }),
  }),

  // ── DMLV Events ──────────────────────────────────────────────────────────
  dmlvEvents: router({
    getAll: publicProcedure.query(() => getAllDmlvEvents()),

    getByDateRange: publicProcedure
      .input(z.object({ startMs: z.number(), endMs: z.number() }))
      .query(({ input }) => getDmlvEventsByDateRange(input.startMs, input.endMs)),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          titleVi: z.string().optional(),
          description: z.string().optional(),
          location: z.string().optional(),
          eventDate: z.number(),
          startTime: z.string(),
          endTime: z.string().optional(),
          isRecurring: z.boolean().default(false),
          recurringDay: z.number().min(0).max(6).optional(),
          recurringWeek: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createDmlvEvent(input);
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          titleVi: z.string().optional(),
          description: z.string().optional(),
          location: z.string().optional(),
          eventDate: z.number().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          isRecurring: z.boolean().optional(),
          recurringDay: z.number().optional(),
          recurringWeek: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateDmlvEvent(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteDmlvEvent(input.id);
        return { success: true };
      }),
  }),

  // ── Choir Members ─────────────────────────────────────────────────────────
  choirMembers: router({
    getAll: adminProcedure.query(() => getAllChoirMembers()),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          voicePart: z.enum(["soprano", "alto", "tenor", "bass"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createChoirMember(input);
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          voicePart: z.enum(["soprano", "alto", "tenor", "bass"]).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateChoirMember(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteChoirMember(input.id);
        return { success: true };
      }),
  }),

  // ── Reminders ─────────────────────────────────────────────────────────────
  reminders: router({
    processPending: adminProcedure.mutation(async () => {
      const pending = await getPendingReminders(Date.now());
      let sent = 0;
      for (const reminder of pending) {
        await notifyOwner({ title: "Nhắc nhở ca viên", content: reminder.message ?? "Nhắc nhở sự kiện sắp tới." });
        await markReminderSent(reminder.id);
        sent++;
      }
      return { sent };
    }),

    scheduleForEvent: adminProcedure
      .input(
        z.object({
          eventId: z.number(),
          eventDateMs: z.number(),
          message: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const members = await getAllChoirMembers();
        const oneDayBefore = input.eventDateMs - 24 * 60 * 60 * 1000;
        const oneWeekBefore = input.eventDateMs - 7 * 24 * 60 * 60 * 1000;
        for (const member of members) {
          await createReminder({
            memberId: member.id,
            eventId: input.eventId,
            reminderType: "one_day",
            scheduledAt: oneDayBefore,
            message: `[1 ngày trước] ${input.message}`,
          });
          await createReminder({
            memberId: member.id,
            eventId: input.eventId,
            reminderType: "weekly",
            scheduledAt: oneWeekBefore,
            message: `[1 tuần trước] ${input.message}`,
          });
        }
        return { success: true, membersNotified: members.length };
      }),
  }),
});

export type AppRouter = typeof appRouter;
