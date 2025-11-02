CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`shift_id` text,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`receipt` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`starting_cash` real DEFAULT 0 NOT NULL,
	`ending_cash` real,
	`total_sales` real DEFAULT 0,
	`total_transactions` integer DEFAULT 0,
	`total_expenses` real DEFAULT 0,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
