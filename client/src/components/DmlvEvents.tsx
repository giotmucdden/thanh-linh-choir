import { format } from "date-fns";
import { useMemo } from "react";
import { vi as viLocale } from "date-fns/locale";
import { Calendar, Clock, MapPin, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";

export default function DmlvEvents() {
  const { lang } = useLang();
  const { startMs, endMs } = useMemo(() => {
    const now = new Date();
    const startMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endMs = startMs + 90 * 24 * 60 * 60 * 1000;
    return { startMs, endMs };
  }, []);

  const { data: events = [], isLoading } = trpc.dmlvEvents.getByDateRange.useQuery(
    { startMs, endMs },
    { staleTime: 60_000 }
  );

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-[var(--gold)/40] mx-auto mb-3" />
        <p className="font-['Be_Vietnam_Pro'] text-white/50 text-sm">
          {lang === "vi" ? "Chưa có sự kiện nào được lên lịch." : "No upcoming events scheduled."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => {
        const eventDate = new Date(event.eventDate);
        const isPast = eventDate < new Date();
        return (
          <Card
            key={event.id}
            className={`bg-white/5 border-white/10 hover:border-[var(--gold)/40] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 ${isPast ? "opacity-60" : ""}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--gold)/20] flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <Badge className="bg-[var(--gold)/20] text-[var(--gold)] border-[var(--gold)/30] text-[10px] font-['Be_Vietnam_Pro'] tracking-wider">
                  ĐMLV
                </Badge>
              </div>

              <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold text-white mb-1 leading-tight">
                {lang === "vi" && event.titleVi ? event.titleVi : event.title}
              </h3>

              {event.description && (
                <p className="font-['Be_Vietnam_Pro'] text-white/50 text-xs mb-3 line-clamp-2">
                  {event.description}
                </p>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar className="w-3.5 h-3.5 text-[var(--gold)]" />
                  <span className="font-['Be_Vietnam_Pro'] text-xs">
                    {format(eventDate, lang === "vi" ? "EEEE, dd/MM/yyyy" : "EEEE, MM/dd/yyyy", {
                      locale: lang === "vi" ? viLocale : undefined,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="w-3.5 h-3.5 text-[var(--gold)]" />
                  <span className="font-['Be_Vietnam_Pro'] text-xs">
                    {event.startTime}
                    {event.endTime ? ` – ${event.endTime}` : ""}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="w-3.5 h-3.5 text-[var(--gold)]" />
                    <span className="font-['Be_Vietnam_Pro'] text-xs truncate">{event.location}</span>
                  </div>
                )}
              </div>

              {event.isRecurring && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <span className="font-['Be_Vietnam_Pro'] text-[10px] text-[var(--gold)/70] tracking-wider uppercase">
                    {lang === "vi" ? "Sự kiện định kỳ" : "Recurring Event"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
