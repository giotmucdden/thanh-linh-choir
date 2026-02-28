import { useState, useMemo, memo, useCallback } from "react";
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
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import BookingForm from "./BookingForm";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  type: "booking" | "dmlv";
  id: number;
  title: string;
  eventStartTime?: string | null;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  status?: string;
}

interface CalendarDayProps {
  day: Date;
  events: CalendarEvent[];
  currentMonth: Date;
  selectedDate: Date | null;
  lang: "vi" | "en";
  onClick: (day: Date) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DAY_NAMES = {
  vi: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const LEGEND_ITEMS = [
  { color: "bg-emerald-500/20 border-l-2 border-emerald-500", translationKey: "booking_legend_available" as const },
  { color: "bg-red-500/20 border-l-2 border-red-500", translationKey: "booking_legend_taken" as const },
  { color: "bg-[var(--gold)/20] border-l-2 border-[var(--gold)]", translationKey: "booking_legend_dmlv" as const },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function buildEventMap(
  bookings: Array<{
    id: number;
    status: string;
    eventDate: number;
    eventName: string;
    eventStartTime: string | null;
    startTime: string;
    endTime: string | null;
    location: string | null;
  }>,
  dmlvEvents: Array<{
    id: number;
    eventDate: number;
    title: string;
    titleVi: string | null;
    startTime: string;
    endTime: string | null;
    location: string | null;
  }>
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();

  for (const b of bookings) {
    if (b.status === "rejected") continue;
    const key = format(new Date(b.eventDate), "yyyy-MM-dd");
    const events = map.get(key) ?? [];
    events.push({
      type: "booking",
      id: b.id,
      title: b.eventName,
      eventStartTime: b.eventStartTime,
      startTime: b.startTime,
      endTime: b.endTime,
      location: b.location,
      status: b.status,
    });
    map.set(key, events);
  }

  for (const d of dmlvEvents) {
    const key = format(new Date(d.eventDate), "yyyy-MM-dd");
    const events = map.get(key) ?? [];
    events.push({
      type: "dmlv",
      id: d.id,
      title: d.titleVi ?? d.title,
      startTime: d.startTime,
      endTime: d.endTime,
      location: d.location,
    });
    map.set(key, events);
  }

  return map;
}

function getEventChipClasses(event: CalendarEvent): string {
  if (event.type === "dmlv") {
    return "bg-[var(--gold)/20] text-[var(--gold-dark)] border-[var(--gold)]";
  }
  if (event.status === "approved") {
    return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500";
  }
  return "bg-amber-500/15 text-amber-600 border-amber-500";
}

function getDayBackgroundClass(events: CalendarEvent[]): string {
  const hasDmlv = events.some((e) => e.type === "dmlv");
  const hasApproved = events.some((e) => e.type === "booking" && e.status === "approved");

  if (hasApproved) return "bg-red-500/8";
  if (hasDmlv) return "bg-[var(--gold)/8]";
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const Legend = memo(function Legend({ lang }: { lang: "vi" | "en" }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center mb-6">
      {LEGEND_ITEMS.map(({ color, translationKey }) => (
        <div key={translationKey} className="flex items-center gap-2">
          <div className={`w-5 h-4 rounded-sm ${color}`} />
          <span className="font-['Be_Vietnam_Pro'] text-sm text-muted-foreground">
            {t(lang, translationKey)}
          </span>
        </div>
      ))}
    </div>
  );
});

const CalendarHeader = memo(function CalendarHeader({
  currentMonth,
  lang,
  onPrevMonth,
  onNextMonth,
}: {
  currentMonth: Date;
  lang: "vi" | "en";
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[oklch(0.18_0.06_240)] text-white">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevMonth}
        className="text-white/70 hover:text-[var(--gold)] hover:bg-white/10"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold">
        {format(currentMonth, "MMMM yyyy", {
          locale: lang === "vi" ? viLocale : undefined,
        })}
      </h3>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNextMonth}
        className="text-white/70 hover:text-[var(--gold)] hover:bg-white/10"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
});

const DayNames = memo(function DayNames({ lang }: { lang: "vi" | "en" }) {
  return (
    <div className="grid grid-cols-7 border-b border-border">
      {DAY_NAMES[lang].map((d) => (
        <div
          key={d}
          className="text-center py-3 font-['Be_Vietnam_Pro'] text-xs font-semibold text-muted-foreground tracking-wider uppercase"
        >
          {d}
        </div>
      ))}
    </div>
  );
});

const EventChip = memo(function EventChip({
  event,
}: {
  event: CalendarEvent;
}) {
  return (
    <div
      className={`text-[10px] font-['Be_Vietnam_Pro'] rounded px-1 py-0.5 truncate border-l-2 leading-tight ${getEventChipClasses(event)}`}
    >
      {(event.eventStartTime || event.startTime) && (
        <span className="opacity-80 mr-0.5 font-semibold">
          {event.eventStartTime ?? event.startTime}
        </span>
      )}
      {event.title}
    </div>
  );
});

const CalendarDay = memo(function CalendarDay({
  day,
  events,
  currentMonth,
  selectedDate,
  lang,
  onClick,
}: CalendarDayProps) {
  const inMonth = isSameMonth(day, currentMonth);
  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
  const today = isToday(day);
  const bgClass = getDayBackgroundClass(events);

  const handleClick = useCallback(() => {
    if (inMonth) {
      onClick(day);
    }
  }, [day, inMonth, onClick]);

  return (
    <div
      onClick={handleClick}
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

      {/* Event chips */}
      <div className="space-y-0.5">
        {events.slice(0, 3).map((event, ei) => (
          <EventChip key={ei} event={event} />
        ))}
        {events.length > 3 && (
          <div className="text-[10px] font-['Be_Vietnam_Pro'] text-muted-foreground px-1">
            +{events.length - 3} {lang === "vi" ? "nữa" : "more"}
          </div>
        )}
      </div>
    </div>
  );
});

const DayDetailDialog = memo(function DayDetailDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedEvents,
  lang,
  onBookNow,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedEvents: CalendarEvent[];
  lang: "vi" | "en";
  onBookNow: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  <p className="font-['Be_Vietnam_Pro'] font-semibold text-foreground text-sm">
                    {event.title}
                  </p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {event.type === "booking" && event.eventStartTime && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Clock className="w-3 h-3 text-[var(--gold)]" />
                        <span>
                          {lang === "vi" ? "Lễ:" : "Event:"} {event.eventStartTime}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px]">
                        {lang === "vi" ? "Khối:" : "Block:"} {event.startTime}
                        {event.endTime ? `–${event.endTime}` : ""}
                      </span>
                    </div>
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
                  {event.type === "dmlv"
                    ? "ĐMLV"
                    : event.status === "approved"
                    ? t(lang, "booking_approved")
                    : t(lang, "booking_pending")}
                </Badge>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border mt-2">
            <p className="font-['Be_Vietnam_Pro'] text-xs text-muted-foreground mb-2">
              {lang === "vi"
                ? "Ngày này có thể có nhiều sự kiện. Bạn có thể đặt thêm khung giờ trống."
                : "Multiple events can be booked on the same day in different time slots."}
            </p>
            <Button
              className="w-full bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold"
              onClick={onBookNow}
            >
              {t(lang, "hero_cta_book")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

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

  const eventMap = useMemo(() => buildEventMap(bookings, dmlvEvents), [bookings, dmlvEvents]);

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      }),
    [monthStart, monthEnd]
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((m) => subMonths(m, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  const handleDayClick = useCallback(
    (day: Date) => {
      if (!isSameMonth(day, currentMonth)) return;
      setSelectedDate(day);
      const key = format(day, "yyyy-MM-dd");
      const events = eventMap.get(key) ?? [];
      if (events.length > 0) {
        setShowDayDetail(true);
      } else {
        setShowBookingForm(true);
      }
    },
    [currentMonth, eventMap]
  );

  const handleBookNow = useCallback(() => {
    setShowDayDetail(false);
    setShowBookingForm(true);
  }, []);

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedEvents = selectedKey ? (eventMap.get(selectedKey) ?? []) : [];

  return (
    <div className="w-full">
      <Legend lang={lang} />

      {/* Calendar */}
      <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        <CalendarHeader
          currentMonth={currentMonth}
          lang={lang}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
        <DayNames lang={lang} />

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const key = format(day, "yyyy-MM-dd");
            const events = eventMap.get(key) ?? [];
            return (
              <CalendarDay
                key={idx}
                day={day}
                events={events}
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                lang={lang}
                onClick={handleDayClick}
              />
            );
          })}
        </div>
      </div>

      {/* Day Detail Dialog */}
      <DayDetailDialog
        open={showDayDetail}
        onOpenChange={setShowDayDetail}
        selectedDate={selectedDate}
        selectedEvents={selectedEvents}
        lang={lang}
        onBookNow={handleBookNow}
      />

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
