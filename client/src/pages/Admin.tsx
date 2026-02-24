import { useState } from "react";
import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import {
  LayoutDashboard, Calendar, Users, Bell, LogOut, ChevronRight,
  CheckCircle, XCircle, Clock, Eye, FileText, Music2, Plus, Trash2,
  Edit, Send, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

// ── Sub-components ──────────────────────────────────────────────────────────

function BookingDetailsForm({ bookingId, onClose }: { bookingId: number; onClose: () => void }) {
  const { lang } = useLang();
  const { data: details } = trpc.bookings.getDetails.useQuery({ bookingId });
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    setlistType: (details?.setlistType ?? "typed") as "typed" | "uploaded",
    setlistText: details?.setlistText ?? "",
    uniformType: (details?.uniformType ?? "formal_white") as "formal_white" | "formal_black" | "casual_blue" | "liturgical" | "custom",
    uniformDescription: details?.uniformDescription ?? "",
    agreementAccepted: details?.agreementAccepted ?? false,
    additionalNotes: details?.additionalNotes ?? "",
    setlistPdfUrl: details?.setlistPdfUrl ?? "",
    setlistPdfKey: details?.setlistPdfKey ?? "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const saveDetails = trpc.bookings.saveDetails.useMutation({
    onSuccess: () => {
      utils.bookings.getDetails.invalidate({ bookingId });
      toast.success(t(lang, "success"));
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadPdf = trpc.bookings.uploadSetlistPdf.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({ ...f, setlistPdfUrl: data.url, setlistPdfKey: data.key }));
      toast.success(lang === "vi" ? "Tải lên thành công" : "Uploaded successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadPdf.mutate({ bookingId, fileBase64: base64, fileName: pdfFile.name });
    };
    reader.readAsDataURL(pdfFile);
  };

  const uniformOptions = [
    { value: "formal_white", label: t(lang, "uniform_formal_white") },
    { value: "formal_black", label: t(lang, "uniform_formal_black") },
    { value: "casual_blue", label: t(lang, "uniform_casual_blue") },
    { value: "liturgical", label: t(lang, "uniform_liturgical") },
    { value: "custom", label: t(lang, "uniform_custom") },
  ];

  return (
    <div className="space-y-5">
      {/* Setlist */}
      <div>
        <Label className="font-['Be_Vietnam_Pro'] font-semibold text-sm mb-2 block">{t(lang, "admin_setlist")}</Label>
        <Tabs value={form.setlistType} onValueChange={(v) => setForm({ ...form, setlistType: v as "typed" | "uploaded" })}>
          <TabsList className="mb-3">
            <TabsTrigger value="typed" className="font-['Be_Vietnam_Pro'] text-xs">{t(lang, "admin_setlist_type")}</TabsTrigger>
            <TabsTrigger value="uploaded" className="font-['Be_Vietnam_Pro'] text-xs">{t(lang, "admin_setlist_upload")}</TabsTrigger>
          </TabsList>
          <TabsContent value="typed">
            <Textarea
              value={form.setlistText}
              onChange={(e) => setForm({ ...form, setlistText: e.target.value })}
              rows={6}
              className="font-['Be_Vietnam_Pro'] text-sm resize-none"
              placeholder={lang === "vi" ? "1. Kinh Vinh Danh\n2. Thánh Thánh Thánh\n3. Alleluia..." : "1. Gloria\n2. Holy Holy Holy\n3. Alleluia..."}
            />
          </TabsContent>
          <TabsContent value="uploaded">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  className="font-['Be_Vietnam_Pro'] text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePdfUpload}
                  disabled={!pdfFile || uploadPdf.isPending}
                  className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] shrink-0"
                >
                  {uploadPdf.isPending ? "..." : lang === "vi" ? "Tải lên" : "Upload"}
                </Button>
              </div>
              {form.setlistPdfUrl && (
                <a
                  href={form.setlistPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--gold)] hover:underline font-['Be_Vietnam_Pro'] text-sm"
                >
                  <FileText className="w-4 h-4" />
                  {lang === "vi" ? "Xem PDF đã tải lên" : "View uploaded PDF"}
                </a>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Uniform */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-['Be_Vietnam_Pro'] font-semibold text-sm mb-2 block">{t(lang, "admin_uniform")}</Label>
          <Select value={form.uniformType} onValueChange={(v) => setForm({ ...form, uniformType: v as typeof form.uniformType })}>
            <SelectTrigger className="font-['Be_Vietnam_Pro'] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {uniformOptions.map((u) => (
                <SelectItem key={u.value} value={u.value} className="font-['Be_Vietnam_Pro'] text-sm">
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] font-semibold text-sm mb-2 block">
            {lang === "vi" ? "Mô tả thêm" : "Additional description"}
          </Label>
          <Input
            value={form.uniformDescription}
            onChange={(e) => setForm({ ...form, uniformDescription: e.target.value })}
            className="font-['Be_Vietnam_Pro'] text-sm"
            placeholder={lang === "vi" ? "Khăn quàng trắng..." : "White sash..."}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="font-['Be_Vietnam_Pro'] font-semibold text-sm mb-2 block">{t(lang, "admin_notes")}</Label>
        <Textarea
          value={form.additionalNotes}
          onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
          rows={3}
          className="font-['Be_Vietnam_Pro'] text-sm resize-none"
          placeholder={lang === "vi" ? "Ghi chú thêm cho ca viên..." : "Additional notes for choir members..."}
        />
      </div>

      {/* Agreement */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
        <Checkbox
          id="agreement"
          checked={form.agreementAccepted}
          onCheckedChange={(v) => setForm({ ...form, agreementAccepted: !!v })}
        />
        <Label htmlFor="agreement" className="font-['Be_Vietnam_Pro'] text-sm leading-relaxed cursor-pointer">
          {lang === "vi"
            ? "Xác nhận rằng tất cả thông tin đã được xem xét và thỏa thuận với người đặt lịch."
            : "Confirm that all information has been reviewed and agreed upon with the requester."}
        </Label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} className="font-['Be_Vietnam_Pro']">{t(lang, "cancel")}</Button>
        <Button
          onClick={() => saveDetails.mutate({ bookingId, ...form })}
          disabled={saveDetails.isPending}
          className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold"
        >
          {saveDetails.isPending ? t(lang, "loading") : t(lang, "admin_save")}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Main Admin Page ─────────────────────────────────────────────────────────

type AdminTab = "bookings" | "members" | "events" | "reminders";

export default function Admin() {
  const { lang } = useLang();
  // Auth removed - always admin access
  const user = { role: "admin", name: "Admin" };
  const loading = false;
  const [activeTab, setActiveTab] = useState<AdminTab>("bookings");
  const [detailsBookingId, setDetailsBookingId] = useState<number | null>(null);
  const [rejectBookingId, setRejectBookingId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", phone: "", voicePart: "soprano" as "soprano" | "alto" | "tenor" | "bass" });
  const [newEvent, setNewEvent] = useState({ title: "", titleVi: "", description: "", location: "Nhà thờ Đức Mẹ La Vang", eventDate: "", startTime: "08:00", endTime: "10:00", isRecurring: false });

  const utils = trpc.useUtils();

  // Queries
  const { data: bookings = [], isLoading: bookingsLoading } = trpc.bookings.getAll.useQuery();
  const { data: members = [], isLoading: membersLoading } = trpc.choirMembers.getAll.useQuery();
  const { data: dmlvEvents = [], isLoading: eventsLoading } = trpc.dmlvEvents.getAll.useQuery();

  // Mutations
  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => { utils.bookings.getAll.invalidate(); toast.success(t(lang, "success")); },
    onError: (e) => toast.error(e.message),
  });
  const createMember = trpc.choirMembers.create.useMutation({
    onSuccess: () => { utils.choirMembers.getAll.invalidate(); setShowAddMember(false); toast.success(t(lang, "success")); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMember = trpc.choirMembers.delete.useMutation({
    onSuccess: () => { utils.choirMembers.getAll.invalidate(); toast.success(t(lang, "success")); },
    onError: (e) => toast.error(e.message),
  });
  const createEvent = trpc.dmlvEvents.create.useMutation({
    onSuccess: () => { utils.dmlvEvents.getAll.invalidate(); setShowAddEvent(false); toast.success(t(lang, "success")); },
    onError: (e) => toast.error(e.message),
  });
  const deleteEvent = trpc.dmlvEvents.delete.useMutation({
    onSuccess: () => { utils.dmlvEvents.getAll.invalidate(); toast.success(t(lang, "success")); },
    onError: (e) => toast.error(e.message),
  });
  const scheduleReminders = trpc.reminders.scheduleForEvent.useMutation({
    onSuccess: (data) => toast.success(`${t(lang, "reminder_sent")}: ${data.membersNotified} ${lang === "vi" ? "ca viên" : "members"}`),
    onError: (e) => toast.error(e.message),
  });

  // Auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-['Be_Vietnam_Pro'] text-muted-foreground text-sm">{t(lang, "loading")}</p>
        </div>
      </div>
    );
  }

  // Stats
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;
  const rejectedCount = bookings.filter((b) => b.status === "rejected").length;

  const navItems: { tab: AdminTab; icon: typeof LayoutDashboard; label: string }[] = [
    { tab: "bookings", icon: Calendar, label: t(lang, "admin_bookings") },
    { tab: "members", icon: Users, label: t(lang, "admin_members") },
    { tab: "events", icon: Music2, label: t(lang, "admin_events") },
    { tab: "reminders", icon: Bell, label: t(lang, "admin_reminders") },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-40 shadow-xl">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
              <Music2 className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <div className="font-['Cormorant_Garamond'] text-base font-semibold text-sidebar-foreground leading-none">
                Thánh Linh
              </div>
              <div className="font-['Be_Vietnam_Pro'] text-[10px] text-sidebar-primary tracking-widest uppercase">
                Admin
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-['Be_Vietnam_Pro'] text-sm ${
                activeTab === tab
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {tab === "bookings" && pendingCount > 0 && (
                <span className="ml-auto bg-[var(--gold)] text-[oklch(0.15_0.03_240)] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-semibold text-sidebar-foreground">{user.name?.charAt(0) ?? "A"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-['Be_Vietnam_Pro'] text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="font-['Be_Vietnam_Pro'] text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground font-['Be_Vietnam_Pro'] text-xs transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            {lang === "vi" ? "Về trang chủ" : "Back to site"}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        {/* ── Bookings Tab ── */}
        {activeTab === "bookings" && (
          <div>
            <div className="mb-8">
              <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-foreground mb-1">{t(lang, "admin_bookings")}</h1>
              <p className="font-['Be_Vietnam_Pro'] text-muted-foreground text-sm">{lang === "vi" ? "Quản lý và xét duyệt các yêu cầu đặt lịch" : "Manage and approve booking requests"}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: t(lang, "admin_pending"), value: pendingCount, color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
                { label: t(lang, "admin_approved"), value: approvedCount, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle },
                { label: t(lang, "admin_rejected"), value: rejectedCount, color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <Card key={label} className="border-border">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <div className={`font-['Cormorant_Garamond'] text-3xl font-bold ${color}`}>{value}</div>
                      <div className="font-['Be_Vietnam_Pro'] text-xs text-muted-foreground">{label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bookings list */}
            {bookingsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground font-['Be_Vietnam_Pro']">{t(lang, "no_data")}</div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="border-border hover:border-[var(--gold)/30] transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold text-foreground">{booking.eventName}</h3>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-['Be_Vietnam_Pro'] ${
                                booking.status === "approved" ? "bg-emerald-500/15 text-emerald-600" :
                                booking.status === "rejected" ? "bg-red-500/15 text-red-600" :
                                "bg-amber-500/15 text-amber-600"
                              }`}
                            >
                              {t(lang, `admin_${booking.status}` as any)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground font-['Be_Vietnam_Pro']">
                            <span>👤 {booking.requesterName}</span>
                            <span>📧 {booking.requesterEmail}</span>
                            <span>📅 {format(new Date(booking.eventDate), "dd/MM/yyyy")}</span>
                            <span className="flex flex-col gap-0.5">
                              {booking.eventStartTime && (
                                <span className="text-foreground font-semibold">⛪ {lang === "vi" ? "Lễ" : "Event"}: {booking.eventStartTime}</span>
                              )}
                              <span className="text-[10px]">🕐 {lang === "vi" ? "Khối" : "Block"}: {booking.startTime}{booking.endTime ? `–${booking.endTime}` : ""}</span>
                            </span>
                          </div>
                          {booking.location && <p className="text-xs text-muted-foreground mt-1 font-['Be_Vietnam_Pro']">📍 {booking.location}</p>}
                          {booking.notes && <p className="text-xs text-muted-foreground mt-1 font-['Be_Vietnam_Pro'] italic">"{booking.notes}"</p>}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {booking.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-['Be_Vietnam_Pro'] text-xs gap-1"
                                onClick={() => updateStatus.mutate({ id: booking.id, status: "approved" })}
                                disabled={updateStatus.isPending}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {t(lang, "admin_approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-500 hover:bg-red-500/10 font-['Be_Vietnam_Pro'] text-xs gap-1"
                                onClick={() => { setRejectBookingId(booking.id); setRejectNotes(""); }}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {t(lang, "admin_reject")}
                              </Button>
                            </>
                          )}
                          {booking.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[var(--gold)/30] text-[var(--gold-dark)] hover:bg-[var(--gold)/10] font-['Be_Vietnam_Pro'] text-xs gap-1"
                              onClick={() => setDetailsBookingId(booking.id)}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {t(lang, "admin_details")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Members Tab ── */}
        {activeTab === "members" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-foreground mb-1">{t(lang, "admin_members")}</h1>
                <p className="font-['Be_Vietnam_Pro'] text-muted-foreground text-sm">{lang === "vi" ? "Danh sách ca viên" : "Choir member directory"}</p>
              </div>
              <Button
                className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold gap-1"
                onClick={() => setShowAddMember(true)}
              >
                <Plus className="w-4 h-4" />
                {t(lang, "add")}
              </Button>
            </div>

            {membersLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : members.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground font-['Be_Vietnam_Pro']">{t(lang, "no_data")}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <Card key={member.id} className="border-border hover:border-[var(--gold)/30] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--gold)/15] flex items-center justify-center">
                            <span className="font-['Cormorant_Garamond'] text-[var(--gold-dark)] font-semibold text-lg">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-['Be_Vietnam_Pro'] font-semibold text-sm text-foreground">{member.name}</p>
                            {member.email && <p className="font-['Be_Vietnam_Pro'] text-xs text-muted-foreground">{member.email}</p>}
                            {member.phone && <p className="font-['Be_Vietnam_Pro'] text-xs text-muted-foreground">{member.phone}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="text-[10px] font-['Be_Vietnam_Pro'] capitalize">{member.voicePart}</Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-muted-foreground hover:text-red-500"
                            onClick={() => deleteMember.mutate({ id: member.id })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DMLV Events Tab ── */}
        {activeTab === "events" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-foreground mb-1">{t(lang, "admin_events")}</h1>
                <p className="font-['Be_Vietnam_Pro'] text-muted-foreground text-sm">{lang === "vi" ? "Quản lý sự kiện Đức Mẹ La Vang" : "Manage DMLV mass events"}</p>
              </div>
              <Button
                className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold gap-1"
                onClick={() => setShowAddEvent(true)}
              >
                <Plus className="w-4 h-4" />
                {t(lang, "add")}
              </Button>
            </div>

            {eventsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : dmlvEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground font-['Be_Vietnam_Pro']">{t(lang, "no_data")}</div>
            ) : (
              <div className="space-y-3">
                {dmlvEvents.map((event) => (
                  <Card key={event.id} className="border-border hover:border-[var(--gold)/30] transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold text-foreground">
                              {event.titleVi ?? event.title}
                            </h3>
                            {event.isRecurring && (
                              <Badge variant="secondary" className="text-[10px] font-['Be_Vietnam_Pro'] bg-[var(--gold)/15] text-[var(--gold-dark)]">
                                {lang === "vi" ? "Định kỳ" : "Recurring"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-['Be_Vietnam_Pro']">
                            <span>📅 {format(new Date(event.eventDate), "dd/MM/yyyy")}</span>
                            <span>⏰ {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</span>
                            {event.location && <span>📍 {event.location}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-['Be_Vietnam_Pro'] text-xs gap-1 border-[var(--gold)/30] text-[var(--gold-dark)] hover:bg-[var(--gold)/10]"
                            onClick={() => scheduleReminders.mutate({
                              eventId: event.id,
                              eventDateMs: event.eventDate,
                              message: `${lang === "vi" ? "Nhắc nhở: " : "Reminder: "}${event.titleVi ?? event.title} - ${format(new Date(event.eventDate), "dd/MM/yyyy")} lúc ${event.startTime}`,
                            })}
                            disabled={scheduleReminders.isPending}
                          >
                            <Bell className="w-3.5 h-3.5" />
                            {t(lang, "reminder_send")}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-muted-foreground hover:text-red-500"
                            onClick={() => deleteEvent.mutate({ id: event.id })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reminders Tab ── */}
        {activeTab === "reminders" && (
          <div>
            <div className="mb-8">
              <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-foreground mb-1">{t(lang, "admin_reminders")}</h1>
              <p className="font-['Be_Vietnam_Pro'] text-muted-foreground text-sm">{lang === "vi" ? "Gửi nhắc nhở cho ca viên" : "Send reminders to choir members"}</p>
            </div>
            <Card className="border-border max-w-lg">
              <CardHeader>
                <CardTitle className="font-['Cormorant_Garamond'] text-xl">{lang === "vi" ? "Nhắc Nhở Tự Động" : "Automated Reminders"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-['Be_Vietnam_Pro'] text-sm text-muted-foreground">
                  {lang === "vi"
                    ? "Hệ thống tự động gửi nhắc nhở cho tất cả ca viên 1 tuần và 1 ngày trước mỗi sự kiện ĐMLV. Để lên lịch nhắc nhở cho một sự kiện cụ thể, hãy vào tab Sự Kiện ĐMLV và nhấn nút Gửi Nhắc Nhở."
                    : "The system automatically schedules reminders for all choir members 1 week and 1 day before each DMLV event. To schedule reminders for a specific event, go to the DMLV Events tab and click Send Reminders."}
                </p>
                <div className="space-y-2">
                  {[
                    { icon: Bell, label: lang === "vi" ? "Nhắc nhở 1 tuần trước" : "1-week advance reminder", desc: lang === "vi" ? "Gửi cho tất cả ca viên" : "Sent to all choir members" },
                    { icon: Bell, label: lang === "vi" ? "Nhắc nhở 1 ngày trước" : "1-day advance reminder", desc: lang === "vi" ? "Gửi cho tất cả ca viên" : "Sent to all choir members" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <Icon className="w-4 h-4 text-[var(--gold)]" />
                      <div>
                        <p className="font-['Be_Vietnam_Pro'] text-sm font-medium text-foreground">{label}</p>
                        <p className="font-['Be_Vietnam_Pro'] text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="font-['Be_Vietnam_Pro'] text-xs text-muted-foreground">
                  {lang === "vi" ? `Hiện có ${members.length} ca viên trong hệ thống.` : `Currently ${members.length} choir members in the system.`}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* ── Booking Details Dialog ── */}
      <Dialog open={detailsBookingId !== null} onOpenChange={() => setDetailsBookingId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Cormorant_Garamond'] text-2xl">{t(lang, "admin_details")}</DialogTitle>
          </DialogHeader>
          {detailsBookingId && (
            <BookingDetailsForm bookingId={detailsBookingId} onClose={() => setDetailsBookingId(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectBookingId !== null} onOpenChange={() => setRejectBookingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Cormorant_Garamond'] text-xl">{t(lang, "admin_reject")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "admin_notes")}</Label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              className="font-['Be_Vietnam_Pro'] text-sm resize-none"
              placeholder={lang === "vi" ? "Lý do từ chối..." : "Reason for rejection..."}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectBookingId(null)} className="font-['Be_Vietnam_Pro']">{t(lang, "cancel")}</Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white font-['Be_Vietnam_Pro'] font-semibold"
              onClick={() => {
                if (rejectBookingId) {
                  updateStatus.mutate({ id: rejectBookingId, status: "rejected", adminNotes: rejectNotes });
                  setRejectBookingId(null);
                }
              }}
            >
              {t(lang, "admin_reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ── */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Cormorant_Garamond'] text-xl">{lang === "vi" ? "Thêm Ca Viên" : "Add Choir Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "name")} *</Label>
              <Input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "email")}</Label>
                <Input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" />
              </div>
              <div>
                <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "phone")}</Label>
                <Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" />
              </div>
            </div>
            <div>
              <Label className="font-['Be_Vietnam_Pro'] text-sm">{lang === "vi" ? "Bè" : "Voice Part"}</Label>
              <Select value={newMember.voicePart} onValueChange={(v) => setNewMember({ ...newMember, voicePart: v as typeof newMember.voicePart })}>
                <SelectTrigger className="mt-1 font-['Be_Vietnam_Pro']"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["soprano", "alto", "tenor", "bass"].map((v) => (
                    <SelectItem key={v} value={v} className="font-['Be_Vietnam_Pro'] capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)} className="font-['Be_Vietnam_Pro']">{t(lang, "cancel")}</Button>
            <Button
              className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold"
              onClick={() => newMember.name && createMember.mutate(newMember)}
              disabled={!newMember.name || createMember.isPending}
            >
              {t(lang, "add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add DMLV Event Dialog ── */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Cormorant_Garamond'] text-xl">{lang === "vi" ? "Thêm Sự Kiện ĐMLV" : "Add DMLV Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-['Be_Vietnam_Pro'] text-sm">{lang === "vi" ? "Tên (VI)" : "Title (VI)"} *</Label>
                <Input value={newEvent.titleVi} onChange={(e) => setNewEvent({ ...newEvent, titleVi: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" placeholder="Lễ ĐMLV tháng 3" />
              </div>
              <div>
                <Label className="font-['Be_Vietnam_Pro'] text-sm">{lang === "vi" ? "Tên (EN)" : "Title (EN)"}</Label>
                <Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" placeholder="DMLV Mass March" />
              </div>
            </div>
            <div>
              <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "booking_date")} *</Label>
              <Input type="date" value={newEvent.eventDate} onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "booking_start_time")}</Label>
                <Input type="time" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" />
              </div>
              <div>
                <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "booking_end_time")}</Label>
                <Input type="time" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" />
              </div>
            </div>
            <div>
              <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "location")}</Label>
              <Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} className="mt-1 font-['Be_Vietnam_Pro']" />
            </div>
            <div>
              <Label className="font-['Be_Vietnam_Pro'] text-sm">{t(lang, "notes")}</Label>
              <Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} rows={2} className="mt-1 font-['Be_Vietnam_Pro'] resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="recurring" checked={newEvent.isRecurring} onCheckedChange={(v) => setNewEvent({ ...newEvent, isRecurring: !!v })} />
              <Label htmlFor="recurring" className="font-['Be_Vietnam_Pro'] text-sm cursor-pointer">{lang === "vi" ? "Sự kiện định kỳ" : "Recurring event"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEvent(false)} className="font-['Be_Vietnam_Pro']">{t(lang, "cancel")}</Button>
            <Button
              className="bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold"
              onClick={() => {
                if (!newEvent.titleVi && !newEvent.title) return;
                if (!newEvent.eventDate) return;
                createEvent.mutate({
                  title: newEvent.title || newEvent.titleVi,
                  titleVi: newEvent.titleVi || undefined,
                  description: newEvent.description || undefined,
                  location: newEvent.location || undefined,
                  eventDate: new Date(newEvent.eventDate).getTime(),
                  startTime: newEvent.startTime,
                  endTime: newEvent.endTime || undefined,
                  isRecurring: newEvent.isRecurring,
                });
              }}
              disabled={(!newEvent.titleVi && !newEvent.title) || !newEvent.eventDate || createEvent.isPending}
            >
              {t(lang, "add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
