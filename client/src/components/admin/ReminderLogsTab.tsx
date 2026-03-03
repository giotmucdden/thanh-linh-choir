import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Clock, Mail, Loader2, RefreshCw,
  Bell, Calendar, Music, Megaphone
} from "lucide-react";

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  dmlv: { label: "DMLV", icon: <Calendar className="w-3 h-3" />, color: "text-purple-400" },
  booking: { label: "Booking", icon: <Calendar className="w-3 h-3" />, color: "text-blue-400" },
  practice: { label: "Tập ca", icon: <Music className="w-3 h-3" />, color: "text-emerald-400" },
  announcement: { label: "Thông báo", icon: <Megaphone className="w-3 h-3" />, color: "text-amber-400" },
};

const REMINDER_TYPE_LABELS: Record<string, string> = {
  "7day": "7 ngày trước",
  "1day": "1 ngày trước",
  announcement: "Thông báo",
};

export default function ReminderLogsTab() {
  const { data: logs, isLoading, refetch } = trpc.reminders.getLogs.useQuery({ limit: 150 });
  const { data: emailStatus } = trpc.reminders.getEmailStatus.useQuery();

  const runNowMutation = trpc.reminders.runNow.useMutation({
    onSuccess: () => {
      toast.success("Đã chạy kiểm tra nhắc nhở / Reminder check completed");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const sentCount = logs?.filter((l) => l.status === "sent").length ?? 0;
  const failedCount = logs?.filter((l) => l.status === "failed").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Status + actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 p-5" style={{ background: "var(--season-surface)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <span className="text-xs text-white/50 font-['Be_Vietnam_Pro'] uppercase tracking-wider">Email Service</span>
          </div>
          <p className={`text-sm font-['Be_Vietnam_Pro'] font-semibold ${emailStatus?.configured ? "text-emerald-400" : "text-amber-400"}`}>
            {emailStatus?.configured ? "✓ Đã cấu hình" : "⚠ Chưa cấu hình"}
          </p>
          {emailStatus?.from && (
            <p className="text-xs text-white/30 font-['Be_Vietnam_Pro'] mt-0.5 truncate">{emailStatus.from}</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 p-5" style={{ background: "var(--season-surface)" }}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/50 font-['Be_Vietnam_Pro'] uppercase tracking-wider">Đã gửi / Sent</span>
          </div>
          <p className="text-2xl font-['Cormorant_Garamond'] text-white">{sentCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-5" style={{ background: "var(--season-surface)" }}>
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-white/50 font-['Be_Vietnam_Pro'] uppercase tracking-wider">Lỗi / Failed</span>
          </div>
          <p className="text-2xl font-['Cormorant_Garamond'] text-white">{failedCount}</p>
        </div>
      </div>

      {/* Manual trigger */}
      <div className="rounded-2xl border border-white/10 p-5 flex items-center justify-between" style={{ background: "var(--season-surface)" }}>
        <div>
          <h4 className="text-white font-['Be_Vietnam_Pro'] font-semibold text-sm">Chạy kiểm tra ngay / Run check now</h4>
          <p className="text-white/40 text-xs font-['Be_Vietnam_Pro'] mt-0.5">
            Hệ thống tự động kiểm tra mỗi giờ. Bấm để chạy ngay lập tức.
          </p>
        </div>
        <Button
          onClick={() => runNowMutation.mutate()}
          disabled={runNowMutation.isPending}
          variant="outline"
          className="flex items-center gap-2 font-['Be_Vietnam_Pro'] border-white/20 text-white hover:bg-white/10"
        >
          {runNowMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Chạy ngay
        </Button>
      </div>

      {/* Logs table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "var(--season-surface)" }}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: "var(--gold)" }} />
          <h3 className="font-['Cormorant_Garamond'] text-lg text-white">
            Lịch Sử Gửi Email / Email Send Log
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="py-12 text-center text-white/30 font-['Be_Vietnam_Pro'] text-sm">
            Chưa có lịch sử gửi email / No email history yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-['Be_Vietnam_Pro']">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs text-white/40 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs text-white/40 uppercase tracking-wider">Người nhận</th>
                  <th className="px-4 py-3 text-left text-xs text-white/40 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-4 py-3 text-left text-xs text-white/40 uppercase tracking-wider">Loại</th>
                  <th className="px-4 py-3 text-left text-xs text-white/40 uppercase tracking-wider">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...logs].reverse().map((log) => {
                  const typeInfo = EVENT_TYPE_LABELS[log.eventType ?? ""] ?? { label: log.eventType ?? "—", icon: null, color: "text-white/50" };
                  return (
                    <tr key={log.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        {log.status === "sent" ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Đã gửi
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-3.5 h-3.5" /> Lỗi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white/80 text-xs">{log.recipientName ?? "—"}</div>
                        <div className="text-white/40 text-[11px]">{log.recipientEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-white/70 text-xs max-w-[200px] truncate">{log.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs ${typeInfo.color}`}>
                          {typeInfo.icon}
                          {typeInfo.label}
                          {log.reminderType && log.reminderType !== "announcement" && (
                            <span className="text-white/30 ml-1">
                              ({REMINDER_TYPE_LABELS[log.reminderType] ?? log.reminderType})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString("vi-VN") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
