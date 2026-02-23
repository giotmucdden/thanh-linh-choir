import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface BookingFormProps {
  selectedDate: Date;
  onSuccess: () => void;
}

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
    endTime: "",
    location: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      utils.bookings.getByDateRange.invalidate();
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBooking.mutate({
      ...form,
      eventDate: selectedDate.getTime(),
      requesterPhone: form.requesterPhone || undefined,
      endTime: form.endTime || undefined,
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
      {/* Selected date display */}
      <div className="bg-[var(--gold)/10] border border-[var(--gold)/30] rounded-lg px-4 py-3">
        <p className="font-['Be_Vietnam_Pro'] text-sm text-[var(--gold-dark)] font-medium">
          {t(lang, "booking_date")}: {format(selectedDate, "dd/MM/yyyy")}
        </p>
      </div>

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
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_start_time")} *</Label>
          <Input
            required
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
          />
        </div>
        <div>
          <Label className="font-['Be_Vietnam_Pro'] text-sm font-medium">{t(lang, "booking_end_time")}</Label>
          <Input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="mt-1 font-['Be_Vietnam_Pro']"
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
        disabled={createBooking.isPending}
        className="w-full bg-[var(--gold)] text-[oklch(0.15_0.03_240)] hover:bg-[var(--gold-light)] font-['Be_Vietnam_Pro'] font-semibold tracking-wide"
      >
        {createBooking.isPending ? t(lang, "loading") : t(lang, "booking_submit")}
      </Button>
    </form>
  );
}
