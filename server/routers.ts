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
          startTime: z.string(),
          endTime: z.string().optional(),
          location: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createBooking(input);
        await notifyOwner({
          title: "Yêu cầu đặt lịch mới / New Booking Request",
          content: `${input.requesterName} đã yêu cầu đặt lịch cho sự kiện "${input.eventName}" vào ngày ${new Date(input.eventDate).toLocaleDateString("vi-VN")}.`,
        });
        return { id };
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
