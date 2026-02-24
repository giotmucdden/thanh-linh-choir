# Thánh Linh Choir - Project TODO

## Phase 1: Database Schema & Migrations
- [x] Design and push database schema (bookings, dmlv_events, choir_members, reminders, booking_details)
- [x] Add server-side query helpers in db.ts
- [x] Add tRPC routers for all features

## Phase 2: Landing Page & Gallery
- [x] Global theme: deep navy/gold elegant palette with Vietnamese typography
- [x] Top navigation with bilingual labels and admin link
- [x] Hero section with animated choir title and CTA
- [x] Scrolling photo gallery with smooth animations (auto-scroll + hover pause)
- [x] About/Services section with stats
- [x] Footer with contact info

## Phase 3: Booking Calendar
- [x] Interactive monthly calendar view
- [x] Color-coded slots: available (green), taken (red), DMLV events (gold)
- [x] Click on available slot to open booking form
- [x] Booking submission form (name, contact, event type, date/time, notes)
- [x] Confirmation screen after submission

## Phase 4: Admin Panel
- [x] Admin login (role-based, protected routes)
- [x] Dashboard: pending/approved/rejected booking overview
- [x] Approve/reject booking actions with notification
- [x] Post-approval details form: PDF setlist upload or type, uniform selection, notes/agreements
- [x] Choir member management (ca vien list)
- [x] DMLV event management (add/edit/delete recurring events)

## Phase 5: Reminders & Bilingual
- [x] Automated reminder scheduling for DMLV mass events (1-week + 1-day)
- [x] Bilingual (Vietnamese/English) toggle throughout UI
- [x] Reminder management in admin panel
- [x] 24 DMLV events seeded (13th of each month + first Sunday, 12 months ahead)

## Phase 6: Polish & Delivery
- [x] Responsive design (mobile-first)
- [x] Smooth animations and micro-interactions
- [x] Write vitest unit tests (8 tests passing)
- [x] Save checkpoint and deliver

## Future Enhancements
- [ ] Real email/SMS notifications for reminders (requires email service integration)
- [ ] Choir member self-registration portal
- [ ] Event photo upload by admin
- [ ] PDF setlist viewer inline
- [ ] Automated weekly cron reminders (background job service)

## Multi-Slot Booking Update
- [x] Update bookings schema: add startTime + endTime columns (stored as HH:MM strings)
- [x] Update getBookingsByDateRange query to return time slots per day
- [x] Update booking router: validate no time overlap on same day, enforce 3-hour minimum
- [x] Update BookingCalendar: show multiple booked slots per day cell
- [x] Update BookingForm: time slot picker (start time + end time, min 3 hours, validates overlap)
- [x] Update Admin panel booking list to show time slots

## Event-Centered 3-Hour Block Update
- [x] Add eventStartTime column to bookings schema (the actual mass/event time)
- [x] Push DB migration
- [x] Update booking router: auto-compute block startTime = eventStartTime - 1h, endTime = eventStartTime + 2h
- [x] Update BookingForm: user picks event start time, shows computed block visually
- [x] Update calendar cells: show event start time (not block start time)
- [x] Update admin panel: show both event time and reserved block
- [x] Update vitest tests for new logic
