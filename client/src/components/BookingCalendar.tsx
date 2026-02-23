import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import BookingForm from "./BookingForm";

type CalendarEvent = {
  type: "booking" | "dmlv";
  id: number;
  title: string;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  status?: string;
};

export default function BookingCalendar() {
  const { lang } = useLang();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startMs = startOfWeek(monthStart, { weekStartsOn: 0 }).getTime();
  const endMs = endOfWeek(monthEnd, { weekStartsOn: 0 }).getTime();

  const { data: bookings = [] } = trpc.bookings.getByDateRange.useQuery(
    { startMs, endMs },
    { staleTime: 30_000 }
  );
  const { data: dmlvEvents = [] } = trpc.dmlvEvents.getByDateRange.useQuery(
    { startMs, endMs },
    { staleTime: 30_000 }
  );

  // Build event map by date string
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const b of bookings) {
      if (b.status === "rejected") continue;
      const key = format(new Date(b.eventDate), "yyyy-MM-dd");
      const events = map.get(key) ?? [];
      events.push({ type: "booking", id: b.id, title: b.eventName, startTime: b.startTime, endTime: b.endTime, location: b.location, status: b.status });
      map.set(key, events);
    }
    for (const d of dmlvEvents) {
      const key = format(new Date(d.eventDate), "yyyy-MM-dd");
      const events = map.get(key) ?? [];
      events.push({ type: "dmlv", id: d.id, title: d.titleVi ?? d.title, startTime: d.startTime, endTime: d.endTime, location: d.location });
      map.set(key, events);
    }
    return map;
  }, [bookings, dmlvEvents]);

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  });

  const dayNames = lang === "vi"
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    setSelectedDate(day);
    const key = format(day, "yyyy-MM-dd");
    const events = eventMap.get(key) ?? [];
    const hasApprovedBooking = events.some((e) => e.type === "booking" && e.status === "approved");
    if (hasApprovedBooking || events.some((e) => e.type === "dmlv")) {
      setShowDayDetail(true);
    } else {
      setShowBookingForm(true);
    }
  };

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedEvents = selectedKey ? (eventMap.get(selectedKey) ?? []) : [];

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {[
          { color: "bg-emerald-500/20 border-l-2 border-emerald-500", label: t(lang, "booking_legend_available") },
          { color: "bg-red-500/20 border-l-2 border-red-500", label: t(lang, "booking_legend_taken") },
          { color: "bg-[var(--gold)/20] border-l-2 border-[var(--gold)]", label: t(lang, "booking_legend_dmlv") },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-5 h-4 rounded-sm ${color}`} />
            <span className="font-['Be_Vietnam_Pro'] text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[oklch(0.18_0.06_240)] text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="text-white/70 hover:text-[var(--gold)] hover:bg-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold">
            {format(currentMonth, lang === "vi" ? "MMMM yyyy" : "MMMM yyyy", {
              locale: lang === "vi" ? viLocale : undefined,
            })}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="text-white/70 hover:text-[var(--gold)] hover:bg-white/10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-border">
          {dayNames.map((d) => (
            <div
              key={d}
              className="text-center py-3 font-['Be_Vietnam_Pro'] text-xs font-semibold text-muted-foreground tracking-wider uppercase"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const key = format(day, "yyyy-MM-dd");
            const events = eventMap.get(key) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const hasDmlv = events.some((e) => e.type === "dmlv");
            const hasApproved = events.some((e) => e.type === "booking" && e.status === "approved");
            const hasPending = events.some((e) => e.type === "booking" && e.status === "pending");
            const today = isToday(day);

            let bgClass = "";
            if (hasDmlv) bgClass = "bg-[var(--gold)/8]";
            if (hasApproved) bgClass = "bg-red-500/8";

            return (
              <div
                key={idx}
                onClick={() => inMonth && handleDayClick(day)}
                className={`
                  relative min-h-[80px] p-2 border-b border-r border-border/50 transition-all
                  ${inMonth ? "cursor-pointer hover:bg-accent/30" : "opacity-30 cursor-default"}
                  ${isSelected ? "ring-2 ring-inset ring-[var(--gold)]" : ""}
                  ${bgClass}
                `}
              >
                {/* Day number */}
                <div
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-['Be_Vietnam_Pro'] font-medium mb-1
                    ${today ? "bg-[var(--gold)] text-[oklch(0.15_0.03_240)] font-bold" : "text-foreground"}
                    ${!inMonth ? "text-muted-foreground" : ""}
                  `}
                >
                  {format(day, "d")}
                </div>

                {/* Event dots/chips */}
                <div className="space-y-0.5">
                  {hasDmlv && (
                    <div className="text-[10px] font-['Be_Vietnam_Pro'] bg-[var(--gold)/20] text-[var(--gold-dark)] rounded px-1 py-0.5 truncate border-l-2 border-[var(--gold)] leading-tight">
                      {events.find((e) => e.type === "dmlv")?.title}
                    </div>
                  )}
                  {hasApproved && (
                    <div className="text-[10px] font-['Be_Vietnam_Pro'] bg-red-500/15 text-red-600 dark:text-red-400 rounded px-1 py-0.5 truncate border-l-2 border-red-500 leading-tight">
                      {events.find((e) => e.type === "booking" && e.status === "approved")?.title}
                    </div>
                  )}
                  {hasPending && !hasApproved && (
                    <div className="text-[10px] font-['Be_Vietnam_Pro'] bg-amber-500/15 text-amber-600 rounded px-1 py-0.5 truncate border-l-2 border-amber-500 leading-tight">
                      {lang === "vi" ? "Chờ duyệt" : "Pending"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Cormorant_Garamond'] text-2xl">
              {selectedDate &&
                format(selectedDate, lang === "vi" ? "EEEE, dd MMMM yyyy" : "EEEE, MMMM dd yyyy", {
                  locale: lang === "vi" ? viLocale : undefined,
                })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {selectedEvents.map((event, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border-l-4 ${
                  event.type === "dmlv"
                    ? "bg-[var(--gold)/10] border-[var(--gold)]"
                    : event.status === "approved"
                    ? "bg-red-500/10 border-red-500"
                    : "bg-amber-500/10 border-amber-500"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-['Be_Vietnam_Pro'] font-semibold text-foreground text-sm">{event.title}</p>
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3" />
                      <span>
                        {event.startTime}
                        {event.endTime ? ` – ${event.endTime}` : ""}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 mt-0.5 text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] shrink-0 ${
                      event.type === "dmlv"
                        ? "bg-[var(--gold)/20] text-[var(--gold-dark)]"
                        : event.status === "approved"
                        ? "bg-red-500/20 text-red-600"
                        : "bg-amber-500/20 text-amber-600"
                    }`}
                  >
                    {event.type === "dmlv" ? "ĐMLV" : event.status === "approved" ? t(lang, "booking_approved") : t(lang, "booking_pending")}
                  </Badge>
                </div>
              </div>
            ))}
            <Button
              className="w-full bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold mt-2"
              onClick={() => { setShowDayDetail(false); setShowBookingForm(true); }}
            >
              {t(lang, "hero_cta_book")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Form Dialog */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Cormorant_Garamond'] text-2xl">
              {t(lang, "booking_form_title")}
            </DialogTitle>
          </DialogHeader>
          {selectedDate && (
            <BookingForm
              selectedDate={selectedDate}
              onSuccess={() => setShowBookingForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
