/**
 * Email service using Resend API.
 * All email sending goes through this module.
 */

import { Resend } from "resend";
import { getDb } from "./db";
import { reminderLogs } from "../drizzle/schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Thánh Linh Choir <onboarding@resend.dev>";

export interface EmailAttachment {
  filename: string;
  url: string; // S3 public URL
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  /** For logging */
  eventType?: "booking" | "dmlv" | "announcement" | "practice";
  eventId?: number;
  reminderType?: string;
  recipientName?: string;
}

/**
 * Send an email and log the result to reminder_logs.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
  const db = await getDb();
  let success = true;

  for (const recipient of recipients) {
    try {
      const resendAttachments = opts.attachments?.map((a) => ({
        filename: a.filename,
        path: a.url,
      }));

      await resend.emails.send({
        from: FROM,
        to: recipient,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        attachments: resendAttachments,
      });

      // Log success
      if (db && opts.eventType) {
        await db.insert(reminderLogs).values({
          eventType: opts.eventType,
          eventId: opts.eventId ?? null,
          recipientName: opts.recipientName ?? null,
          recipientEmail: recipient,
          subject: opts.subject,
          reminderType: opts.reminderType ?? null,
          status: "sent",
          sentAt: Date.now(),
        });
      }
    } catch (err: unknown) {
      success = false;
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[Email] Failed to send to ${recipient}:`, errorMessage);

      if (db && opts.eventType) {
        await db.insert(reminderLogs).values({
          eventType: opts.eventType,
          eventId: opts.eventId ?? null,
          recipientName: opts.recipientName ?? null,
          recipientEmail: recipient,
          subject: opts.subject,
          reminderType: opts.reminderType ?? null,
          status: "failed",
          errorMessage,
          sentAt: Date.now(),
        });
      }
    }
  }

  return success;
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function buildReminderEmailHtml(opts: {
  memberName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  eventType: "booking" | "dmlv" | "practice";
  reminderType: "7day" | "1day";
  notes?: string;
}): string {
  const daysText = opts.reminderType === "7day" ? "7 ngày nữa" : "ngày mai";
  const daysTextEn = opts.reminderType === "7day" ? "in 7 days" : "tomorrow";
  const typeLabel =
    opts.eventType === "booking"
      ? "Thánh Lễ / Sự Kiện"
      : opts.eventType === "dmlv"
        ? "Thánh Lễ DMLV"
        : "Buổi Tập Ca Đoàn";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nhắc Nhở Ca Đoàn Thánh Linh</title>
</head>
<body style="margin:0;padding:0;background:#0f1729;font-family:'Georgia',serif;">
  <div style="max-width:600px;margin:0 auto;background:#0f1729;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a2540 0%,#0f1729 100%);padding:40px 32px;text-align:center;border-bottom:2px solid #c9a84c;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;border:2px solid #c9a84c;line-height:56px;font-size:24px;margin-bottom:16px;">🎵</div>
      <h1 style="margin:0;color:#c9a84c;font-size:26px;font-weight:400;letter-spacing:2px;">CA ĐOÀN THÁNH LINH</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:4px;text-transform:uppercase;">Nhắc Nhở Lịch</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">
      <p style="color:rgba(255,255,255,0.8);font-size:16px;margin:0 0 24px;">
        Kính gửi <strong style="color:#c9a84c;">${opts.memberName}</strong>,
      </p>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 32px;">
        Đây là nhắc nhở rằng bạn có <strong style="color:white;">${typeLabel}</strong> vào <strong style="color:#c9a84c;">${daysText}</strong> (${daysTextEn}).
      </p>

      <!-- Event card -->
      <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3);border-radius:12px;padding:24px;margin-bottom:32px;">
        <h2 style="margin:0 0 16px;color:white;font-size:20px;font-weight:600;">${opts.eventTitle}</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;width:100px;">📅 Ngày</td>
            <td style="padding:6px 0;color:white;font-size:14px;font-weight:500;">${opts.eventDate}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">⏰ Giờ</td>
            <td style="padding:6px 0;color:white;font-size:14px;font-weight:500;">${opts.eventTime}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">📍 Địa điểm</td>
            <td style="padding:6px 0;color:white;font-size:14px;font-weight:500;">${opts.location}</td>
          </tr>
          ${opts.notes ? `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;vertical-align:top;">📝 Ghi chú</td><td style="padding:6px 0;color:rgba(255,255,255,0.8);font-size:13px;">${opts.notes}</td></tr>` : ""}
        </table>
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin:0;">
        Xin vui lòng có mặt đúng giờ. Nếu có bất kỳ thắc mắc nào, hãy liên hệ với trưởng ca đoàn.<br/>
        <em>Please be present on time. Contact the choir director for any questions.</em>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;letter-spacing:1px;">
        CA ĐOÀN THÁNH LINH · Email tự động · Vui lòng không trả lời email này
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function buildAnnouncementEmailHtml(opts: {
  title: string;
  body: string;
  attachments?: { name: string; url: string; type: string }[];
}): string {
  const attachmentSection =
    opts.attachments && opts.attachments.length > 0
      ? `
    <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);">
      <p style="color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Đính kèm / Attachments</p>
      ${opts.attachments
        .map(
          (a) =>
            `<a href="${a.url}" style="display:inline-block;margin:4px 8px 4px 0;padding:8px 16px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);border-radius:8px;color:#c9a84c;text-decoration:none;font-size:13px;">📎 ${a.name}</a>`
        )
        .join("")}
    </div>`
      : "";

  // Convert newlines to <br> for HTML
  const bodyHtml = opts.body.replace(/\n/g, "<br/>");

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#0f1729;font-family:'Georgia',serif;">
  <div style="max-width:600px;margin:0 auto;background:#0f1729;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a2540 0%,#0f1729 100%);padding:40px 32px;text-align:center;border-bottom:2px solid #c9a84c;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;border:2px solid #c9a84c;line-height:56px;font-size:24px;margin-bottom:16px;">📢</div>
      <h1 style="margin:0;color:#c9a84c;font-size:26px;font-weight:400;letter-spacing:2px;">CA ĐOÀN THÁNH LINH</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:4px;text-transform:uppercase;">Thông Báo</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="margin:0 0 24px;color:white;font-size:22px;font-weight:600;line-height:1.4;">${opts.title}</h2>
      <div style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;">${bodyHtml}</div>
      ${attachmentSection}
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;letter-spacing:1px;">
        CA ĐOÀN THÁNH LINH · Email tự động · Vui lòng không trả lời email này
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Quick test — verify Resend credentials are valid by checking the API key format.
 * Returns true if key is present and non-empty.
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_"));
}
