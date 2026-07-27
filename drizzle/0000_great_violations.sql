CREATE TABLE `pending_two_factor` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`openId` varchar(64) NOT NULL,
	`userName` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pending_two_factor_id` PRIMARY KEY(`id`),
	CONSTRAINT `pending_two_factor_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `two_factor_auth` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`method` enum('totp','sms') NOT NULL,
	`totpSecret` text,
	`phoneNumber` varchar(32),
	`isEnabled` boolean NOT NULL DEFAULT false,
	`backupCodes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `two_factor_auth_id` PRIMARY KEY(`id`),
	CONSTRAINT `two_factor_auth_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
