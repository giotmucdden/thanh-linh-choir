import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, AlertCircle, Info, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface BookingFormProps {
  selectedDate: Date;
  onSuccess: () => void;
}

// Convert "HH:MM" to total minutes from midnight
function toMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
// Convert minutes to "HH:MM"
function fromMins(mins: number): string {
  const c = Math.max(0, Math.min(mins, 1439));
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`;
}

// Block constants: 1h before + ~1h event + 1h after = 3h total
const BEFORE_BUFFER = 60;
const EVENT_DURATION = 60;
const AFTER_BUFFER = 60;

// Event time options: 07:00 – 20:00 (so block fits within 06:00–22:00)
const EVENT_TIME_OPTIONS = Array.from({ length: 27 }, (_, i) => fromMins(420 + i * 30)); // 07:00 → 20:00

export default function BookingForm({ selectedDate, onSuccess }: BookingFormProps) {
  const { lang } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    eventName: "",
    eventType: "mass" as "wedding" | "funeral" | "mass" | "concert" | "other",
    eventStartTime: "10:00",
    location: "",
    notes: "",
  });

  // Computed block times
  const blockStart = useMemo(() => fromMins(toMins(form.eventStartTime) - BEFORE_BUFFER), [form.eventStartTime]);
  const blockEnd = useMemo(() => fromMins(toMins(form.eventStartTime) + EVENT_DURATION + AFTER_BUFFER), [form.eventStartTime]);

  // Fetch existing time slots for the selected day
  const dayMs = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [selectedDate]);

  const { data: takenSlots = [] } = trpc.bookings.getTimeSlotsForDay.useQuery(
    { dayMs },
    { staleTime: 10_000 }
  );

  const utils = trpc.useUtils();
  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      utils.bookings.getByDateRange.invalidate();
      utils.bookings.getTimeSlotsForDay.invalidate({ dayMs });
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.message),
  });

  // Client-side overlap check
  const overlapError = useMemo(() => {
    const bStart = toMins(blockStart);
    const bEnd = toMins(blockEnd);
    for (const slot of takenSlots) {
      if (!slot.endTime) continue;
      const exStart = toMins(slot.startTime);
      const exEnd = toMins(slot.endTime);
      if (bStart < exEnd && bEnd > exStart) {
        return lang === "vi"
          ? `Khung giờ dự phòng ${blockStart}–${blockEnd} bị trùng với sự kiện "${slot.eventName}" (${slot.startTime}–${slot.endTime}).`
          : `Reserved block ${blockStart}–${blockEnd} overlaps with "${slot.eventName}" (${slot.startTime}–${slot.endTime}).`;
      }
    }
    return null;
  }, [blockStart, blockEnd, takenSlots, lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overlapError) { toast.error(overlapError); return; }
    createBooking.mutate({
      requesterName: form.requesterName,
      requesterEmail: form.requesterEmail,
      requesterPhone: form.requesterPhone || undefined,
      eventName: form.eventName,
      eventType: form.eventType,
      eventDate: selectedDate.getTime(),
      eventStartTime: form.eventStartTime,
      location: form.location || undefined,
      notes: form.notes || undefined,
    });
  };

  const eventTypes = [
    { value: "mass", label: t(lang, "event_mass") },
    { value: "wedding", label: t(lang, "event_wedding") },
    { value: "funeral", label: t(lang, "event_funeral") },
    { value: "concert", label: t(lang, "event_concert") },
    { value: "other", label: t(lang, "event_other") },
  ];

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-foreground mb-2">
          {lang === "vi" ? "Đã Gửi Thành Công!" : "Request Submitted!"}
        </h3>
        <p className="font-['Be_Vietnam_Pro'] text-muted-foreground text-sm">
          {t(lang, "booking_success")}
        </p>
        <Button
          className="mt-6 bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold"
          onClick={onSuccess}
        >
          {t(lang, "close")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selected date */}
      <div className="bg-[var(--gold)/10] border border-[var(--gold)/30] rounded-lg px-4 py-3">
        <p className="font-['Be_Vietnam_Pro'] text-sm text-[var(--gold-dark)] font-medium">
          {t(lang, "booking_date")}: {format(selectedDate, "EEEE, dd/MM/yyyy")}
        </p>
      </div>

      {/* Taken slots on this day */}
      {takenSlots.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="font-['Be_Vietnam_Pro'] text-xs font-semibold text-amber-700 dark:text-amber-400">
              {lang === "vi" ? "Khung giờ đã đặt trong ngày này:" : "Booked slots on this day:"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {takenSlots.map((slot) => (
              <Badge
                key={slot.id}
                variant="secondary"
                className="font-['Be_Vietnam_Pro'] text-xs bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30"
              >
                <Music className="w-3 h-3 mr-1" />
                {lang === "vi" ? "Lễ" : "Event"} {slot.eventStartTime} · {lang === "vi" ? "Khối" : "Block"} {slot.startTime}–{slot.endTime}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Event time picker */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-[var(--gold)]" />
          <span className="font-['Be_Vietnam_Pro'] text-sm font-semibold text-foreground">
            {lang === "vi" ? "Chọn giờ bắt đầu sự kiện" : "Select event start time"}
          </span>
        </div>

        {/* Event time selector */}
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-xs font-medium text-muted-foreground mb-1 block">
            {lang === "vi" ? "Giờ bắt đầu lễ / sự kiện *" : "Mass / Event start time *"}
          </Label>
          <Select value={form.eventStartTime} onValueChange={(v) => setForm({ ...form, eventStartTime: v })}>
            <SelectTrigger className="font-['Be_Vietnam_Pro'] text-sm w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-52">
              {EVENT_TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-['Be_Vietnam_Pro'] text-sm">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-computed block display */}
        <div className={`rounded-lg p-3 border ${overlapError ? "border-red-500/40 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
          <p className="font-['Be_Vietnam_Pro'] text-xs font-semibold mb-2 text-foreground">
            {lang === "vi" ? "Khung giờ dự phòng tự động (3 giờ):" : "Auto-reserved 3-hour block:"}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
              <p className="font-['Be_Vietnam_Pro'] text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                {lang === "vi" ? "Tập hát / Di chuyển" : "Practice / Travel"}
              </p>
              <p className="font-['Be_Vietnam_Pro'] text-sm font-bold text-foreground">{blockStart}</p>
              <p className="font-['Be_Vietnam_Pro'] text-[10px] text-muted-foreground">→ {form.eventStartTime}</p>
            </div>
            <div className="bg-[var(--gold)/15] border border-[var(--gold)/40] rounded-lg p-2">
              <p className="font-['Be_Vietnam_Pro'] text-[10px] text-[var(--gold-dark)] font-medium mb-0.5">
                {lang === "vi" ? "Sự kiện / Lễ" : "Event / Mass"}
              </p>
              <p className="font-['Be_Vietnam_Pro'] text-sm font-bold text-[var(--gold-dark)]">{form.eventStartTime}</p>
              <p className="font-['Be_Vietnam_Pro'] text-[10px] text-muted-foreground">~1h</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
              <p className="font-['Be_Vietnam_Pro'] text-[10px] text-purple-600 dark:text-purple-400 font-medium mb-0.5">
                {lang === "vi" ? "Dự phòng / Di chuyển" : "Buffer / Travel"}
              </p>
              <p className="font-['Be_Vietnam_Pro'] text-sm font-bold text-foreground">{fromMins(toMins(form.eventStartTime) + EVENT_DURATION)}</p>
              <p className="font-['Be_Vietnam_Pro'] text-[10px] text-muted-foreground">→ {blockEnd}</p>
            </div>
          </div>

          {overlapError ? (
            <div className="flex items-start gap-1.5 mt-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="font-['Be_Vietnam_Pro'] text-xs text-red-600">{overlapError}</p>
            </div>
          ) : (
            <p className="font-['Be_Vietnam_Pro'] text-[10px] text-emerald-600 mt-2 flex items-center gap-1">
              <span>✓</span>
              {lang === "vi"
                ? `Khung giờ ${blockStart}–${blockEnd} còn trống`
                : `Block ${blockStart}–${blockEnd} is available`}
            </p>
          )}
        </div>

        {/* Visual timeline */}
        <div className="relative h-8 bg-muted rounded-full overflow-hidden">
          {takenSlots.map((slot) => {
            if (!slot.endTime) return null;
            const DAY_START = 360; const DAY_END = 1320; const range = DAY_END - DAY_START;
            const left = ((toMins(slot.startTime) - DAY_START) / range) * 100;
            const width = ((toMins(slot.endTime) - toMins(slot.startTime)) / range) * 100;
            return (
              <div key={slot.id} className="absolute top-0 h-full bg-red-500/40 border-l border-r border-red-500/60"
                style={{ left: `${left}%`, width: `${width}%` }} title={`${slot.eventName}`} />
            );
          })}
          {/* Selected block */}
          {(() => {
            const DAY_START = 360; const DAY_END = 1320; const range = DAY_END - DAY_START;
            const bStartMins = toMins(blockStart); const bEndMins = toMins(blockEnd);
            const left = ((bStartMins - DAY_START) / range) * 100;
            const width = ((bEndMins - bStartMins) / range) * 100;
            const eventLeft = ((toMins(form.eventStartTime) - DAY_START) / range) * 100;
            const eventWidth = (EVENT_DURATION / range) * 100;
            return (
              <>
                <div className={`absolute top-0 h-full ${overlapError ? "bg-red-600/40" : "bg-[var(--gold)/40]"} border-l border-r ${overlapError ? "border-red-600" : "border-[var(--gold)]"} transition-all`}
                  style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100 - Math.max(0, left))}%` }} />
                <div className="absolute top-0 h-full bg-[var(--gold)] opacity-70"
                  style={{ left: `${Math.max(0, eventLeft)}%`, width: `${eventWidth}%` }} />
              </>
            );
          })()}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <span className="text-[9px] text-muted-foreground font-['Be_Vietnam_Pro']">06:00</span>
            <span className="text-[9px] text-muted-foreground font-['Be_Vietnam_Pro']">14:00</span>
            <span className="text-[9px] text-muted-foreground font-['Be_Vietnam_Pro']">22:00</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground font-['Be_Vietnam_Pro']">
          {lang === "vi" ? "🔴 Đã đặt  🟡 Khối dự phòng  🟠 Giờ sự kiện" : "🔴 Taken  🟡 Reserved block  🟠 Event time"}
        </p>
      </div>

      {/* Contact & Event details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_name")} *</Label>
          <Input required value={form.requesterName}
            onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
            placeholder={lang === "vi" ? "Nguyễn Văn A" : "John Doe"} />
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_email")} *</Label>
          <Input required type="email" value={form.requesterEmail}
            onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']" placeholder="email@example.com" />
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_phone")}</Label>
          <Input value={form.requesterPhone}
            onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']" placeholder="0912 345 678" />
        </div>
        <div className="col-span-2">
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_event_name")} *</Label>
          <Input required value={form.eventName}
            onChange={(e) => setForm({ ...form, eventName: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
            placeholder={lang === "vi" ? "Lễ cưới Nguyễn - Trần" : "Nguyen - Tran Wedding"} />
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_event_type")}</Label>
          <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v as typeof form.eventType })}>
            <SelectTrigger className="mt-1 font-['Be_Vietnam_Pro']"><SelectValue /></SelectTrigger>
            <SelectContent>
              {eventTypes.map((et) => (
                <SelectItem key={et.value} value={et.value} className="font-['Be_Vietnam_Pro']">{et.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_location")}</Label>
          <Input value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
            placeholder={lang === "vi" ? "Nhà thờ..." : "Church..."} />
        </div>
        <div className="col-span-2">
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_notes")}</Label>
          <Textarea value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro'] resize-none" rows={3}
            placeholder={lang === "vi" ? "Yêu cầu đặc biệt..." : "Special requests..."} />
        </div>
      </div>

      <Button
        type="submit"
        disabled={createBooking.isPending || !!overlapError}
        className="w-full bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold tracking-wide disabled:opacity-50"
      >
        {createBooking.isPending ? t(lang, "loading") : t(lang, "booking_submit")}
      </Button>
    </form>
  );
}
