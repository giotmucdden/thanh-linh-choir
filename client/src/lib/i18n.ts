// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "vi" | "en";

// ─────────────────────────────────────────────────────────────────────────────
// Translation Definitions
// ─────────────────────────────────────────────────────────────────────────────

const viTranslations = {
  // Navigation
  nav_home: "Trang Chủ",
  nav_about: "Giới Thiệu",
  nav_gallery: "Hình Ảnh",
  nav_booking: "Đặt Lịch",
  nav_events: "Sự Kiện",
  nav_admin: "Quản Trị",
  nav_login: "Đăng Nhập",
  nav_logout: "Đăng Xuất",

  // Hero
  hero_title: "Ca Đoàn Thánh Linh",
  hero_subtitle: "Dâng Lên Tiếng Hát Ngợi Khen",
  hero_desc: "Ca đoàn Thánh Linh phục vụ Thiên Chúa qua tiếng hát, mang âm nhạc thiêng liêng đến mọi nghi lễ và sự kiện.",
  hero_cta_book: "Đặt Lịch Ngay",
  hero_cta_learn: "Tìm Hiểu Thêm",

  // About
  about_title: "Về Ca Đoàn",
  about_subtitle: "Phục Vụ Với Tình Yêu",
  about_desc: "Ca đoàn Thánh Linh được thành lập với sứ mệnh tôn vinh Thiên Chúa qua âm nhạc. Chúng tôi phục vụ tại các thánh lễ, đám cưới, lễ an táng và nhiều sự kiện tôn giáo khác.",
  about_stat_members: "Ca Viên",
  about_stat_years: "Năm Phục Vụ",
  about_stat_events: "Sự Kiện/Năm",

  // Gallery
  gallery_title: "Hình Ảnh Ca Đoàn",
  gallery_subtitle: "Những Khoảnh Khắc Đáng Nhớ",

  // Booking
  booking_title: "Đặt Lịch Ca Đoàn",
  booking_subtitle: "Chọn ngày và giờ phù hợp",
  booking_legend_available: "Còn trống",
  booking_legend_taken: "Đã đặt",
  booking_legend_dmlv: "Lễ ĐMLV",
  booking_form_title: "Thông Tin Đặt Lịch",
  booking_name: "Họ và Tên",
  booking_email: "Email",
  booking_phone: "Số Điện Thoại",
  booking_event_name: "Tên Sự Kiện",
  booking_event_type: "Loại Sự Kiện",
  booking_date: "Ngày",
  booking_start_time: "Giờ Bắt Đầu",
  booking_end_time: "Giờ Kết Thúc",
  booking_location: "Địa Điểm",
  booking_notes: "Ghi Chú",
  booking_submit: "Gửi Yêu Cầu",
  booking_success: "Yêu cầu đã được gửi! Chúng tôi sẽ liên hệ sớm.",
  booking_pending: "Chờ Xét Duyệt",
  booking_approved: "Đã Duyệt",
  booking_rejected: "Từ Chối",

  // Event types
  event_wedding: "Đám Cưới",
  event_funeral: "Lễ An Táng",
  event_mass: "Thánh Lễ",
  event_concert: "Buổi Hòa Nhạc",
  event_other: "Khác",

  // DMLV
  dmlv_title: "Lễ Đức Mẹ La Vang",
  dmlv_subtitle: "Sự Kiện Thường Kỳ",
  dmlv_location: "Nhà thờ Đức Mẹ La Vang",

  // Admin
  admin_title: "Quản Trị Ca Đoàn",
  admin_bookings: "Quản Lý Đặt Lịch",
  admin_members: "Ca Viên",
  admin_events: "Sự Kiện ĐMLV",
  admin_reminders: "Nhắc Nhở",
  admin_approve: "Duyệt",
  admin_reject: "Từ Chối",
  admin_pending: "Chờ Duyệt",
  admin_approved: "Đã Duyệt",
  admin_rejected: "Đã Từ Chối",
  admin_details: "Chi Tiết Sau Duyệt",
  admin_setlist: "Danh Sách Bài Hát",
  admin_setlist_type: "Nhập Danh Sách",
  admin_setlist_upload: "Tải Lên PDF",
  admin_uniform: "Đồng Phục",
  admin_agreement: "Thỏa Thuận",
  admin_save: "Lưu",
  admin_notes: "Ghi Chú Admin",

  // Uniforms
  uniform_formal_white: "Áo dài trắng trang trọng",
  uniform_formal_black: "Áo dài đen trang trọng",
  uniform_casual_blue: "Áo xanh thường ngày",
  uniform_liturgical: "Phụng vụ",
  uniform_custom: "Tùy chỉnh",

  // Reminders
  reminder_weekly: "Nhắc nhở hàng tuần",
  reminder_one_day: "Nhắc nhở 1 ngày trước",
  reminder_send: "Gửi Nhắc Nhở",
  reminder_sent: "Đã gửi nhắc nhở",

  // Common
  loading: "Đang tải...",
  save: "Lưu",
  cancel: "Hủy",
  close: "Đóng",
  edit: "Sửa",
  delete: "Xóa",
  add: "Thêm",
  search: "Tìm kiếm",
  confirm: "Xác nhận",
  back: "Quay lại",
  next: "Tiếp theo",
  submit: "Gửi",
  required: "Bắt buộc",
  optional: "Tùy chọn",
  actions: "Thao Tác",
  status: "Trạng Thái",
  date: "Ngày",
  time: "Giờ",
  name: "Tên",
  email: "Email",
  phone: "Điện Thoại",
  location: "Địa Điểm",
  notes: "Ghi Chú",
  no_data: "Không có dữ liệu",
  error: "Có lỗi xảy ra",
  success: "Thành công",
} as const;

