CREATE TABLE `booking_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`setlistType` enum('typed','uploaded') DEFAULT 'typed',
	`setlistText` text,
	`setlistPdfUrl` varchar(1024),
	`setlistPdfKey` varchar(512),
	`uniformDescription` text,
	`uniformType` enum('formal_white','formal_black','casual_blue','liturgical','custom') DEFAULT 'formal_white',
	`agreementAccepted` boolean NOT NULL DEFAULT false,
	`additionalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterName` varchar(255) NOT NULL,
	`requesterEmail` varchar(320) NOT NULL,
	`requesterPhone` varchar(30),
	`eventName` varchar(255) NOT NULL,
	`eventType` enum('wedding','funeral','mass','concert','other') NOT NULL DEFAULT 'mass',
	`eventDate` bigint NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10),
	`location` varchar(255),
	`notes` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `choir_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(30),
	`voicePart` enum('soprano','alto','tenor','bass') DEFAULT 'soprano',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `choir_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dmlv_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleVi` varchar(255),
	`description` text,
	`location` varchar(255) DEFAULT 'Nhà thờ Đức Mẹ La Vang',
	`eventDate` bigint NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10),
	`isRecurring` boolean NOT NULL DEFAULT false,
	`recurringDay` int,
	`recurringWeek` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dmlv_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`eventId` int,
	`bookingId` int,
	`reminderType` enum('weekly','one_day','booking_approved','booking_rejected') NOT NULL,
	`scheduledAt` bigint NOT NULL,
	`sentAt` bigint,
	`isSent` boolean NOT NULL DEFAULT false,
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
