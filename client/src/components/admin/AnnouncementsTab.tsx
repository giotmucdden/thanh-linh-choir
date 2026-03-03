import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Send, Paperclip, X, FileText, Image as ImageIcon,
  Clock, Users, CheckCircle, Loader2, Plus, Trash2
} from "lucide-react";

interface AttachmentItem {
  url: string;
  key: string;
  name: string;
  type: string;
}

export default function AnnouncementsTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: announcements, isLoading } = trpc.announcements.getAll.useQuery();
  const { data: emailStatus } = trpc.reminders.getEmailStatus.useQuery();

  const uploadMutation = trpc.announcements.uploadAttachment.useMutation({
    onSuccess: (data) => {
      setAttachments((prev) => [...prev, data]);
      toast.success("Tệp đã tải lên / File uploaded");
    },
    onError: (err) => toast.error(err.message),
  });

  const sendMutation = trpc.announcements.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã gửi đến ${data.sentCount}/${data.totalMembers} ca viên / Sent to ${data.sentCount}/${data.totalMembers} members`);
      setTitle("");
      setBody("");
      setAttachments([]);
      utils.announcements.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Tệp quá lớn (tối đa 10MB)`);
        continue;
      }
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          await uploadMutation.mutateAsync({
            fileBase64: base64,
            fileName: file.name,
            mimeType: file.type,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung / Please enter title and body");
      return;
    }
    sendMutation.mutate({ title, body, attachmentUrls: attachments });
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Email status banner */}
      {emailStatus && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-['Be_Vietnam_Pro'] border ${
          emailStatus.configured
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}>
          {emailStatus.configured ? (
            <><CheckCircle className="w-4 h-4 shrink-0" />
            <span>Email đã cấu hình: <strong>{emailStatus.from}</strong></span></>
          ) : (
            <><X className="w-4 h-4 shrink-0" />
            <span>Email chưa cấu hình. Vui lòng thêm RESEND_API_KEY và EMAIL_FROM trong Secrets.</span></>
          )}
        </div>
      )}

      {/* Composer */}
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "var(--season-surface)" }}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <Send className="w-4 h-4" style={{ color: "var(--gold)" }} />
          <h3 className="font-['Cormorant_Garamond'] text-lg text-white">
            Soạn Thông Báo / Compose Announcement
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-['Be_Vietnam_Pro'] text-white/50 uppercase tracking-wider mb-1.5">
              Tiêu đề / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Lịch tập tuần tới / Next week practice schedule"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-['Be_Vietnam_Pro'] text-white/50 uppercase tracking-wider mb-1.5">
              Nội dung / Message *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors resize-none"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-['Be_Vietnam_Pro'] text-white/50 uppercase tracking-wider mb-1.5">
              Đính kèm / Attachments (tối đa 10MB mỗi tệp)
            </label>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 font-['Be_Vietnam_Pro']"
                  >
                    {getFileIcon(att.type)}
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gold)] transition-colors max-w-[150px] truncate">
                      {att.name}
                    </a>
                    <button onClick={() => removeAttachment(idx)} className="text-white/30 hover:text-red-400 transition-colors ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.mp3,.mp4"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm font-['Be_Vietnam_Pro']"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              {uploading ? "Đang tải lên..." : "Thêm tệp / Add files"}
            </button>
          </div>

          {/* Send button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-white/40 font-['Be_Vietnam_Pro']">
              Sẽ gửi đến tất cả ca viên đang hoạt động có email / Sends to all active members with email
            </p>
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || !title.trim() || !body.trim()}
              className="flex items-center gap-2 font-['Be_Vietnam_Pro'] font-semibold"
              style={{ background: "var(--gold)", color: "var(--season-bg)" }}
            >
              {sendMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
              ) : (
                <><Send className="w-4 h-4" /> Gửi Thông Báo</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "var(--season-surface)" }}>
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-['Cormorant_Garamond'] text-lg text-white">
            Lịch Sử Thông Báo / Announcement History
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="py-12 text-center text-white/30 font-['Be_Vietnam_Pro'] text-sm">
            Chưa có thông báo nào / No announcements yet
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {[...announcements].reverse().map((ann) => {
              const attachs = ann.attachmentUrls ? JSON.parse(ann.attachmentUrls) as AttachmentItem[] : [];
              return (
                <div key={ann.id} className="px-6 py-4 hover:bg-white/3 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-['Be_Vietnam_Pro'] font-semibold text-sm mb-1">{ann.title}</h4>
                      <p className="text-white/50 text-xs font-['Be_Vietnam_Pro'] line-clamp-2">{ann.body}</p>
                      {attachs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {attachs.map((a: AttachmentItem, i: number) => (
                            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/50 hover:text-[var(--gold)] transition-colors">
                              <Paperclip className="w-2.5 h-2.5" />{a.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-white/40 font-['Be_Vietnam_Pro']">
                        <Users className="w-3 h-3" />
                        <span>{ann.recipientCount} người nhận</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/30 font-['Be_Vietnam_Pro'] mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{ann.sentAt ? new Date(ann.sentAt).toLocaleString("vi-VN") : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
