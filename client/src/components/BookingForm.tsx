import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, AlertCircle, Info } from "lucide-react";
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
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Generate time options every 30 minutes from 06:00 to 22:00
const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => fromMins(360 + i * 30)); // 06:00 → 22:00

export default function BookingForm({ selectedDate, onSuccess }: BookingFormProps) {
  const { lang } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    eventName: "",
    eventType: "mass" as "wedding" | "funeral" | "mass" | "concert" | "other",
    startTime: "09:00",
    endTime: "12:00",
    location: "",
    notes: "",
  });

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

  // Client-side validation
  const validationError = useMemo(() => {
    const startMins = toMins(form.startTime);
    const endMins = toMins(form.endTime);
    if (endMins <= startMins) {
      return lang === "vi"
        ? "Giờ kết thúc phải sau giờ bắt đầu."
        : "End time must be after start time.";
    }
    if (endMins - startMins < 180) {
      return lang === "vi"
        ? `Thời gian tối thiểu là 3 giờ. Hiện tại: ${endMins - startMins} phút.`
        : `Minimum duration is 3 hours. Current: ${endMins - startMins} min.`;
    }
    for (const slot of takenSlots) {
      if (!slot.endTime) continue;
      const exStart = toMins(slot.startTime);
      const exEnd = toMins(slot.endTime);
      if (startMins < exEnd && endMins > exStart) {
        return lang === "vi"
          ? `Khung giờ trùng với sự kiện "${slot.eventName}" (${slot.startTime}–${slot.endTime}).`
          : `Overlaps with "${slot.eventName}" (${slot.startTime}–${slot.endTime}).`;
      }
    }
    return null;
  }, [form.startTime, form.endTime, takenSlots, lang]);

  // Auto-set endTime to at least startTime + 3 hours when startTime changes
  const handleStartTimeChange = (value: string) => {
    const startMins = toMins(value);
    const currentEndMins = toMins(form.endTime);
    const minEndMins = startMins + 180;
    setForm({
      ...form,
      startTime: value,
      endTime: currentEndMins < minEndMins ? fromMins(Math.min(minEndMins, 1320)) : form.endTime,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    createBooking.mutate({
      ...form,
      eventDate: selectedDate.getTime(),
      requesterPhone: form.requesterPhone || undefined,
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

  const durationMins = toMins(form.endTime) - toMins(form.startTime);
  const durationDisplay = durationMins > 0
    ? `${Math.floor(durationMins / 60)}h${durationMins % 60 > 0 ? ` ${durationMins % 60}m` : ""}`
    : "—";

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
      {/* Selected date display */}
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
                <Clock className="w-3 h-3 mr-1" />
                {slot.startTime}–{slot.endTime} · {slot.eventName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Time slot picker */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-[var(--gold)]" />
          <span className="font-['Be_Vietnam_Pro'] text-sm font-semibold text-foreground">
            {lang === "vi" ? "Chọn khung giờ (tối thiểu 3 giờ)" : "Select time slot (min. 3 hours)"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="font-['Be_Vietnam_Pro'] text-xs font-medium text-muted-foreground mb-1 block">
              {t(lang, "booking_start_time")} *
            </Label>
            <Select value={form.startTime} onValueChange={handleStartTimeChange}>
              <SelectTrigger className="font-['Be_Vietnam_Pro'] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-52">
                {TIME_OPTIONS.filter((opt) => opt < "22:00").map((opt) => (
                  <SelectItem key={opt} value={opt} className="font-['Be_Vietnam_Pro'] text-sm">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-['Be_Vietnam_Pro'] text-xs font-medium text-muted-foreground mb-1 block">
              {t(lang, "booking_end_time")} *
            </Label>
            <Select
              value={form.endTime}
              onValueChange={(v) => setForm({ ...form, endTime: v })}
            >
              <SelectTrigger className="font-['Be_Vietnam_Pro'] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-52">
                {TIME_OPTIONS.filter((opt) => toMins(opt) >= toMins(form.startTime) + 180).map((opt) => (
                  <SelectItem key={opt} value={opt} className="font-['Be_Vietnam_Pro'] text-sm">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duration display */}
        <div className={`flex items-center gap-2 text-xs font-['Be_Vietnam_Pro'] px-1 ${
          validationError ? "text-red-500" : durationMins >= 180 ? "text-emerald-600" : "text-amber-600"
        }`}>
          {validationError ? (
            <><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationError}</>
          ) : (
            <><Clock className="w-3.5 h-3.5 shrink-0" />
              {lang === "vi" ? `Thời lượng: ${durationDisplay}` : `Duration: ${durationDisplay}`}
              {durationMins >= 180 && " ✓"}
            </>
          )}
        </div>

        {/* Visual timeline bar */}
        <div className="relative h-8 bg-muted rounded-full overflow-hidden mt-1">
          {/* Taken slots */}
          {takenSlots.map((slot) => {
            if (!slot.endTime) return null;
            const dayStart = 360; // 06:00
            const dayEnd = 1320; // 22:00
            const range = dayEnd - dayStart;
            const left = ((toMins(slot.startTime) - dayStart) / range) * 100;
            const width = ((toMins(slot.endTime) - toMins(slot.startTime)) / range) * 100;
            return (
              <div
                key={slot.id}
                className="absolute top-0 h-full bg-red-500/40 border-l border-r border-red-500/60"
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${slot.eventName} ${slot.startTime}–${slot.endTime}`}
              />
            );
          })}
          {/* Selected slot */}
          {durationMins > 0 && (() => {
            const dayStart = 360;
            const dayEnd = 1320;
            const range = dayEnd - dayStart;
            const left = ((toMins(form.startTime) - dayStart) / range) * 100;
            const width = ((durationMins) / range) * 100;
            return (
              <div
                className={`absolute top-0 h-full ${validationError ? "bg-red-600/50" : "bg-[var(--gold)/60]"} border-l border-r ${validationError ? "border-red-600" : "border-[var(--gold)]"} transition-all`}
                style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100 - Math.max(0, left))}%` }}
              />
            );
          })()}
          {/* Time labels */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <span className="text-[9px] text-muted-foreground font-['Be_Vietnam_Pro']">06:00</span>
            <span className="text-[9px] text-muted-foreground font-['Be_Vietnam_Pro']">14:00</span>
            <span className="text-[9px] text-muted-foreground font-['Be_Vietnam_Pro']">22:00</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground font-['Be_Vietnam_Pro']">
          {lang === "vi" ? "🔴 Đã đặt  🟡 Đang chọn" : "🔴 Taken  🟡 Your selection"}
        </p>
      </div>

      {/* Contact & Event details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_name")} *</Label>
          <Input
            required
            value={form.requesterName}
            onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
            placeholder={lang === "vi" ? "Nguyễn Văn A" : "John Doe"}
          />
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_email")} *</Label>
          <Input
            required
            type="email"
            value={form.requesterEmail}
            onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_phone")}</Label>
          <Input
            value={form.requesterPhone}
            onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
            placeholder="0912 345 678"
          />
        </div>
        <div className="col-span-2">
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_event_name")} *</Label>
          <Input
            required
            value={form.eventName}
            onChange={(e) => setForm({ ...form, eventName: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
            placeholder={lang === "vi" ? "Lễ cưới Nguyễn - Trần" : "Nguyen - Tran Wedding"}
          />
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_event_type")}</Label>
          <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v as typeof form.eventType })}>
            <SelectTrigger className="mt-1 font-['Be_Vietnam_Pro']">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((et) => (
                <SelectItem key={et.value} value={et.value} className="font-['Be_Vietnam_Pro']">
                  {et.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_location")}</Label>
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
            placeholder={lang === "vi" ? "Nhà thờ..." : "Church..."}
          />
        </div>
        <div className="col-span-2">
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_notes")}</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro'] resize-none"
            rows={3}
            placeholder={lang === "vi" ? "Yêu cầu đặc biệt..." : "Special requests..."}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={createBooking.isPending || !!validationError}
        className="w-full bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold tracking-wide disabled:opacity-50"
      >
        {createBooking.isPending ? t(lang, "loading") : t(lang, "booking_submit")}
      </Button>
    </form>
  );
}
