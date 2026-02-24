import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Generate DMLV events: 13th of each month (Feast of Our Lady of La Vang)
// and first Sunday of each month
const now = new Date();
const events = [];

for (let m = 0; m < 12; m++) {
  const year = now.getFullYear();
  const month = now.getMonth() + m;
  const actualYear = year + Math.floor(month / 12);
  const actualMonth = month % 12;

  // 13th of each month - Feast of Our Lady of La Vang
  const feast = new Date(actualYear, actualMonth, 13, 8, 0, 0);
  events.push({
    title: `DMLV Mass - ${feast.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
    titleVi: `Lễ Đức Mẹ La Vang - Tháng ${actualMonth + 1}/${actualYear}`,
    description: "Thánh Lễ kính Đức Mẹ La Vang hàng tháng. Ca đoàn Thánh Linh phục vụ.",
    location: "Nhà thờ Đức Mẹ La Vang",
    eventDate: feast.getTime(),
    startTime: "08:00",
    endTime: "09:30",
    isRecurring: true,
    recurringDay: 13,
    isActive: true,
  });

  // First Sunday of each month - Regular mass
  const firstDay = new Date(actualYear, actualMonth, 1);
  const daysUntilSunday = (7 - firstDay.getDay()) % 7;
  const firstSunday = new Date(actualYear, actualMonth, 1 + daysUntilSunday, 10, 0, 0);
  if (firstSunday.getDate() !== 13) { // avoid duplicate with feast day
    events.push({
      title: `Sunday Mass - ${firstSunday.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
      titleVi: `Thánh Lễ Chúa Nhật - ${firstSunday.toLocaleDateString("vi-VN")}`,
      description: "Thánh Lễ Chúa Nhật đầu tháng. Ca đoàn Thánh Linh phục vụ.",
      location: "Nhà thờ Đức Mẹ La Vang",
      eventDate: firstSunday.getTime(),
      startTime: "10:00",
      endTime: "11:30",
      isRecurring: true,
      recurringDay: 0, // Sunday
      recurringWeek: 1, // First week
      isActive: true,
    });
  }
}

try {
  for (const event of events) {
    await connection.execute(
      `INSERT INTO dmlv_events (title, titleVi, description, location, eventDate, startTime, endTime, isRecurring, recurringDay, recurringWeek, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE updatedAt = NOW()`,
      [
        event.title, event.titleVi, event.description, event.location,
        event.eventDate, event.startTime, event.endTime,
        event.isRecurring ? 1 : 0,
        event.recurringDay ?? null,
        event.recurringWeek ?? null,
        event.isActive ? 1 : 0,
      ]
    );
  }
  console.log(`✅ Seeded ${events.length} DMLV events`);
} catch (err) {
  console.error("❌ Seed failed:", err.message);
} finally {
  await connection.end();
}
