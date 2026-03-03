CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`attachmentUrls` text,
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleVi` varchar(255),
	`description` text,
	`location` varchar(255) DEFAULT 'Phòng tập ca đoàn',
	`sessionDate` bigint NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practice_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminder_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('booking','dmlv','announcement','practice') NOT NULL,
	`eventId` int,
	`recipientName` varchar(255),
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(500),
	`reminderType` varchar(50),
	`status` enum('sent','failed','skipped') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	`sentAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reminder_logs_id` PRIMARY KEY(`id`)
);
