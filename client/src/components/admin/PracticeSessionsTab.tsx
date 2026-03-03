import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X, Loader2, Music, Calendar, Clock, MapPin } from "lucide-react";

interface SessionForm {
  title: string;
  titleVi: string;
  description: string;
  location: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM: SessionForm = {
  title: "",
  titleVi: "",
  description: "",
  location: "",
  sessionDate: "",
  startTime: "19:00",
  endTime: "21:00",
};

export default function PracticeSessionsTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: sessions, isLoading } = trpc.practice.getAll.useQuery();

  const createMutation = trpc.practice.create.useMutation({
    onSuccess: () => {
      toast.success("Đã thêm buổi tập / Practice session added");
      setForm(EMPTY_FORM);
      setShowForm(false);
      utils.practice.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.practice.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật / Updated");
      setEditId(null);
      utils.practice.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.practice.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa / Deleted");
      utils.practice.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!form.title || !form.sessionDate || !form.startTime) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    const sessionDate = new Date(form.sessionDate).getTime();
    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...form, sessionDate });
    } else {
      createMutation.mutate({ ...form, sessionDate });
    }
  };

  const startEdit = (session: NonNullable<typeof sessions>[0]) => {
    setEditId(session.id);
    setForm({
      title: session.title,
      titleVi: session.titleVi ?? "",
      description: session.description ?? "",
      location: session.location ?? "",
      sessionDate: new Date(session.sessionDate).toISOString().split("T")[0],
      startTime: session.startTime,
      endTime: session.endTime ?? "",
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 font-['Be_Vietnam_Pro'] font-semibold"
          style={{ background: "var(--gold)", color: "var(--season-bg)" }}
        >
          <Plus className="w-4 h-4" />
          Thêm Buổi Tập / Add Practice Session
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "var(--season-surface)" }}>
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <Music className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <h3 className="font-['Cormorant_Garamond'] text-lg text-white">
              {editId ? "Chỉnh sửa buổi tập" : "Thêm buổi tập mới"}
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5 font-['Be_Vietnam_Pro']">Tên (EN) *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Weekly Practice"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5 font-['Be_Vietnam_Pro']">Tên (VI)</label>
              <input
                type="text"
                value={form.titleVi}
                onChange={(e) => setForm({ ...form, titleVi: e.target.value })}
                placeholder="Buổi tập hàng tuần"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5 font-['Be_Vietnam_Pro']">Ngày *</label>
              <input
                type="date"
                value={form.sessionDate}
                onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5 font-['Be_Vietnam_Pro']">Giờ bắt đầu *</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5 font-['Be_Vietnam_Pro']">Giờ kết thúc</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5 font-['Be_Vietnam_Pro']">Địa điểm</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Phòng tập ca đoàn"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5 font-['Be_Vietnam_Pro']">Ghi chú</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ghi chú thêm..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-['Be_Vietnam_Pro'] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2 font-['Be_Vietnam_Pro'] font-semibold"
              style={{ background: "var(--gold)", color: "var(--season-bg)" }}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {editId ? "Cập nhật" : "Thêm"}
            </Button>
            <Button variant="outline" onClick={cancelForm} className="flex items-center gap-2 font-['Be_Vietnam_Pro'] border-white/20 text-white hover:bg-white/10">
              <X className="w-4 h-4" /> Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "var(--season-surface)" }}>
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-['Cormorant_Garamond'] text-lg text-white">Lịch Tập / Practice Schedule</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="py-12 text-center text-white/30 font-['Be_Vietnam_Pro'] text-sm">
            Chưa có buổi tập nào / No practice sessions yet
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sessions.map((session) => (
              <div key={session.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/3 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(201,168,76,0.15)" }}>
                    <Music className="w-4 h-4" style={{ color: "var(--gold)" }} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-['Be_Vietnam_Pro'] font-semibold text-sm">{session.titleVi || session.title}</h4>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-white/50 font-['Be_Vietnam_Pro']">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.sessionDate).toLocaleDateString("vi-VN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/50 font-['Be_Vietnam_Pro']">
                        <Clock className="w-3 h-3" />
                        {session.startTime}{session.endTime ? ` – ${session.endTime}` : ""}
                      </span>
                      {session.location && (
                        <span className="flex items-center gap-1 text-xs text-white/50 font-['Be_Vietnam_Pro']">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </span>
                      )}
                    </div>
                    {session.description && (
                      <p className="text-white/40 text-xs font-['Be_Vietnam_Pro'] mt-1">{session.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(session)}
                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Xóa buổi tập này?")) deleteMutation.mutate({ id: session.id });
                    }}
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