const enTranslations: typeof viTranslations = {
  // Navigation
  nav_home: "Home",
  nav_about: "About",
  nav_gallery: "Gallery",
  nav_booking: "Book Us",
  nav_events: "Events",
  nav_admin: "Admin",
  nav_login: "Login",
  nav_logout: "Logout",

  // Hero
  hero_title: "Thánh Linh Choir",
  hero_subtitle: "Lifting Voices in Praise",
  hero_desc: "Thánh Linh Choir serves God through song, bringing sacred music to every liturgy and special occasion.",
  hero_cta_book: "Book Now",
  hero_cta_learn: "Learn More",

  // About
  about_title: "About the Choir",
  about_subtitle: "Serving with Love",
  about_desc: "Thánh Linh Choir was founded with the mission of glorifying God through music. We serve at masses, weddings, funerals, and many other religious events.",
  about_stat_members: "Members",
  about_stat_years: "Years Serving",
  about_stat_events: "Events/Year",

  // Gallery
  gallery_title: "Choir Gallery",
  gallery_subtitle: "Memorable Moments",

  // Booking
  booking_title: "Book the Choir",
  booking_subtitle: "Select an available date and time",
  booking_legend_available: "Available",
  booking_legend_taken: "Booked",
  booking_legend_dmlv: "DMLV Mass",
  booking_form_title: "Booking Information",
  booking_name: "Full Name",
  booking_email: "Email",
  booking_phone: "Phone Number",
  booking_event_name: "Event Name",
  booking_event_type: "Event Type",
  booking_date: "Date",
  booking_start_time: "Start Time",
  booking_end_time: "End Time",
  booking_location: "Location",
  booking_notes: "Notes",
  booking_submit: "Submit Request",
  booking_success: "Request submitted! We will contact you soon.",
  booking_pending: "Pending",
  booking_approved: "Approved",
  booking_rejected: "Rejected",

  // Event types
  event_wedding: "Wedding",
  event_funeral: "Funeral",
  event_mass: "Mass",
  event_concert: "Concert",
  event_other: "Other",

  // DMLV
  dmlv_title: "Đức Mẹ La Vang Mass",
  dmlv_subtitle: "Recurring Events",
  dmlv_location: "Đức Mẹ La Vang Church",

  // Admin
  admin_title: "Choir Administration",
  admin_bookings: "Manage Bookings",
  admin_members: "Choir Members",
  admin_events: "DMLV Events",
  admin_reminders: "Reminders",
  admin_approve: "Approve",
  admin_reject: "Reject",
  admin_pending: "Pending",
  admin_approved: "Approved",
  admin_rejected: "Rejected",
  admin_details: "Post-Approval Details",
  admin_setlist: "Song Setlist",
  admin_setlist_type: "Type Setlist",
  admin_setlist_upload: "Upload PDF",
  admin_uniform: "Uniform",
  admin_agreement: "Agreement",
  admin_save: "Save",
  admin_notes: "Admin Notes",

  // Uniforms
  uniform_formal_white: "Formal White Áo Dài",
  uniform_formal_black: "Formal Black Áo Dài",
  uniform_casual_blue: "Casual Blue",
  uniform_liturgical: "Liturgical",
  uniform_custom: "Custom",

  // Reminders
  reminder_weekly: "Weekly reminder",
  reminder_one_day: "1-day advance reminder",
  reminder_send: "Send Reminders",
  reminder_sent: "Reminders sent",

  // Common
  loading: "Loading...",
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  edit: "Edit",
  delete: "Delete",
  add: "Add",
  search: "Search",
  confirm: "Confirm",
  back: "Back",
  next: "Next",
  submit: "Submit",
  required: "Required",
  optional: "Optional",
  actions: "Actions",
  status: "Status",
  date: "Date",
  time: "Time",
  name: "Name",
  email: "Email",
  phone: "Phone",
  location: "Location",
  notes: "Notes",
  no_data: "No data available",
  error: "An error occurred",
  success: "Success",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export const translations = {
  vi: viTranslations,
  en: enTranslations,
} as const;

export type TranslationKey = keyof typeof viTranslations;

/**
 * Get a translated string for the given language and key.
 * Falls back to English if the Vietnamese translation is missing,
 * and falls back to the key itself if neither exists.
 */
export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

/**
 * Type-safe translation hook helper for components.
 * Returns a function that only requires the key parameter.
 */
export function createTranslator(lang: Lang) {
  return (key: TranslationKey): string => t(lang, key);
}
